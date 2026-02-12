import { throttle } from 'throttle-debounce';
import CONSTATANTS from '../shared/constants';
import { processGameUpdate } from './state';
import { onChatMessage, onJoinNotify, onLeftNotify  } from './chat';
import { drawEventNotification } from './render';
import { topScores } from './leaderboard';
import { write } from 'node:fs';
import { getPacketType, MSG_TYPES, readChatMessagePacket, readEventPacket, readNotifyPacket, readUpdatePacket, writeInputPacket, writeJoinPacket, writeMessagePacket } from '../shared/messages';

const socketProtocol = (window.location.protocol.includes('https')) ? 'wss' : 'ws';
const socket = new WebSocket(`${socketProtocol}://${window.location.host}`);
socket.binaryType = 'arraybuffer';

const connected = new Promise<WebSocket>(resolve => {
    socket.onopen = () => {
        console.log('Connected');
        resolve(socket); 
    }

})

const pingSpan = document.getElementById('ping')!;
let pingprinter: null|PingPrinter = null;
export const connect = (onGameOver: GameCallback) =>  (
    connected.then((ws) => {
        pingprinter = new PingPrinter(pingSpan);
        ws.onmessage = ({ data }) => {
            console.log(data)
            if (!(data instanceof ArrayBuffer)) {
                console.log('Not binary message from server');
                ws.close();
            }
 

            const type = getPacketType(data);
            switch (type) {
                case MSG_TYPES.CHAT_MESSAGE: {
                    const packet = readChatMessagePacket(data);
                    onChatMessage(packet);
                    break;
                }
                case MSG_TYPES.NOTIFY_JOIN: {
                    const packet  = readNotifyPacket(data);
                    onJoinNotify(packet);
                    break;
                }
                case MSG_TYPES.NOTIFY_LEFT: {
                    const packet  = readNotifyPacket(data);
                    onLeftNotify(packet);
                    break;
                }
                case MSG_TYPES.NOTIFY_EVENT: {
                    const packet  = readEventPacket(data);
                    drawEventNotification(packet);
                    break;
                }
                case MSG_TYPES.GAME_UPDATE: {
                    pingprinter?.addUpdate();
                    const update = readUpdatePacket(data);
                    processGameUpdate(update);
                    break;
                }
                    
            }

        }

        ws.onclose = () => {
            console.log('Disconnected from server');
            document.getElementById('disconnect-modal')?.classList.remove('hidden');
            document.getElementById('reconnect-button')!.onclick = () => {
                window.location.reload();
            }
        }

    })
);

export const play = (username: string, sprite: string) => {
    const packet = writeJoinPacket(username, sprite);
    socket.send(packet);
}

export const updateDirection = throttle(20, (dir:number) => {
    const packet = writeInputPacket(dir);
    socket.send(packet);
})

export const sendMessage = (message: string) => {
    const packet = writeMessagePacket(message);
    socket.send(packet);
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
        const dt = now - this.lastUpdate - CONSTATANTS.TICK_RATE;
        this.lastUpdate = now;
        this.deltas.push(dt);
        if (this.deltas.length > 40) this.setPing(); 
    }

    setPing() {
        const len = this.deltas.length;
        const average = (this.deltas.reduce((a, v) => a + v, 0) / len).toFixed(2);
        this.target.textContent = average;
        this.deltas = [];
    }
}