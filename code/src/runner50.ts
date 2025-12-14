import { io, Socket } from "socket.io-client";
import { setTimeout } from "node:timers/promises";
import { performance } from "node:perf_hooks";
import customParser from "socket.io-msgpack-parser";
import CONSTANTS from "./shared/constants.js";

type Stats = {
    connected: number;
    errors: number;
    latency: number[];
    gamesOver: number;
    maxLatency: number;
}

class LoadTester {
    private url: string;
    private count:number;
    private sockets: Socket[];
    private stats: Stats;
    private sprites: string[];

    constructor(url: string, count:number) {
        this.url = url;
        this.count = count;
        this.sockets = [];
        this.stats = {
            connected: 0,
            errors: 0,
            latency: [],
            gamesOver: 0,
            maxLatency: 0,
        };

        this.sprites = ['zombean', 'bean', 'ghosty', 'mark']
    }

    async connectAll() {
        console.log(`Connecting ${this.count} players...`);
        this.run();
        this.printStats(10000);

        for (let i = 0; i < this.count; i++) {
            await this.connectPlayer();
            await setTimeout(100)
        }

        console.log('All players connected!');
    }

    async connectPlayer() {
        const socket = io(this.url, { reconnection: false, parser: customParser });
        await new Promise<void>(resolve => {
            socket.on('connect', () => {
                this.stats.connected++
                resolve();
            })
        })

        let lastUpdate = performance.now();

        socket.on(CONSTANTS.MSG_TYPES.GAME_UPDATE, () => {
            const now = performance.now()
            const ping = now - lastUpdate;
            lastUpdate = now;
            if (ping > this.stats.maxLatency) {
                this.stats.maxLatency = ping
            }
            this.stats.latency.push(ping)
        });
        socket.on(CONSTANTS.MSG_TYPES.GAME_OVER, () => this.onGameOver(socket));
        socket.on('connect_error', (err) => {
            this.stats.errors++
            console.log(err)
        })

        const spriteId = Math.floor(Math.random() * 4)

        socket.emit(CONSTANTS.MSG_TYPES.JOIN_GAME, crypto.randomUUID().substring(0,4), this.sprites[spriteId])
        this.sockets.push(socket);
    }

    getStats() {
        const avgLatency = this.stats.latency.reduce((a, b) => a + b, 0) / this.stats.latency.length;

        return {
            connected: this.stats.connected,
            errors: this.stats.errors,
            avgLatency: avgLatency.toFixed(2),
            gamesOver: this.stats.gamesOver,
            maxLatency: this.stats.maxLatency.toFixed(2)
        };
    }

    generateInput(socket:Socket) {
        const dir = Math.random() * Math.PI * 2;;
        socket.emit(CONSTANTS.MSG_TYPES.INPUT, dir)
    }

    run() {
        setInterval(() => {
            this.sockets.forEach(s => this.generateInput(s))
        }, 2000)
    }

    onGameOver(s: Socket) {
        this.stats.gamesOver++
        s.disconnect();
    }

    printStats(t: number) {
        setInterval(() => {
            const stats = tester.getStats();
            console.log('\n <----|.. [ Stats ] ..|---->');
            console.log('[Connected]:', stats.connected);
            console.log('[Errored]:', stats.errors);
            console.log('[Average Latency]:', stats.avgLatency, 'ms');
            console.log('[Max Latency]:', stats.maxLatency, 'ms');            
            console.log('[Games Over]: ', stats.gamesOver);
        }, t)
    }
}

const tester = new LoadTester('ws://localhost:7878/', 200);

tester.connectAll()
