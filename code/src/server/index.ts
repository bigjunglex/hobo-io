import express from "express";
import webpack from "webpack";
import { type Configuration } from "webpack"; 
import wdm from "webpack-dev-middleware";
import * as uws from 'uWebSockets.js';
import expressify from "uwebsockets-express";

import { Game } from './game.js'
import { getPacketType, MSG_TYPES, readInputPacket, readJoinPacket, readMessagePacket } from "../shared/messages.js";

const game = new Game();

const PORT = 7878;
const uWSapp = uws.App().ws<Socket>('/*', {
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
    message: (ws, packet, isB) => { 
        if (!isB) {
            console.error('UNGA BUNGA MSG');
            return;
        }
        const type = getPacketType(packet);
        switch (type) {
            case MSG_TYPES.JOIN_GAME:
                const [username, sprite] = readJoinPacket(packet);
                game.addPlayer(ws, username, sprite.toString());
                break;
            case MSG_TYPES.INPUT:
                const dir = readInputPacket(packet);
                game.handleInput(ws, dir);
                break;
            case MSG_TYPES.CHAT_MESSAGE:
                const message = readMessagePacket(packet);
                game.chatMessage(ws, message);
                break;
            default: 
                console.error('Not Defined Packet Type');
        }

    },
    close: (ws, code) => {
        game.removePlayer(ws);
        console.error('[DISCONNECT]:', ws.getUserData().id, ' --- with code ', code);
    }
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

