export enum MSG_TYPES {
    GAME_UPDATE,
    INPUT,
    JOIN_GAME,
    CHAT_MESSAGE,
    NOTIFY_JOIN,
    NOTIFY_LEFT,
    NOTIFY_EVENT,
    TOP_SCORES,
    PLAYER_ID_MAP,
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
export function writeJoinPacket(username: string, sprite: string, encoder: TextEncoder): ArrayBuffer {
    const name = encoder.encode(username);
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
export function readJoinPacket(packet: ArrayBuffer, decoder: TextDecoder): [string, number] {
    const spriteOffset = packet.byteLength - 1;
    const nameOffset = 1;
    const view = new Uint8Array(packet);
    const username = decoder.decode(view.subarray(nameOffset, spriteOffset));
    const sprite = view[spriteOffset];

    return [ username, sprite ]
}

/**
 * @param input float32 compat number (radian) 
 */
export function writeInputPacket(input: number): ArrayBuffer {
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

export function writeMessagePacket(message: string, encoder: TextEncoder): ArrayBuffer {
    const encoded = encoder.encode(message);
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
export function readMessagePacket(packet: ArrayBuffer, decoder: TextDecoder): string {
    const view = new Uint8Array(packet);
    const message = decoder.decode(view.subarray(1));
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
export function writeChatMessagePacket(msg: Omit<ChatMessage, 'id'>, encoder: TextEncoder): ArrayBuffer {
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
export function readChatMessagePacket(packet: ArrayBuffer, decoder: TextDecoder): ChatMessage {
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

    return { username, message, time, id: 0 /**stab for a bit, change contracts later */ }
}

/**
 * notify packets = JOIN + LEFT
 * @param isJoin specify join or left message
 * 
 * [TYPE] [NAMELENGTH] [....NAME][ID][TIME]
 */
export function writeNotifyPacket(msg: NotifyMessage, isJoin = true, encoder: TextEncoder): ArrayBuffer {
    const username = encoder.encode(msg.username);
    const size = UINT8_SIZE * 2 + FLOAT64_SIZE + UINT16_SIZE + username.byteLength;
    const buf = new ArrayBuffer(size);
    const view = new DataView(buf);
    const type = isJoin ? MSG_TYPES.NOTIFY_JOIN : MSG_TYPES.NOTIFY_LEFT;

    let offset = 0;
    view.setUint8(offset++, type);
    view.setUint8(offset++, username.byteLength);
    for (const b of username) {
        view.setUint8(offset++, b);
    };
    view.setUint16(offset, msg.id, true);
    offset += UINT16_SIZE;
    view.setFloat64(offset, msg.time, true);

    return buf
}

/**
 * read LEFT OR JOIN notification
 */
export function readNotifyPacket(packet: ArrayBuffer, decoder: TextDecoder): NotifyMessage {
    const view = new DataView(packet);
    const u8view = new Uint8Array(packet);

    let offset = 1;
    const nameBytes = view.getUint8(offset++);
    const username = decoder.decode(u8view.subarray(offset, offset + nameBytes));
    offset += nameBytes;
    const id = view.getUint16(offset, true);
    offset += UINT16_SIZE;
    const time = view.getFloat64(offset, true);
    
    return { username, time, id}
}

/**
 * [TYPE][...EVENT]
 */
export function writeEventPacket(eventName: string, encoder: TextEncoder): ArrayBuffer {
    const event = encoder.encode(eventName);
    const size = UINT8_SIZE + event.byteLength;
    const buf = new ArrayBuffer(size);
    const view = new Uint8Array(buf);
    
    let offset = 0;
    view[offset++] = MSG_TYPES.NOTIFY_EVENT;
    view.set(event, offset);

    return buf
}

export function readEventPacket(packet: ArrayBuffer, decoder: TextDecoder): string {
    const view = new Uint8Array(packet);
    const event = decoder.decode(view.subarray(1));
    return event
}


export function writeScoresPacket(scores: ScoreData[], encoder: TextEncoder): ArrayBuffer {
    const payload = encoder.encode(JSON.stringify(scores));
    const size = UINT8_SIZE + payload.byteLength;
    const buf = new ArrayBuffer(size);
    const view = new Uint8Array(buf);

    view[0] = MSG_TYPES.TOP_SCORES;
    view.set(payload, 1);

    return buf
};

export function readScoresPacket(packet: ArrayBuffer, decoder: TextDecoder): ScoreData[] {
    const view = new Uint8Array(packet);
    const json = decoder.decode(view.subarray(1));
    return JSON.parse(json)
}


export function writeUpdatePacket(gs: GameState, buf: ArrayBuffer): ArrayBuffer {
    const encoder = new TextEncoder();
    const view = new DataView(buf);
    const u8view = new Uint8Array(buf);
    
    let offset = 0;
    view.setUint8(offset++, MSG_TYPES.GAME_UPDATE);
    view.setFloat64(offset, gs.t, true);
    offset += FLOAT64_SIZE;

    // [ COUNT ] [ ...[LENGTH][PLAYER] ]
    //  ^
    view.setUint8(offset++, gs.others.length + 1);
    offset = insertPlayer(view, offset, gs.me);
    for (const p of gs.others) {
        offset = insertPlayer(view, offset, p);
    }

    // [ COUNT ] [ ...[LENGTH][BULLET] ]
    //  ^
    view.setUint8(offset++, gs.bullets.length);
    for (const b of gs.bullets) {
        offset = insertBullet(view, offset, b)
    }

    // [ COUNT ] [ ...[LENGTH][BULLET] ]
    //  ^
    view.setUint8(offset++, gs.hazards.length);
    for (const h of gs.hazards) {
        offset = insertHazard(view, offset, h);
    }

    // [COUNT][... LEADERBOARD ENTRY]
    view.setUint8(offset++, gs.leaderboard.length);
    for (const s of gs.leaderboard) {
        offset = insertBoardEntry(encoder, view, u8view, offset, s);
    }

    view.setUint16(offset, gs.c, true);
    offset += UINT16_SIZE;
    view.setUint16(offset, gs.score, true);
    offset += UINT16_SIZE;

    const packet = buf.slice(0, offset);
    return packet
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
    while (playersCount > 0) {
        const [p, newOffset] = extractPlayer(view, offset);
        others.push(p);
        --playersCount;
        offset = newOffset;
    };
    

    const bullets: SerializedEntity[] = [];
    let bulletsCount = view.getUint8(offset++);
    while (bulletsCount > 0) {
        const [b, newOffset] = extractBullet(view, offset);
        bullets.push(b);
        --bulletsCount;
        offset = newOffset;
    };
    
    const hazards: SerializedHazard[] = [];
    let hazardsCount = view.getUint8(offset++);
    while (hazardsCount > 0) {
        const [h, newOffset] = extractHazard(view, offset);
        hazards.push(h);
        --hazardsCount;
        offset = newOffset;
    };
    
    const leaderboard: Score[] = [];
    let scoresCount = view.getUint8(offset++);
    while (scoresCount > 0) {
        const [s, newOffset] = extractBoardEntry(decoder, view, u8view, offset);
        leaderboard.push(s);
        --scoresCount;
        offset = newOffset;
    };

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
    view: DataView<ArrayBuffer>,
    offset: number,
    p: SerializedPlayer
): number {
    const start = offset++;

    view.setUint16(offset, p.id, true);
    offset += UINT16_SIZE;

    view.setUint8(offset++, +p.sprite);
    view.setUint8(offset++, p.effect);

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

    return offset
}

/**
 * inserts @SerializedEntity into buffer by provided views
 */
function insertBullet(
    view: DataView<ArrayBuffer>,
    offset: number,
    b: SerializedEntity
): number {
    const start = offset++;

    view.setUint16(offset, b.id, true);
    offset += UINT16_SIZE;

    view.setFloat32(offset, b.x, true);
    offset += FLOAT32_SIZE;

    view.setFloat32(offset, b.y, true);
    offset += FLOAT32_SIZE;

    const bulletBytes = offset - start;
    view.setUint8(start, bulletBytes);

    return offset
}

/**
 * inserts @SerializedHazard into buffer by provided views
 * 
 *  [HAZARD LENGTH] [ID LENGTH] [...ID] [SPRITE][X][Y][onCoolDOWN]
 * 
 * ^
 */
function insertHazard(
    view: DataView<ArrayBuffer>,
    offset: number,
    h: SerializedHazard
): number {
    const start = offset++;

    view.setUint16(offset, h.id, true);
    offset += UINT16_SIZE;

    view.setUint8(offset++, h.sprite);

    view.setFloat32(offset, h.x, true);
    offset += FLOAT32_SIZE;

    view.setFloat32(offset, h.y, true);
    offset += FLOAT32_SIZE;

    //isCooldown
    view.setUint8(offset++, Number(h.onCooldown));

    const hazardBytes = offset - start;
    view.setUint8(start, hazardBytes);

    return offset
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
): number {
    const start = offset++;
    const username = encoder.encode(s.username);
    view.setUint8(offset++, username.byteLength);
    u8view.set(username, offset);
    offset += username.byteLength;

    const score = Math.round(s.score);
    view.setUint16(offset, score, true);
    offset += UINT16_SIZE;

    const scoreBytes = offset - start;
    view.setUint8(start, scoreBytes);

    return offset
}

function extractPlayer(
    view: DataView<ArrayBuffer>,
    offset: number
): [SerializedPlayer, number] {
    const playerBytes = view.getUint8(offset++);

    const id = view.getUint16(offset, true);
    offset += UINT16_SIZE; 
    
    //placeholder
    const username = '';

    const sprite = view.getUint8(offset++);
    const effect = view.getUint8(offset++);
    
    const direction = view.getFloat32(offset, true);
    offset += FLOAT32_SIZE;
    const x = view.getFloat32(offset, true);
    offset += FLOAT32_SIZE;
    const y = view.getFloat32(offset, true);
    offset += FLOAT32_SIZE;
    const hp = view.getUint16(offset, true);
    offset += UINT16_SIZE;

    return [
        {
            id,
            username,
            sprite,
            effect,
            direction,
            x,
            y,
            hp
        },
        offset
    ]
}

function extractBullet(
    view: DataView<ArrayBuffer>,
    offset: number
): [SerializedEntity, number] {
    const bulletBytes = view.getUint8(offset++);

    const id = view.getUint16(offset, true);
    offset += UINT16_SIZE;
    const x = view.getFloat32(offset, true);
    offset += FLOAT32_SIZE;
    const y = view.getFloat32(offset, true);
    offset += FLOAT32_SIZE;

    return [
        { id, x, y },
        offset
    ]
}

function extractHazard(
    view: DataView<ArrayBuffer>,
    offset: number
): [SerializedHazard, number] {
    const hazardBytes = view.getUint8(offset++);

    const id = view.getUint16(offset, true);
    offset += UINT16_SIZE;
    const sprite = view.getUint8(offset++);

    const x = view.getFloat32(offset, true);
    offset += FLOAT32_SIZE;
    const y = view.getFloat32(offset, true);
    offset += FLOAT32_SIZE;
    const onCooldown = Boolean(view.getUint8(offset++));


    return [
        {
            id,
            sprite,
            onCooldown,
            x,
            y
        },
        offset
    ] 
}

function extractBoardEntry(
    decoder: TextDecoder,
    view: DataView<ArrayBuffer>,
    u8view: Uint8Array<ArrayBuffer>,
    offset: number
): [Score, number] {
    const scoreBytes = view.getUint8(offset++);
    const userBytes = view.getUint8(offset++);
    const username = decoder.decode(u8view.subarray(offset, offset + userBytes));
    offset += userBytes;

    const score = view.getUint16(offset, true);
    offset += UINT16_SIZE;

    return [
        { username, score },
        offset
    ]
}

export function writePlayersIDMapPacket(players: Record<string, string>, encoder: TextEncoder): ArrayBuffer {
    const payload = encoder.encode(JSON.stringify(players));
    const size = UINT8_SIZE + payload.byteLength;
    const buf = new ArrayBuffer(size);
    const view = new Uint8Array(buf);

    view[0] = MSG_TYPES.PLAYER_ID_MAP;
    view.set(payload, 1);

    return buf
}

export function readPlayersIDMapPacket(packet: ArrayBuffer, decoder: TextDecoder): Record<string, string> {
    const view = new Uint8Array(packet);
    const json = decoder.decode(view.subarray(1));
    return JSON.parse(json)
}