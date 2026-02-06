export enum MSG_TYPES {
    GAME_UPDATE,
    INPUT,
    JOIN_GAME,
    CHAT_MESSAGE,
    NOTIFY_JOIN,
    NOTIFY_LEFT,
    NOTIFY_EVENT,
    TOP_SCORES,
}


export const UINT8_SIZE = 1;
export const UINT16_SIZE = 2;
export const UINT32_SIZE = 4;
export const FLOAT32_SIZE = 4;
export const FLOAT64_SIZE = 8;

export function getPacketType(packet: ArrayBuffer): number {
    const view = new DataView(packet);
    return view.getUint8(0);   
}

/**
 * blows up if sprite is not uint8 compat
 */
export function writeJoinPacket(username: string, sprite: string): ArrayBuffer {
    const name = new TextEncoder().encode(username);
    const size = UINT8_SIZE * 2 + name.byteLength;
    const buf = new ArrayBuffer(size);
    const view = new DataView(buf);
    let offset = 0;

    view.setUint8(offset, MSG_TYPES.JOIN_GAME); offset++;
    for (const b of name){
        view.setUint8(offset++, b);
    }
    view.setUint8(offset, +sprite)
    
    return buf
}

/**
 * @returns [ username, sprite_id ]
 */ 
export function readJoinPacket(packet: ArrayBuffer): [string, number] {
    const spriteOffset = packet.byteLength - 1;
    const nameOffset = 1;
    const view = new Uint8Array(packet);
    const username = new TextDecoder().decode(view.subarray(nameOffset, spriteOffset));
    const sprite = view[spriteOffset];

    return [ username, sprite ]
}

/**
 * @param input float32 compat number (radian) 
 */
export function writeInputPacket(input:number): ArrayBuffer {
    const size = UINT8_SIZE + FLOAT32_SIZE;
    const buf = new ArrayBuffer(size);
    const view = new DataView(buf);
    
    let offset = 0;
    view.setUint8(offset++, MSG_TYPES.INPUT);
    view.setFloat32(offset, input, true); 
    
    return buf
}

export function readInputPacket(packet: ArrayBuffer): number {
    const view = new DataView(packet);
    return view.getFloat32(1, true)
}

export function writeMessagePacket(message: string): ArrayBuffer {
    const encoded = new TextEncoder().encode(message);
    const size = UINT8_SIZE + encoded.byteLength;
    const buf = new ArrayBuffer(size);
    const view = new DataView(buf);
    
    let offset = 0;
    view.setUint8(offset++, MSG_TYPES.CHAT_MESSAGE)
    for (const b of encoded) {
        view.setUint8(offset++, b);
    }

    return buf
}
/**
 * from client to server
 */
export function readMessagePacket(packet: ArrayBuffer): string {
    const view = new Uint8Array(packet);
    const message = new TextDecoder().decode(view.subarray(1));
    return message
}


/**
 * from server to clients
 * 
 * 
 * [MSGTYPE] [username.length ] [...USERNAME] [message.length] [...MESSAGE] []
 * 
 * ^
 */
export function writeChatMessagePacket(msg: ChatMessage): ArrayBuffer {
    const encoder = new TextEncoder();
    const username = encoder.encode(msg.username);
    const message = encoder.encode(msg.message);
    const size = UINT8_SIZE * 3 + FLOAT64_SIZE + username.byteLength + message.byteLength;
    const buf = new ArrayBuffer(size);
    const view = new DataView(buf);
    const u8view = new Uint8Array(buf);

    let offset = 0;
    view.setUint8(offset++, MSG_TYPES.CHAT_MESSAGE);
    
    view.setUint8(offset++, username.byteLength);
    u8view.set(username, offset);
    offset += username.byteLength;
    
    view.setUint8(offset++, message.byteLength);
    u8view.set(message, offset);
    offset += message.byteLength;

    view.setFloat64(offset, msg.time, true);

    return buf;
}

/**
 * read server-sent chat message packet
 */
export function readChatMessagePacket(packet: ArrayBuffer): ChatMessage {
    const decoder = new TextDecoder();
    const u8view = new Uint8Array(packet);
    const view = new DataView(packet);
    
    let offset = 1;
    const nameBytes = view.getUint8(offset++);
    const username = decoder.decode(u8view.subarray(offset, offset + nameBytes));
    offset += nameBytes;
    
    const msgBytes = view.getUint8(offset++);
    const message = decoder.decode(u8view.subarray(offset, offset + msgBytes));
    offset += msgBytes;

    const time = view.getFloat64(offset, true);

    return { username, message, time }
}

/**
 * notify packets = JOIN + LEFT
 * @param isJoin specify join or left message
 * 
 * [TYPE] [NAMELENGTH] [....NAME] [TIME]
 */
export function writeNotifyPacket(msg: NotifyMessage, isJoin = true): ArrayBuffer {
    const username = new TextEncoder().encode(msg.username);
    const size = UINT8_SIZE * 2 + FLOAT64_SIZE + username.byteLength;
    const buf = new ArrayBuffer(size);
    const view = new DataView(buf);
    const type = isJoin ? MSG_TYPES.NOTIFY_JOIN : MSG_TYPES.NOTIFY_LEFT;

    let offset = 0;
    view.setUint8(offset++, type);
    view.setUint8(offset++, username.byteLength);
    for (const b of username) {
        view.setUint8(offset++, b);
    };
    view.setFloat64(offset, msg.time, true);

    return buf
}

/**
 * read LEFT OR JOIN notification
 */
export function readNotifyPacket(packet: ArrayBuffer): NotifyMessage {
    const view = new DataView(packet);
    const u8view = new Uint8Array(packet);
    
    let offset = 1;
    const nameBytes = view.getUint8(offset++);
    const username = new TextDecoder().decode(u8view.subarray(offset, offset + nameBytes));
    offset += nameBytes;
    const time = view.getFloat64(offset, true);
    
    return { username, time }
}

/**
 * [TYPE][...EVENT]
 */
export function writeEventPacket(eventName: string): ArrayBuffer {
    const event = new TextEncoder().encode(eventName);
    const size = UINT8_SIZE + event.byteLength;
    const buf = new ArrayBuffer(size);
    const view = new Uint8Array(buf);
    
    let offset = 0;
    view[offset++] = MSG_TYPES.NOTIFY_EVENT;
    view.set(event, offset);

    return buf
}

export function readEventPacket(packet: ArrayBuffer): string {
    const view = new Uint8Array(packet);
    const event = new TextDecoder().decode(view.subarray(1));
    return event
}


export function writeScoresPacket(scores: ScoreData[]): ArrayBuffer {
    const payload = new TextEncoder().encode(JSON.stringify(scores));
    const size = UINT8_SIZE + payload.byteLength;
    const buf = new ArrayBuffer(size);
    const view = new Uint8Array(buf);

    view[0] = MSG_TYPES.TOP_SCORES;
    view.set(payload, 1);

    return buf
};

export function readScoresPacket(packet: ArrayBuffer): ScoreData[] {
    const view = new Uint8Array(packet);
    const json = new TextDecoder().decode(view.subarray(1));
    return JSON.parse(json)
}


export function writeUpdatePacket(gs: GameState): ArrayBuffer {
    const encoder = new TextEncoder();
    const buf = new ArrayBuffer(4096)
    const view = new DataView(buf);
    const u8view = new Uint8Array(buf);
    
    let offset = 0;
    view.setUint8(offset++, MSG_TYPES.GAME_UPDATE);
    view.setFloat64(offset, gs.t, true);
    offset += FLOAT64_SIZE;

    // [ COUNT ] [ ...[LENGTH][PLAYER] ]
    //  ^
    view.setUint8(offset++, gs.others.length + 1);
    insertPlayer(encoder, view, u8view, offset, gs.me);
    for (const p of gs.others) {
        insertPlayer(encoder, view, u8view, offset, p);
    }

    // [ COUNT ] [ ...[LENGTH][BULLET] ]
    //  ^
    view.setUint8(offset++, gs.bullets.length);
    for (const b of gs.bullets) {
        insertBullet(encoder, view, u8view, offset, b)
    }

    // [ COUNT ] [ ...[LENGTH][BULLET] ]
    //  ^
    view.setUint8(offset++, gs.hazards.length);
    for (const h of gs.hazards) {
        insertHazard(encoder, view, u8view, offset, h);
    }

    // [COUNT][... LEADERBOARD ENTRY]
    view.setUint8(offset++, gs.leaderboard.length);
    for (const s of gs.leaderboard) {
        insertBoardEntry(encoder, view, u8view, offset, s);
    }

    view.setUint16(offset, gs.c, true);
    offset += UINT16_SIZE;
    view.setUint16(offset, gs.score, true);
    offset += UINT16_SIZE;

    return buf
} 


export function readUpdatePacket(packet: ArrayBuffer): GameState {
    const decoder = new TextDecoder();
    const view = new DataView(packet);
    const u8view = new Uint8Array(packet);

    let offset = 1;
    const t = view.getFloat64(offset, true);
    offset += FLOAT64_SIZE;

    const others = [];
    let playersCount = view.getUint8(offset++);
    do {
        const player = extractPlayer(decoder, view, u8view, offset);
        others.push(player);
        --playersCount;
    } while (playersCount > 0);
    
    const bullets: SerializedEntity[] = [];
    let bulletsCount = view.getUint8(offset++);
    do {
        const bullet = extractBullet(decoder, view, u8view, offset);
        bullets.push(bullet);
        --bulletsCount;
    } while (bulletsCount > 0);
    
    const hazards: SerializedHazard[] = [];
    let hazardsCount = view.getUint8(offset++);
    do {
        const hazard = extractHazard(decoder, view, u8view, offset);
        hazards.push(hazard);
        --hazardsCount;
    } while (hazardsCount > 0);
    
    const leaderboard: Score[] = [];
    let scoresCount = view.getUint8(offset++);
    do {
        const score = extractBoardEntry(decoder, view, u8view, offset);
        leaderboard.push(score)
        --scoresCount;
    } while (scoresCount > 0);

    const c = view.getUint16(offset, true);
    offset += UINT16_SIZE;
    const score = view.getUint16(offset, true);
    offset += UINT16_SIZE;

    const me = others.shift()!;
    
    return {
        t,
        me,
        others,
        bullets,
        hazards,
        leaderboard,
        c,
        score
    }
}

/**
 * inserts @SerializedPlayer into buffer by provided views
 */
function insertPlayer(
    encoder: TextEncoder,
    view: DataView<ArrayBuffer>,
    u8view: Uint8Array<ArrayBuffer>,
    offset: number,
    p: SerializedPlayer
): void {
    const start = offset++;
    const id = encoder.encode(p.id);
    view.setUint8(offset++, id.byteLength);
    u8view.set(id, offset);
    offset += id.byteLength;

    const username = encoder.encode(p.username);
    view.setUint8(offset++, username.byteLength);
    u8view.set(username, offset);
    offset += username.byteLength;

    view.setUint8(offset++, +p.sprite);

    const effect = encoder.encode(p.effect);
    view.setUint8(offset++, effect.byteLength);
    if (effect.byteLength > 0) {
        u8view.set(effect, offset);
        offset += effect.byteLength;
    }

    view.setFloat32(offset, p.direction, true);
    offset += FLOAT32_SIZE;

    view.setFloat32(offset, p.x, true);
    offset += FLOAT32_SIZE;

    view.setFloat32(offset, p.y, true);
    offset += FLOAT32_SIZE;

    view.setUint16(offset, p.hp, true);
    offset += UINT16_SIZE;

    const playerLength = offset - start;
    view.setUint8(start, playerLength);
}

/**
 * inserts @SerializedEntity into buffer by provided views
 */
function insertBullet(
    encoder: TextEncoder,
    view: DataView<ArrayBuffer>,
    u8view: Uint8Array<ArrayBuffer>,
    offset: number,
    b: SerializedEntity
): void {
    const start = offset++;
    const id = encoder.encode(b.id);
    view.setUint8(offset++, id.byteLength);
    u8view.set(id, offset);
    offset += id.byteLength;

    view.setFloat32(offset, b.x, true);
    offset += FLOAT32_SIZE;

    view.setFloat32(offset, b.y, true);
    offset += FLOAT32_SIZE;

    const bulletBytes = offset - start;
    view.setUint8(offset++, bulletBytes);
}

/**
 * inserts @SerializedHazard into buffer by provided views
 * 
 *  [HAZARD LENGTH] [ID LENGTH] [...ID] [SPRITE][X][Y][onCoolDOWN]
 * 
 * ^
 */
function insertHazard(
    encoder: TextEncoder,
    view: DataView<ArrayBuffer>,
    u8view: Uint8Array<ArrayBuffer>,
    offset: number,
    h: SerializedHazard
): void {
    const start = offset++;
    const id = encoder.encode(h.id);
    view.setUint8(offset++, id.byteLength);
    u8view.set(id, offset);
    offset += id.byteLength;

    view.setUint8(offset++, h.sprite);

    view.setFloat32(offset, h.x, true);
    offset += FLOAT32_SIZE;

    view.setFloat32(offset, h.y, true);
    offset += FLOAT32_SIZE;

    //isCooldown
    view.setUint8(offset++, Number(h.onCooldown));

    const hazardBytes = offset - start;
    view.setUint8(offset++, hazardBytes);
}

/**
 * inserts @Score into buffer by provided views (without id)
 * 
 *  [SCORE LENGTH] [USERNAME LENGTH] [...USERNAME] [SCORE]
 * 
 * ^
 */
function insertBoardEntry(
    encoder: TextEncoder,
    view: DataView<ArrayBuffer>,
    u8view: Uint8Array<ArrayBuffer>,
    offset: number,
    s: Score
): void {
    const start = offset++;
    const username = encoder.encode(s.username);
    u8view.set(username, offset);
    offset += username.byteLength;

    const score = Math.round(s.score);
    view.setUint16(offset, score, true);
    offset += UINT16_SIZE;

    const scoreBytes = offset - start;
    view.setUint8(start, scoreBytes);
}

function extractPlayer(
    decoder: TextDecoder,
    view: DataView<ArrayBuffer>,
    u8view: Uint8Array<ArrayBuffer>,
    offset: number
): SerializedPlayer {
    const playerBytes = view.getUint8(offset++);
    const start = offset;

    const idBytes = view.getUint8(offset++);
    const id = decoder.decode(u8view.subarray(offset, offset + idBytes));
    offset += idBytes;

    const userBytes = view.getUint8(offset++);
    const username = decoder.decode(u8view.subarray(offset, offset + userBytes));
    offset += userBytes;

    const sprite = view.getUint8(offset++);

    const effectBytes = view.getUint8(offset++);
    const effect = decoder.decode(u8view.subarray(offset, offset + effectBytes));
    offset += effectBytes;

    const direction = view.getFloat32(offset, true);
    offset += FLOAT32_SIZE;
    const x = view.getFloat32(offset, true);
    offset += FLOAT32_SIZE;
    const y = view.getFloat32(offset, true);
    offset += FLOAT32_SIZE;
    const hp = view.getUint16(offset, true);
    offset += UINT16_SIZE;

    if (playerBytes !== (offset - start)) {
        console.error('Error During UPDATE Packet Read @Player');
    }

    return {
        id,
        username,
        sprite,
        effect,
        direction,
        x,
        y,
        hp
    }

}

function extractBullet(
    decoder: TextDecoder,
    view: DataView<ArrayBuffer>,
    u8view: Uint8Array<ArrayBuffer>,
    offset: number
): SerializedEntity {
    const start = offset;
    const bulletBytes = view.getUint8(offset++);

    const idBytes = view.getUint8(offset++);
    const id = decoder.decode(u8view.subarray(offset, offset + idBytes));
    offset += idBytes;

    const x = view.getFloat32(offset, true);
    offset += FLOAT32_SIZE;
    const y = view.getFloat32(offset, true);
    offset += FLOAT32_SIZE;

    if (bulletBytes !== (offset - start)) {
        console.error('Error During UPDATE Packet Read @Bullet');
    }

    return { id, x, y }
}

function extractHazard(
    decoder: TextDecoder,
    view: DataView<ArrayBuffer>,
    u8view: Uint8Array<ArrayBuffer>,
    offset: number
): SerializedHazard {
    const start = offset;
    const hazardBytes = view.getUint8(offset++);

    const idBytes = view.getUint8(offset++);
    const id = decoder.decode(u8view.subarray(offset, offset + idBytes));
    offset += idBytes;

    const sprite = view.getUint8(offset++);

    const x = view.getFloat32(offset, true);
    offset += FLOAT32_SIZE;
    const y = view.getFloat32(offset, true);
    offset += FLOAT32_SIZE;
    const onCooldown = Boolean(view.getUint8(offset++));

    if (hazardBytes !== (offset - start)) {
        console.error('Error During UPDATE Packet Read @Bullet');
    }

    return {
        id,
        sprite,
        onCooldown,
        x,
        y
    }
}

function extractBoardEntry(
    decoder: TextDecoder,
    view: DataView<ArrayBuffer>,
    u8view: Uint8Array<ArrayBuffer>,
    offset: number
): Score {
    const start = offset++;
    const scoreBytes = view.getUint8(offset++);

    const userBytes = view.getUint8(offset++);
    const username = decoder.decode(u8view.subarray(offset, offset + userBytes));
    offset += userBytes;

    const score = view.getUint16(offset, true);
    offset += UINT16_SIZE;

    if (scoreBytes !== (offset - start)) {
        console.error('Error During UPDATE Packet Read @Score');
    }

    return {
        username,
        score
    }
}

