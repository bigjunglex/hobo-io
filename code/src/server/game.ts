import CONSTANTS from "../shared/constants.js";
import { Player } from "./entities/player.js";
import { Bullet } from "./entities/bullet.js";
import { type Socket } from "socket.io";
import { applyCollisions } from "./collisions.js";


export class Game {
    private sockets: Record<string, Socket>; 
    private players: Record<string, Player>;
    private bullets: Bullet[];
    private lastUpdateTime: number;
    private shouldSendUpdate: boolean;

    constructor() {
        this.sockets = {};
        this.players = {};
        this.bullets = [];
        this.lastUpdateTime = Date.now();
        this.shouldSendUpdate = false;
        setInterval(this.update.bind(this), 1000 / 60);
    }

    addPlayer( socket:Socket, username: string, sprite: string ) {
        this.sockets[socket.id] = socket;

        const x = CONSTANTS.MAP_SIZE * (0.25 + Math.random() * 0.5);
        const y = CONSTANTS.MAP_SIZE * (0.25 + Math.random() * 0.5);
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
            }
        })
        this.bullets = this.bullets.filter(b => !bulletsToRemove.includes(b))
        
        Object.keys(this.sockets).forEach(id => {
            const player = this.players[id];
            const newBullet = player.update(dt);
            if (newBullet) this.bullets.push(newBullet);
        })

        const destroyedBullets: Bullet[] = applyCollisions(
            Object.values(this.players),
            this.bullets
        );

        destroyedBullets.forEach(b => {
            const player = this.players[b.parentID]
            if (player) player.onDealtDamage(); 
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
            const leaderboard = this.getLeaderboard();
            Object.keys(this.sockets).forEach(id => {
                const socket = this.sockets[id];
                const player = this.players[id];
                socket.emit(
                    CONSTANTS.MSG_TYPES.GAME_UPDATE,
                    this.createUpdate(player, leaderboard)
                )
            })
            this.shouldSendUpdate = false;
        } else {
            this.shouldSendUpdate = true;
        }

    }
    
    createUpdate(player: Player, leaderboard: Score[]): GameState {
        const nearbyPlayers = Object.values(this.players).filter(
            p => p !== player && p.distanceTo(player) <= CONSTANTS.MAP_SIZE / 2
        );

        const nearbyBullets = this.bullets.filter(
            b => b.distanceTo(player) <= CONSTANTS.MAP_SIZE / 2
        )

        return {
            t: Date.now(),
            me: player.serializeForUpdate(),
            others: nearbyPlayers.map(p => p.serializeForUpdate()),
            bullets: nearbyBullets.map(b => b.serializeForUpdate()),
            leaderboard
        }
    }
    
    getLeaderboard(): Score[] {
        return Object.values(this.players)
            .sort((p1, p2) => p2.score - p1.score)
            .slice(0,5)
            .map( p => ({username: p.username, score: Math.round(p.score)}))
    }

}
