import express from "express";
import webpack from "webpack";
import { type Configuration } from "webpack"; 
import wdm from "webpack-dev-middleware";
import customParser from "socket.io-msgpack-parser";
import { App } from 'uWebSockets.js';
import expressify from "uwebsockets-express";


import CONSTANTS from "../shared/constants.js";
import { type DisconnectReason, Server, Socket } from "socket.io";
import { Game } from './game.js'

const PORT = 7878;
const uWSapp = App();
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

const io = new Server({ 
    parser: customParser,
});

io.attachApp(uWSapp);

io.engine.on('connection', (rawSocket) => rawSocket.request = null)

io.on('connection', (socket) => {
    console.log('Player connected!', socket.id);

    socket.on(CONSTANTS.MSG_TYPES.JOIN_GAME, joinGame)
    socket.on(CONSTANTS.MSG_TYPES.INPUT, handleInput)
    socket.on(CONSTANTS.MSG_TYPES.CHAT_MESSAGE, handleChat)
    socket.on('disconnect', onDisconnect)

})

const game = new Game(io);


function joinGame(this: Socket, username: string, sprite: string): void {
    game.addPlayer(this, username, sprite);
}
function handleInput(this: Socket, dir: number): void {
    game.handleInput(this, dir);
}

function handleChat(this: Socket, message: string): void {
    console.log(message)
    game.chatMessage(this, message)
}

function onDisconnect(this: Socket, reason: DisconnectReason, description?: any): void {
    game.removePlayer(this);
    console.log('[DISCONNECT]:', reason, this.id)
}