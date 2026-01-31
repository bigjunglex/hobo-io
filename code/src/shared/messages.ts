import { MSG_TYPES } from "./constants.js";

export const UINT8_SIZE = 1;
export const UINT16_SIZE = 2;
export const UINT32_SIZE = 4;
export const FLOAT32_SIZE = 4;

export function joinPacket(username: string, sprite: string): Buffer<ArrayBuffer> {
    const userBuf = Buffer.from(username);
    const size = UINT8_SIZE * 2 + userBuf.length;
    const packet = Buffer.alloc(size);

    packet.writeInt8(MSG_TYPES.JOIN_GAME, 0);
    packet.set(userBuf, 1);
    packet.writeInt8(+sprite);

    return packet;
}

export function readPacket(packet: Buffer<ArrayBuffer>): any {
    if (packet !instanceof Buffer) {
        console.error('UNGA BUNGA MSG')
        return;
    };
    
    const type = packet[0];
    
    if (type === MSG_TYPES.JOIN_GAME) {
        const username = packet.subarray(1, packet.length - 1).toString();
        const sprite = packet[packet.length - 1];
        return [ username, sprite ]
    }
}