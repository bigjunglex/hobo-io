import CONSTANTS, { EVENTS } from "../shared/constants.js";
import { Player } from "./entities/player.js";
import { Bullet } from "./entities/bullet.js";
import {  Grid, twoPhaseCollisions } from "./collisions.js";
import { Hazard } from "./entities/hazard.js";
import { BufferPool, BulletPool, getRandomCoords, getRandomCoordsCenter, idRegistry, ScoreMap } from "./utils.js";
import { createWebHazzard } from "./entities/hazards/web.js";
import { createPortalHazzard } from "./entities/hazards/portal.js";
import { createBoostHazzard } from "./entities/hazards/haste.js";
import { createShieldHazzard } from "./entities/hazards/shield.js";
import { createFlameHazzard } from "./entities/hazards/flame.js";
import { fireFormationEvent, mushroomMadnessEvent, portalProphecyEvent, shieldSlamEvent, slowdownEvent, webwarpEvent } from "./events.js";
import { DbRunner } from "./database/db-runner.js";
import { getRunner } from "./database/connect.js";
import * as uws from "uWebSockets.js"
import { writeChatMessagePacket, writeEventPacket, writeJoinPacket, writeNotifyPacket, writeUpdatePacket } from "../shared/messages.js";
import { Entity } from "./entities/entity.js";
import path from "node:path";
import { AOIWorkerPool } from "./workers/worker-pool.js";

type EffectApplicator = (p: Player) => void; 
type HazardTransformer = (hazards: Hazard[]) => void;

export class Game {
    public static registry = new idRegistry(CONSTANTS.MAX_ID); 
    private static scoreMap = new ScoreMap();
    public static encoder = new TextEncoder();
    public static decoder = new TextDecoder();
    private static serializedMap = new Map<number, SerializedEntity>();
    
    private sockets: Record<string, uws.WebSocket<Socket>>;
    private players: Record<string, Player>;
    private bullets: Bullet[];
    private lastUpdateTime: number;
    private shouldSendUpdate: boolean;
    private hazards: Hazard[];
    private bulletPool: BulletPool;
    private effectApplicator: EffectApplicator|null;
    private app: uws.TemplatedApp;
    private currentEvent: number;
    private db: DbRunner;
    private boundUpdate:() => void;
    private updateBuffers: BufferPool;
    private collisionGrid : Grid;
    private AoIGrid: Grid;
    private AoIPool: AOIWorkerPool;


    constructor(app: uws.TemplatedApp) {
        this.sockets = {};
        this.players = {};
        this.bullets = [];
        this.hazards = this.generateHazards();
        this.lastUpdateTime = performance.now();
        this.shouldSendUpdate = true;
        this.bulletPool = new BulletPool();
        this.effectApplicator = null;
        this.currentEvent = EVENTS.Null;
        this.db = getRunner();
        this.boundUpdate = this.update.bind(this);
        this.app = app;
        this.updateBuffers = new BufferPool(4096 * 3);
        this.collisionGrid = new Grid(90);
        this.AoIGrid = new Grid(700);
        this.AoIPool = this.initAOIpool();

        this.boundUpdate();
        setInterval(this.useRngEffect.bind(this), 1000 * 20);
    }

    addPlayer( socket: uws.WebSocket<Socket>, username: string, sprite: string ) {
        const id = socket.getUserData().id;
        this.sockets[id] = socket;

        const x = getRandomCoordsCenter();
        const y = getRandomCoordsCenter();
        const time = Date.now();
        this.players[id] = new Player(id, username, x, y, sprite);

        console.log(time, ' -- Player joined: ', id )

        if (this.effectApplicator && this.currentEvent) {
            this.effectApplicator(this.players[id]);
        }

        const packet = writeNotifyPacket({ username, time, id }, true, Game.encoder) 
        setImmediate(() => this.app.publish(CONSTANTS.NOTIFY_CHANNEL, packet, true));
    }

    removePlayer( socket: uws.WebSocket<Socket> ) {
        const id = socket.getUserData().id;
        const username = this.players[id]?.username ?? '';
        const time = Date.now()

        delete this.sockets[id];
        delete this.players[id];

        const packet = writeNotifyPacket({ username, time, id }, false, Game.encoder);
        const score = Game.scoreMap.retrieve(id);

        setImmediate(() => this.app.publish(CONSTANTS.NOTIFY_CHANNEL, packet, true));
        setImmediate(() => this.db.insertScore(score, username));
    }

    getIdMap(): Record<string, string> {
        const players = this.players;
        const map: Record<string, string> = {};
        for (let id of Object.keys(players)) {
            map[id] = players[id].username;
        }

        return map;
    }

    handleInput(socket: uws.WebSocket<Socket>, dir: number) {
        const player = this.players[socket.getUserData().id];
        if (player) player.setDirection(dir)
    }

    update():void {
        const now = performance.now();
        const dt = (now - this.lastUpdateTime) / 1000;
        this.lastUpdateTime = now;


        const bulletsToRemove:Bullet[] = [];
        this.bullets.forEach(bullet => {
            if (bullet.update(dt)) {
                bulletsToRemove.push(bullet);
                Game.registry.release(bullet.id);
                this.bulletPool.release(bullet);
            }
        })
        this.bullets = this.bullets.filter(b => !bulletsToRemove.includes(b))

        Object.keys(this.sockets).forEach(id => {
            const player = this.players[id];
            const newBulletReq = player.update(dt);
            if (newBulletReq){
                const id = Game.registry.getId()
                const newBullet = this.bulletPool.recieve(player.id, id, player.x, player.y, player.direction)
                this.bullets.push(newBullet);
            }
        })

        // const destroyedBullets: Bullet[] = applyCollisions(
        //     Object.values(this.players),
        //     this.bullets,
        //     this.hazards
        // );

        const destroyedBullets = twoPhaseCollisions(
            Object.values(this.players),
            this.bullets,
            this.hazards,
            this.collisionGrid
        )

        destroyedBullets.forEach(b => {
            const player = this.players[b.parentID]
            if (player) player.onDealtDamage();
            const id = b.id;
            this.bulletPool.release(b);
            Game.registry.release(id);
        })

        this.bullets = this.bullets.filter(b => !destroyedBullets.includes(b))

        Object.keys(this.sockets).forEach(id => {
            const player = this.players[id];
            if (player.hp <= 0) {
                const x = getRandomCoordsCenter();
                const y = getRandomCoordsCenter();
                Game.scoreMap.update(player.id, player.score);
                player.respawn(x, y);
            }
        })

        if (this.shouldSendUpdate) {
            const c = Object.keys(this.players).length;

            if (c) {
                Game.serializedMap.clear();
                this.AoIGrid.clear()
                // const state = this.serializeState();
                this.bullets.forEach(e => this.AoIGrid.insert(e, CONSTANTS.BULLET_RADIUS));
                this.hazards.forEach(e => this.AoIGrid.insert(e, CONSTANTS.BULLET_RADIUS));
                Object.values(this.players).forEach(e => this.AoIGrid.insert(e, CONSTANTS.BULLET_RADIUS));

                const leaderboard = this.getLeaderboard();
                const buf = this.serializeState(now, c, leaderboard)
                this.AoIPool.createUpdates(Object.keys(this.players).map(x => +x), buf)

                // OLD ITERATION
                // Object.keys(this.sockets).forEach(id => {
                //         const socket = this.sockets[id];
                //         const player = this.players[id];
                //         const update = this.createUpdate(player, leaderboard, c, now);
                //         const buf = this.updateBuffers.getBuf();
                //         const packet = writeUpdatePacket(update, buf);

                //         this.updateBuffers.release(buf);
                //         process.nextTick(() => socket.send(packet, true));
                // })
                this.shouldSendUpdate = false;
            }
        } else {
            this.AoIGrid.clear();
            this.shouldSendUpdate = true;
        }
        
        setTimeout(this.boundUpdate, Math.max(0, CONSTANTS.TICK_RATE - dt))
    }

    // pre theads + AOIgrid implementation
    // serializeState(): GlobalState {
    //     const players = Object.values(this.players).map(p => p.serializeForUpdate());
    //     const bullets = this.bullets.map(b => b.serializeForUpdate());
    //     const hazards = this.hazards.map(h => h.serializeForUpdate());

    //     return {
    //         t: performance.now(),
    //         players,
    //         bullets,
    //         hazards,
    //         leaderboard: this.getLeaderboard(),
    //     }
    // }

    serializeState(t: number, c: number, leaderboard: Score[]): Uint8Array<ArrayBufferLike> {
        const dataEntity: [number, number, Entity[]][] = [];
        for (const p of Object.values(this.players)) {
            const id = p.id
            const score = Math.round(p.score);
            const set = [...this.AoIGrid.getNearBy(p.x, p.y, CONSTANTS.AOI_RADIUS)];
            dataEntity.push([id, score, set])
        }

        const data: DecodedEntry = {
            t,
            c,
            leaderboard,
            dataEntity
        }

        const encodedEntity = Game.encoder.encode(JSON.stringify(data, (key, value) => {
            if (key.includes('Timeout')) {
                return undefined
            }
            return value
        }));

        return encodedEntity
    }

    // createUpdate(player: Player, leaderboard: Score[], c: number, t: number): GameState {
        // const me = state.players.find(p => p.id === player.id)!;
        // const score = this.players[me.id].score;
        // const cache = Game.serializedMap;
        // const nearbyPlayers = state.players.filter(
        //     p => p.id !== me.id &&
        //     distanceToSq(p.x, p.y, me.x, me.y) <=  radius// CONSTANTS.MAP_SIZE_SQ / 5
        // );

        // const nearbyBullets = state.bullets.filter(
        //     b => distanceToSq(b.x, b.y, me.x, me.y) <= radius //CONSTANTS.MAP_SIZE_SQ / 5
        // )

        // const nearbyHazzards = state.hazards.filter(
        //     h => distanceToSq(h.x, h.y, me.x, me.y) <= radius// CONSTANTS.MAP_SIZE_SQ / 5
        // )
        // const score = Math.round(this.players[player.id].score);
        // let me;
        // if (cache.has(player.id)) {
        //     me = cache.get(player.id)
        // } else { 
        //     me = player.serializeForUpdate();
        //     cache.set(player.id, me);
        // }

        // const update: GameState = {
        //     t,
        //     me: me as Player,
        //     others: [],
        //     bullets: [],
        //     hazards: [],
        //     leaderboard,
        //     c,
        //     score,
        // }

        // const entities = this.AoIGrid.getNearBy(player.x, player.y, CONSTANTS.AOI_RADIUS);
        // for (const e of entities) {
        //     if (player.distanceToSq(e) > CONSTANTS.SQR_AOI_RAD) continue;

        //     let entry;
        //     if (cache.has(e.id)) {
        //         entry = cache.get(e.id);
        //     } else {
        //         entry = e.serializeForUpdate();
        //         cache.set(e.id, entry);
        //     }

        //     if (e instanceof Player) {
        //         if (e.id === player.id) continue;
        //         update.others.push(entry as Player);
        //     }
        //     if (e instanceof Bullet) update.bullets.push(entry as SerializedEntity);
        //     if (e instanceof Hazard) update.hazards.push(entry as SerializedHazard)
        // }


        // return update
        // return {
        //     t: performance.now(),
        //     me: me,
        //     others: nearbyPlayers,
        //     bullets: nearbyBullets,
        //     hazards: nearbyHazzards,
        //     leaderboard: state.leaderboard,
        //     c,
        //     score: Math.round(score)
        // }
    // }


    getLeaderboard(): Score[] {
        return Object.values(this.players)
            .sort((p1, p2) => p2.score - p1.score)
            .slice(0,5)
            .map( p => ({id: p.id, score: Math.round(p.score)}))
    }
    /**
     * needs better hazzards generator TODO
     */
    generateHazards(): Hazard[] {
        const hazards: Hazard[] = []

        for (let i = 0; i < CONSTANTS.BASE_HAZARD_COUNT; i++) {
            const web = createWebHazzard(getRandomCoords(), getRandomCoords(), Game.registry);
            const flame = createFlameHazzard(getRandomCoords(), getRandomCoords(), Game.registry);
            
            if (i % 2 === 0) {
                const haste = createBoostHazzard(getRandomCoords(), getRandomCoords(), Game.registry);
                const shield = createShieldHazzard(getRandomCoords(), getRandomCoords(), Game.registry);
                const portal = createPortalHazzard(getRandomCoords(), getRandomCoords(), Game.registry);
                hazards.push(portal, haste, shield);
            }

            hazards.push(web, flame);
        }

        return hazards
    }

    chatMessage(socket:uws.WebSocket<Socket>, message: string) {
        const username = this.players[socket.getUserData().id].username;
        const time = Date.now();
        const packet = writeChatMessagePacket({ username, message, time }, Game.encoder);
        setImmediate(() => this.app.publish(CONSTANTS.NOTIFY_CHANNEL, packet, true));
    }

    getTopScores() {
        return this.db.getTopScores();
    }

    playerEffectEvent(applicator: EffectApplicator, remover: EffectApplicator, t: number, eventName: number) {
        this.currentEvent = eventName;
        this.effectApplicator = applicator;
        
        for (const p of Object.values(this.players)) {
            applicator(p)
        }

        const packet = writeEventPacket(eventName);
        this.app.publish(CONSTANTS.NOTIFY_CHANNEL, packet, true)

        setTimeout(() => {
            for (const p of Object.values(this.players)) {
                remover(p)
            }
            this.effectApplicator = null;
            this.currentEvent = EVENTS.Null;
        }, t)
    }

    hazardEffectEvent(transformer: HazardTransformer, t: number, eventName: EVENTS) {
        const hazards = [ ...this.hazards ];
        transformer(this.hazards);
        const packet = writeEventPacket(eventName);
        this.app.publish(CONSTANTS.NOTIFY_CHANNEL, packet, true)
        
        setTimeout(() => {
            const toDelete = this.hazards.filter(h => !hazards.includes(h));
            toDelete.forEach(h => Game.registry.release(h.id));
            this.hazards = hazards;
        }, t);
    }


    useRngEffect() {
        const number = Math.floor(Math.random() * 6) + 1;
        switch (number) {
            case 1: {
                const eventName = EVENTS.SLOW_DOWN;
                const [applicator, remover, t] = slowdownEvent();
                this.playerEffectEvent(applicator, remover, t, eventName);
                break;
            }
            case 2: {
                const eventName = EVENTS.WEB_WARP;
                const [transformer, t] = webwarpEvent(Game.registry); 
                this.hazardEffectEvent(transformer, t, eventName);
                break;
            }
            case 3: {
                const eventName = EVENTS.FIRE_FORMATION;
                const [transformer, t] = fireFormationEvent(Game.registry); 
                this.hazardEffectEvent(transformer, t, eventName);
                break;
            }
            case 4: {
                const eventName = EVENTS.PORTAL_PROPHECY;
                const [transformer, t] = portalProphecyEvent(Game.registry); 
                this.hazardEffectEvent(transformer, t, eventName);
                break;
            }
            case 5: {
                const eventName = EVENTS.MUSHROOM_MADNESS;
                const [transformer, t] = mushroomMadnessEvent(Game.registry); 
                this.hazardEffectEvent(transformer, t, eventName);
                break;
            }
            case 6: {
                const eventName = EVENTS.SHIELD_SLAM;
                const [transformer, t] = shieldSlamEvent(Game.registry); 
                this.hazardEffectEvent(transformer, t, eventName);
                break;
            }
        }
    }

    private initAOIpool() {
        const resolve = (data: AoiWorkerReturn) => {
            for (const entry of Object.entries(data)) {
                const [id, packet] = entry;
                const socket = this.sockets[+id];
                if (socket) {
                    socket.send(packet, true)
                }
            }
        }

        return new AOIWorkerPool(path.resolve('./dist/server/workers/AOI-worker.js'), resolve)
    }
}