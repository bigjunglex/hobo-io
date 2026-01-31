import express from "express";
import webpack from "webpack";
import { type Configuration } from "webpack"; 
import wdm from "webpack-dev-middleware";
import * as uws from 'uWebSockets.js';
import expressify from "uwebsockets-express";


import CONSTANTS from "../shared/constants.js";
import { Game } from './game.js'
import { readPacket } from "../shared/messages.js";


const game = new Game();

const PORT = 7878;
const uWSapp = uws.App().ws<Socket>('/*', {
    compression: uws.DEDICATED_COMPRESSOR_256KB,
    upgrade: (res, req, ctx) => {
        res.upgrade(
            { id: crypto.randomUUID() },
            req.getHeader('sec-websocket-key'),
            req.getHeader('sec-websocket-protocol'),
            req.getHeader('sec-websocket-extensions'),
            ctx
        );
    },
    open: (ws) => {
        const id = ws.getUserData().id
    },
    message: (ws, message, isB) => { 
        if (!isB) {
            console.error('UNGA BUNGA MSG');
            return;
        }

        const out = readPacket(Buffer.from(message));
        // join game condition
        if (out.length === 2) {

        }


    },
    close: (ws) => console.log(ws, 'disconnected')
});
const app = expressify(uWSapp);
app.use(express.static('public'));

if (process.env.NODE_ENV === 'development') {
    // @ts-ignore
    const config:Configuration = (await import('../../webpack.dev.js')).default;
    const compiler = webpack(config);
    app.use(wdm(compiler));
} else {
    app.use(express.static('dist-client'));
}

app.listen(PORT, () => console.log(`[SERVER]: Listening on `, PORT))

// const io = new Server({ 
    // parser: customParser,
// });
// 
// io.attachApp(uWSapp);
// 
// io.engine.on('connection', (rawSocket) => rawSocket.request = null)
// 
// 
// io.on('connection', (socket) => {
    // console.log('Player connected!', socket.id);
// 
    // socket.on(CONSTANTS.MSG_TYPES.JOIN_GAME, joinGame)
    // socket.on(CONSTANTS.MSG_TYPES.INPUT, handleInput)
    // socket.on(CONSTANTS.MSG_TYPES.CHAT_MESSAGE, handleChat)
    // socket.on('disconnect', onDisconnect)
    // 
    // socket.emit(CONSTANTS.MSG_TYPES.TOP_SCORES, game.getTopScores())
// 
// })
// 
// 
// function joinGame(this: Socket, username: string, sprite: string): void {
    // game.addPlayer(this, username, sprite);
// }
// 
// function handleInput(this: Socket, dir: number): void {
    // game.handleInput(this, dir);
// }
// 
// function handleChat(this: Socket, message: string): void {
    // console.log(message)
    // game.chatMessage(this, message)
// }
// 
// function onDisconnect(this: Socket, reason: DisconnectReason, description?: any): void {
    // game.removePlayer(this);
    // console.log('[DISCONNECT]:', reason, this.id)
// }