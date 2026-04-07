import { parentPort, workerData } from "node:worker_threads";
import { writeUpdatePacket } from "../../shared/messages.js";
import { Entity } from "../entities/entity.js";
import CONSTANTS from "../../shared/constants.js";
import { Player } from "../entities/player.js";
import { BufferPool } from "../utils.js";


const bufPool = new BufferPool(4096 * 3);
const decoder = new TextDecoder();

console.log('Worker Started')

parentPort!.on('message', (data: AoiWorkerData) => {
    const buf = new Uint8Array(data.bufIn);
    const entries: DecodedEntry = JSON.parse(decoder.decode(buf));
    const ids = data.ids;
    const out: AoiWorkerReturn = {};

    for ( const [id, score, entities] of entries.dataEntity) {
        if (!ids.find(v => v === id)) continue;
        const update = createUpdate(id, entities, score, entries.t, entries.c, entries.leaderboard)
        const buf = bufPool.getBuf();
        const packet = writeUpdatePacket(update, buf);
        bufPool.release(buf);

        out[id] = packet;
    }


    if (parentPort) {
        parentPort.postMessage(out)
    }
})


function createUpdate(
    id: number,
    entities: Entity[],
    score: number,
    t: number,
    c: number,
    leaderboard: Score[]
): GameState {
    const me = entities.find(e => e.id === id)! as Player;
    const update: GameState = {
        t,
        //@ts-ignore
        me: undefined,
        others: [],
        bullets: [],
        hazards: [],
        leaderboard,
        c,
        score,
    }

    for (const e of entities) {
        if (distanceToSq(me, e) > CONSTANTS.SQR_AOI_RAD) continue;

        if (e.hasOwnProperty('hp')) {
            if (e.id === id) update.me = e as Player;
            update.others.push(e as Player);
        }
        if (e.hasOwnProperty('parentID')) update.bullets.push(e as SerializedEntity);
        //@ts-ignore
        if (e.hasOwnProperty('onCooldown')) update.hazards.push(e as SerializedHazard);
    }

    return update
}


/**
 * DUP OF Entitty method
 *  form entity.ts
 */
function distanceToSq(from: Entity, to: Entity) {
    const dx = from.x - to.x;
    const dy = from.y - to.y;
    return dx * dx + dy * dy;
}
