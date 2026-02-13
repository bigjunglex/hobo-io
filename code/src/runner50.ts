import { setTimeout } from "node:timers/promises";
import { performance } from "node:perf_hooks";
import CONSTANTS from "./shared/constants.js";
import { WebSocket } from "node:http";
import { writeInputPacket, writeJoinPacket } from "./shared/messages.js";

type Stats = {
    connected: number;
    errors: number;
    latency: number[];
    gamesOver: number;
    maxLatency: number;
}

class LoadTester {
    private static encoder = new TextEncoder();

    private url: string;
    private count:number;
    private sockets: any[];
    private stats: Stats;

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
        const socket = new WebSocket(this.url);
        await new Promise<void>(resolve => 
            socket.onopen = () => {
                this.stats.connected++
                resolve();
        })

        let lastUpdate = performance.now();

        socket.onmessage = () => {
            const now = performance.now()
            const ping = now - lastUpdate - CONSTANTS.TICK_RATE * 2; // updates sent every other tick
            lastUpdate = now;
            if (ping > this.stats.maxLatency) {
                this.stats.maxLatency = ping
            }
            this.stats.latency.push(ping)
        };

        socket.onerror = (err) => {
            this.stats.errors++
            console.log(err)
        };

        const spriteId = Math.floor(Math.random() * 4)
        const name = 'CPU-' + crypto.randomUUID().substring(0,3);

        const joinPacket = writeJoinPacket(name, `${spriteId > 3 ? 3 : spriteId}`, LoadTester.encoder)
        socket.send(joinPacket);
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

    generateInput(socket: WebSocket) {
        const dir = Math.random() * Math.PI * 2;
        const packet = writeInputPacket(dir);
        socket.send(packet)
    }

    run() {
        setInterval(() => {
            this.sockets.forEach(s => this.generateInput(s))
        }, 2000)
    }

    onGameOver(s: WebSocket) {
        this.stats.gamesOver++
        s.close();
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
