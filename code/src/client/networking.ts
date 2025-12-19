import io from 'socket.io-client';
import { throttle } from 'throttle-debounce';
import CONSTATANTS from '../shared/constants';
import customParser from "socket.io-msgpack-parser";
import { processGameUpdate } from './state';

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
let lastUpdate = Date.now()

export const connect = (onGameOver: GameCallback) => (
    connected.then(() => {
        socket.on(CONSTATANTS.MSG_TYPES.GAME_UPDATE, (update: GameState) => {

            const now = performance.now();
            const ping = now - lastUpdate;
            lastUpdate = now;
            pingSpan.textContent = ping.toFixed(2);
            
            processGameUpdate(update)
        });
        socket.on(CONSTATANTS.MSG_TYPES.GAME_OVER, onGameOver);
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