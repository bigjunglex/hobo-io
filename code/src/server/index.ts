import expess from "express";
import webpack from "webpack";
import { type Configuration } from "webpack"; 
import wdm from "webpack-dev-middleware";

import CONSTANTS from "../shared/constants.js";
import { type DisconnectReason, Server, Socket } from "socket.io";
import { Game } from './game.js'

const PORT = process.env.PORT ?? 7878;
const app = expess();
app.use(expess.static('public'));

if (process.env.NODE_ENV === 'development') {
    // @ts-ignore
    const config:Configuration = (await import('../../webpack.dev.js')).default;
    const compiler = webpack(config);
    app.use(wdm(compiler));
} else {
        
}

const server = app.listen(PORT, () => console.log(`[SERVER]: Listening on `, PORT))

const io = new Server(server)

io.on('connection', (socket) => {
    console.log('Player connected!', socket.id);

    socket.on(CONSTANTS.MSG_TYPES.JOIN_GAME, joinGame)
    socket.on(CONSTANTS.MSG_TYPES.INPUT, handleInput)
    socket.on('disconnect', onDisconnect)

})

const game = new Game();


function joinGame(this: Socket, username: string): void {
    game.addPlayer(this, username);
}
function handleInput(this: Socket, dir: number): void {
    game.handleInput(this, dir);
}

function onDisconnect(this: Socket, reason: DisconnectReason, description?: any): void {
    game.removePlayer(this);
    console.log('[DISCONNECT]:', reason, description)
}

