import CONSTANTS from "../shared/constants.js";
import { Player } from "./entities/player.js";
import { Bullet } from "./entities/bullet.js";
import { applyCollisions } from "./collisions.js";
import { Hazard } from "./entities/hazard.js";
import { BulletPool, distanceToSq, getRandomCoords, getRandomCoordsCenter } from "./utils.js";
import { createWebHazzard } from "./entities/hazards/web.js";
import { createPortalHazzard } from "./entities/hazards/portal.js";
import { createBoostHazzard } from "./entities/hazards/haste.js";
import { createShieldHazzard } from "./entities/hazards/shield.js";
import { createFlameHazzard } from "./entities/hazards/flame.js";
import { fireFormationEvent, mushroomMadnessEvent, portalProphecyEvent, shieldSlamEvent, slowdownEvent, webwarpEvent } from "./events.js";
import { DbRunner } from "./database/db-runner.js";
import { getRunner } from "./database/connect.js";
import * as uws from "uWebSockets.js"

type EffectApplicator = (p: Player) => void; 
type HazardTransformer = (hazards: Hazard[]) => void;

export class Game {
    private sockets: Record<string, uws.WebSocket<Socket>>;
    private players: Record<string, Player>;
    private bullets: Bullet[];
    private lastUpdateTime: number;
    private shouldSendUpdate: boolean;
    private hazards: Hazard[];
    private bulletPool: BulletPool;
    private effectApplicator: EffectApplicator|null;
    private currentEvent: string|null;
    private db: DbRunner;

    constructor() {
        this.sockets = {};
        this.players = {};
        this.bullets = [];
        this.hazards = this.generateHazards();
        this.lastUpdateTime = Date.now();
        this.shouldSendUpdate = false;
        this.bulletPool = new BulletPool();
        this.effectApplicator = null;
        this.currentEvent = null;
        this.db = getRunner();

        setInterval(this.update.bind(this), 1000 / 40); // тик дрифтит, хз насколько важно
        setInterval(this.useRngEffect.bind(this), 1000 * 20);
    }

    addPlayer( socket: uws.WebSocket<Socket>, username: string, sprite: string ) {
        const id = socket.getUserData().id;
        this.sockets[id] = socket;

        console.log(sprite)
        const x = getRandomCoordsCenter();
        const y = getRandomCoordsCenter();
        const time = new Date().toISOString();
        this.players[id] = new Player(id, username, x, y, sprite);

        console.log(time, ' -- Player joined: ', id )

        if (this.effectApplicator && this.currentEvent) {
            this.effectApplicator(this.players[id]);
            // socket.send(CONSTANTS.MSG_TYPES.NOTIFY_EVENT, this.currentEvent)
        }

        // this.io.emit(CONSTANTS.MSG_TYPES.NOTIFY_JOIN, { username, time }) 
    }

    removePlayer( socket: uws.WebSocket<Socket> ) {
        const id = socket.getUserData().id;
        const username = this.players[id]?.username ?? '';
        const time = Date.now()

        delete this.sockets[id];
        delete this.players[id];

        // this.io.emit(CONSTANTS.MSG_TYPES.NOTIFY_LEFT, { username, time } satisfies NotifyMessage  )
    }

    handleInput(socket: uws.WebSocket<Socket>, dir: number) {
        const player = this.players[socket.getUserData().id];
        if (player) player.setDirection(dir)
    }

    update():void {
        const now = Date.now();
        const dt = (now - this.lastUpdateTime) / 1000;
        this.lastUpdateTime = now;

        const bulletsToRemove:Bullet[] = [];
        this.bullets.forEach(bullet => {
            if (bullet.update(dt)) {
                bulletsToRemove.push(bullet);
                this.bulletPool.release(bullet);
            }
        })
        this.bullets = this.bullets.filter(b => !bulletsToRemove.includes(b))

        Object.keys(this.sockets).forEach(id => {
            const player = this.players[id];
            const newBulletReq = player.update(dt);
            if (newBulletReq){
                const newBullet = this.bulletPool.recieve(player.id, player.x, player.y, player.direction)
                this.bullets.push(newBullet);
            }
        })


        const destroyedBullets: Bullet[] = applyCollisions(
            Object.values(this.players),
            this.bullets,
            this.hazards
        );

        destroyedBullets.forEach(b => {
            const player = this.players[b.parentID]
            if (player) player.onDealtDamage();
            this.bulletPool.release(b)
        })

        this.bullets = this.bullets.filter(b => !destroyedBullets.includes(b))

        Object.keys(this.sockets).forEach(id => {
            const socket = this.sockets[id];
            const player = this.players[id];
            if (player.hp <= 0) {
                const x = getRandomCoordsCenter();
                const y = getRandomCoordsCenter();
                this.db.insertScore(player.score, player.username);
                player.respawn(x, y)
                // socket.emit(CONSTANTS.MSG_TYPES.NOTIFY_EVENT, 'death')
            }
        })

        if (this.shouldSendUpdate) {
            const state = this.serializeState();
            Object.keys(this.sockets).forEach(id => {
                    const socket = this.sockets[id];
                    const player = this.players[id];
                    const update = this.createUpdate(player, state);
                    // process.nextTick(() =>
                    //     socket.send(
                    //         CONSTANTS.MSG_TYPES.GAME_UPDATE,
                    //         update
                    //     )
                    // )
            })
            this.shouldSendUpdate = false;
        } else {
            this.shouldSendUpdate = true;
        }
    }

    serializeState(): GlobalState {
        const players = Object.values(this.players).map(p => p.serializeForUpdate());
        const bullets = this.bullets.map(b => b.serializeForUpdate());
        const hazards = this.hazards.map(h => h.serializeForUpdate());

        return {
            t: Date.now(),
            players,
            bullets,
            hazards,
            leaderboard: this.getLeaderboard(),
        }
    }

    createUpdate(player: Player, state: GlobalState): GameState {
        const me = state.players.find(p => p.id === player.id)!;
        const score = this.players[me.id].score;
        const radius = 900 ** 2
        const nearbyPlayers = state.players.filter(
            p => p.id !== me.id &&
            distanceToSq(p.x, p.y, me.x, me.y) <=  radius// CONSTANTS.MAP_SIZE_SQ / 5
        );

        const nearbyBullets = state.bullets.filter(
            b => distanceToSq(b.x, b.y, me.x, me.y) <= radius //CONSTANTS.MAP_SIZE_SQ / 5
        )

        const nearbyHazzards = state.hazards.filter(
            h => distanceToSq(h.x, h.y, me.x, me.y) <= radius// CONSTANTS.MAP_SIZE_SQ / 5
        )

        return {
            t: Date.now(),
            me: me,
            others: nearbyPlayers,
            bullets: nearbyBullets,
            hazards: nearbyHazzards,
            leaderboard: state.leaderboard,
            c: Object.keys(this.players).length,
            score: Math.round(score)
        }
    }


    getLeaderboard(): Score[] {
        return Object.values(this.players)
            .sort((p1, p2) => p2.score - p1.score)
            .slice(0,5)
            .map( p => ({username: p.username, score: Math.round(p.score)}))
    }

    generateHazards(): Hazard[] {
        const hazards: Hazard[] = []

        for (let i = 0; i < CONSTANTS.BASE_HAZARD_COUNT; i++) {
            const web = createWebHazzard(getRandomCoords(), getRandomCoords());
            const flame = createFlameHazzard(getRandomCoords(), getRandomCoords());
            
            if (i % 2 === 0) {
                const haste = createBoostHazzard(getRandomCoords(), getRandomCoords());
                const shield = createShieldHazzard(getRandomCoords(), getRandomCoords());
                const portal = createPortalHazzard(getRandomCoords(), getRandomCoords());
                hazards.push(portal, haste, shield);
            }

            hazards.push(web, flame);
        }

        return hazards
    }

    chatMessage(socket:uws.WebSocket<Socket>, message: string) {
        const username = this.players[socket.getUserData().id].username;
        const time = Date.now();
        
        // this.io.emit(CONSTANTS.MSG_TYPES.CHAT_MESSAGE, { username, message, time} satisfies ChatMessage)
    }

    getTopScores() {
        return this.db.getTopScores();
    }

    playerEffectEvent(applicator: EffectApplicator, remover: EffectApplicator, t: number, eventName: string) {
        this.currentEvent = eventName;
        this.effectApplicator = applicator;
        
        for (const p of Object.values(this.players)) {
            applicator(p)
        }

        // this.io.emit(CONSTANTS.MSG_TYPES.NOTIFY_EVENT, eventName)

        setTimeout(() => {
            for (const p of Object.values(this.players)) {
                remover(p)
            }
            this.effectApplicator = null;
            this.currentEvent = null;
        }, t)
    }

    hazardEffectEvent(transformer: HazardTransformer, t: number, eventName: string) {
        const hazards = [ ...this.hazards ];
        transformer(this.hazards);
        // this.io.emit(CONSTANTS.MSG_TYPES.NOTIFY_EVENT, eventName)
        setTimeout(() => this.hazards = hazards, t);
    }

    useRngEffect() {
        const number = Math.floor(Math.random() * 6) + 1;
        switch (number) {
            case 1: {
                const eventName = 'SLOW DOWN'
                const [applicator, remover, t] = slowdownEvent();
                this.playerEffectEvent(applicator, remover, t, eventName);
                break;
            }
            case 2: {
                const eventName = 'WEB WARP'
                const [transformer, t] = webwarpEvent(); 
                this.hazardEffectEvent(transformer, t, eventName)
                break;
            }
            case 3: {
                const eventName = 'FIRE FORMATION'
                const [transformer, t] = fireFormationEvent(); 
                this.hazardEffectEvent(transformer, t, eventName)
                break;
            }
            case 4: {
                const eventName = 'PORTAL PROPHECY'
                const [transformer, t] = portalProphecyEvent(); 
                this.hazardEffectEvent(transformer, t, eventName)
                break;
            }
            case 5: {
                const eventName = 'MUSHROOM MADNESS'
                const [transformer, t] = mushroomMadnessEvent(); 
                this.hazardEffectEvent(transformer, t, eventName)
                break;
            }
            case 6: {
                const eventName = 'SHIELD SLAM'
                const [transformer, t] = shieldSlamEvent(); 
                this.hazardEffectEvent(transformer, t, eventName)
                break;
            }
        }
    }
}