/**
 * rewrite this worker to maybe better structure if thread opt goes fine
 * closures will work atm
 */

import { parentPort, workerData } from "node:worker_threads";
import { readGlobalState, UINT16_SIZE, writeUpdatePacket, writeUpdatePacketToSab } from "../../shared/messages.js";
import { Entity } from "../entities/entity.js";
import CONSTANTS from "../../shared/constants.js";
import { Player } from "../entities/player.js";


const [ stateBuf, packetsBuf, regionOffset ]: [ SharedArrayBuffer, SharedArrayBuffer, number ] = workerData;
console.log('Worker Started - [region]: [%d]', regionOffset)

type MessageData = { ids: number[] };
parentPort!.on('message', ({ ids }: MessageData) => {   
    const gs = readGlobalState(stateBuf);
    const vPackets = new DataView(packetsBuf);
    const vGs = new DataView(stateBuf);
    let offset = regionOffset;

    vPackets.setUint16(offset, ids.length, true);
    offset += UINT16_SIZE;

    for (const id of ids) {
        const state:GameState|undefined = getAOI(gs, id);
        if (!state) { continue }
        vPackets.setUint16(offset, id, true);
        offset += UINT16_SIZE;
        const newOffset = writeUpdatePacketToSab(state, vGs, vPackets, offset); 
        offset = newOffset;
    }
    parentPort?.postMessage(1)
})

/**
 * DUP OF Entitty method
 *  form entity.ts
 */
function distanceToSq<T extends SerializedEntity>(from: T, to: T) {
    const dx = from.x - to.x;
    const dy = from.y - to.y;
    return dx * dx + dy * dy;
}

/**
 * < < < BRUTEFORCE AREA OF INTEREST :SMORK: :SMORK: > > > 
 */
function getAOI(gs: GlobalState & { c: number }, id: number): GameState|undefined {
    const me = gs.players.find(p => p.id === id);
    if (!me) {
        return undefined
    }
    const score = me.score ?? 0;
    const nearbyPlayers = gs.players.filter(
        p => p.id !== me.id && 
        distanceToSq(me, p) <= CONSTANTS.SQR_AOI_RAD
    );

    const nearbyBullets = gs.bullets.filter(
        b => distanceToSq(me, b) <= CONSTANTS.SQR_AOI_RAD
    )

    const nearbyHazzards = gs.hazards.filter(
        h => distanceToSq<SerializedEntity>(me, h) <= CONSTANTS.SQR_AOI_RAD
    )

    return {
        t: gs.t,
        me: me,
        others: nearbyPlayers,
        bullets: nearbyBullets,
        hazards: nearbyHazzards,
        leaderboard: gs.leaderboard,
        c: gs.c,
        score,
    }

}
