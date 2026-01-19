import io from 'socket.io-client';
import { throttle } from 'throttle-debounce';
import CONSTATANTS from '../shared/constants';
import customParser from "socket.io-msgpack-parser";
import { processGameUpdate } from './state';
import { onChatMessage, onJoinNotify, onLeftNotify  } from './chat';
import { drawEventNotification } from './render';
import { topScores } from './leaderboard';

const socketProtocol = (window.location.protocol.includes('https')) ? 'wss' : 'ws';
const socket = io(`${socketProtocol}://${window.location.host}`, {
    transports: ['websocket'],
    reconnection: false,
    parser: customParser
});
const connected = new Promise<void>(resolve => {
    socket.on('connect', () => {
        console.log('Connected to server!');
        resolve();
    })
})

const pingSpan = document.getElementById('ping')!;
let pingprinter: null|PingPrinter = null;

export const connect = (onGameOver: GameCallback) => (
    connected.then(() => {
        pingprinter = new PingPrinter(pingSpan);

        socket.on(CONSTATANTS.MSG_TYPES.GAME_UPDATE, (update: GameState) => {
            pingprinter?.addUpdate()
            processGameUpdate(update)
        });
        
        socket.on(CONSTATANTS.MSG_TYPES.GAME_OVER, onGameOver);
        socket.on(CONSTATANTS.MSG_TYPES.CHAT_MESSAGE, onChatMessage);
        socket.on(CONSTATANTS.MSG_TYPES.NOTIFY_JOIN, onJoinNotify);
        socket.on(CONSTATANTS.MSG_TYPES.NOTIFY_LEFT, onLeftNotify);
        socket.on(CONSTATANTS.MSG_TYPES.NOTIFY_EVENT, drawEventNotification);
        socket.on(CONSTATANTS.MSG_TYPES.TOP_SCORES, topScores)

        socket.on('disconnect', () => {
            console.log('Disconnected from server');
            document.getElementById('disconnect-modal')?.classList.remove('hidden');
            document.getElementById('reconnect-button')!.onclick = () => {
                window.location.reload();
            }
        })
    })
)

export const play = (username: string, sprite: string) => {
    socket.emit(CONSTATANTS.MSG_TYPES.JOIN_GAME, username, sprite);
}

export const updateDirection = throttle(20, (dir:number) => {
    socket.emit(CONSTATANTS.MSG_TYPES.INPUT, dir);
})

export const sendMessage = (message: string) => {
    socket.emit(CONSTATANTS.MSG_TYPES.CHAT_MESSAGE, message)
}


class PingPrinter {
    private deltas: number[];
    private lastUpdate: number;
    private target: HTMLElement; 

    constructor(target: HTMLElement) {
        this.deltas = [];
        this.lastUpdate = performance.now();
        this.target = target;
    }

    addUpdate() {
        const now = performance.now();
        const dt = now - this.lastUpdate;
        this.lastUpdate = now;
        this.deltas.push(dt);
        if (this.deltas.length > 30) this.setPing(); 
    }

    setPing() {
        const len = this.deltas.length;
        const average = (this.deltas.reduce((a, v) => a + v, 0) / len).toFixed(2);
        this.target.textContent = average;
        this.deltas = [];
    }
}