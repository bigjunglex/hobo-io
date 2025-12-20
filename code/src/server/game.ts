import CONSTANTS from "../shared/constants.js";
import { Player } from "./entities/player.js";
import { Bullet } from "./entities/bullet.js";
import { type Socket } from "socket.io";
import { applyCollisions } from "./collisions.js";
import { Hazard } from "./entities/hazard.js";
import { BulletPool, distanceToSq, getRandomCoords, getRandomCoordsCenter, Grid } from "./utils.js";
import { createWebHazzard } from "./entities/hazards/web.js";
import { createPortalHazzard } from "./entities/hazards/portal.js";
import { createBoostHazzard } from "./entities/hazards/haste.js";
import { createShieldHazzard } from "./entities/hazards/shield.js";
import { createFlameHazzard } from "./entities/hazards/flame.js";


export class Game {
    private sockets: Record<string, Socket>;
    private players: Record<string, Player>;
    private bullets: Bullet[];
    private lastUpdateTime: number;
    private shouldSendUpdate: boolean;
    private hazards: Hazard[];
    private bulletPool: BulletPool;

    constructor() {
        this.sockets = {};
        this.players = {};
        this.bullets = [];
        this.hazards = this.generateHazards();
        this.lastUpdateTime = Date.now();
        this.shouldSendUpdate = false;
        this.bulletPool = new BulletPool();
        setInterval(this.update.bind(this), 1000 / 40);
    }

    addPlayer( socket:Socket, username: string, sprite: string ) {
        this.sockets[socket.id] = socket;

        const x = getRandomCoordsCenter();
        const y = getRandomCoordsCenter();
        this.players[socket.id] = new Player(socket.id, username, x, y, sprite);
    }

    removePlayer( socket: Socket ) {
        delete this.sockets[socket.id];
        delete this.players[socket.id];
    }

    handleInput(socket: Socket, dir: number) {
        const player = this.players[socket.id];
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
                socket.emit(CONSTANTS.MSG_TYPES.GAME_OVER);
                this.removePlayer(socket);
            }
        })

        if (this.shouldSendUpdate) {
            const state = this.serializeState();
            Object.keys(this.sockets).forEach(id => {
                    const socket = this.sockets[id];
                    const player = this.players[id];
                    const update = this.createUpdate(player, state);
                    process.nextTick(() =>
                        socket.emit(
                            CONSTANTS.MSG_TYPES.GAME_UPDATE,
                            update
                        )
                    )
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

        for (let i = 0; i < 5; i++) {
            const web = createWebHazzard(getRandomCoords(), getRandomCoords());
            const portal = createPortalHazzard(getRandomCoords(), getRandomCoords());
            const haste = createBoostHazzard(getRandomCoords(), getRandomCoords());
            const shield = createShieldHazzard(getRandomCoords(), getRandomCoords());
            const flame = createFlameHazzard(getRandomCoords(), getRandomCoords());

            hazards.push(web, portal, haste, shield, flame)
        }

        return hazards
    }
}
