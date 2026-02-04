export enum MSG_TYPES {
    GAME_UPDATE,
    GAME_OVER,
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

