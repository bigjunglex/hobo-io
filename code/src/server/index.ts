import express from "express";
import webpack from "webpack";
import { type Configuration } from "webpack"; 
import wdm from "webpack-dev-middleware";
import * as uws from 'uWebSockets.js';
import expressify from "uwebsockets-express";

import { Game } from './game.js'
import { getPacketType, MSG_TYPES, readInputPacket, readJoinPacket, readMessagePacket, writePlayersIDMapPacket, writeScoresPacket } from "../shared/messages.js";
import CONSTANTS from "../shared/constants.js";
import { idRegistry } from "./utils.js";


const PORT = 7878;
const uWSapp = uws.App();
const idReg = new idRegistry(CONSTANTS.MAX_ID);
const game = new Game(uWSapp);

uWSapp.ws<Socket>('/*', {
    closeOnBackpressureLimit: true,
    upgrade: (res, req, ctx) => {
        res.upgrade(
            { id: idReg.getId() },
            req.getHeader('sec-websocket-key'),
            req.getHeader('sec-websocket-protocol'),
            req.getHeader('sec-websocket-extensions'),
            ctx
        );
    },
    open: (ws) => {
        const topScores = game.getTopScores() as ScoreData[];
        const scorePacket = writeScoresPacket(topScores, Game.encoder);
        const playerMapPacket = writePlayersIDMapPacket(game.getIdMap(), Game.encoder);
        ws.subscribe(CONSTANTS.NOTIFY_CHANNEL);
        setImmediate(() => {
            ws.send(scorePacket, true);
            ws.send(playerMapPacket, true)
        });
    },
    message: (ws, packet, isB) => { 
        if (!isB) {
            console.error('UNGA BUNGA MSG');
            return;
        }
        const type = getPacketType(packet);
        switch (type) {
            case MSG_TYPES.JOIN_GAME:
                const [username, sprite] = readJoinPacket(packet, Game.decoder);
                game.addPlayer(ws, username, sprite.toString());
                break;
            case MSG_TYPES.INPUT:
                const dir = readInputPacket(packet);
                game.handleInput(ws, dir);
                break;
            case MSG_TYPES.CHAT_MESSAGE:
                const message = readMessagePacket(packet, Game.decoder);
                game.chatMessage(ws, message);
                break;
            default: 
                console.error('Not Defined Packet Type');
        }

    },
    close: (ws, code) => {
        game.removePlayer(ws);
        const id = ws.getUserData().id
        idReg.release(id);
        console.error('[DISCONNECT]:', id, ' --- with code ', code);
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