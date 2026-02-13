import CONSTANTS from "../shared/constants.js";
import { Bullet } from "./entities/bullet.js";

export function getRandomCoords(): number {
    return  Math.random() * CONSTANTS.MAP_SIZE;
}

export function getRandomCoordsCenter(): number {
    return CONSTANTS.MAP_SIZE * (0.25 + Math.random() * 0.5);
}

/**
 * moving from Math.sqrt spam saved perf big time
 */
export function distanceToSq(fx: number, fy:number, tx: number, ty: number) {
    const dx = fx - tx;
    const dy = fy - ty;
    return dx * dx + dy * dy;
}

/**
 * big performance boost on test vps
 */
export class BulletPool {
    private pool: Bullet[];

    constructor() {
        this.pool = [];
    }

    recieve(parentID: number, id: number, x: number, y: number, direction: number): Bullet {
        const pool = this.pool;
        if (pool.length) {
            const bullet = pool.pop()!;
            bullet.reset(parentID, id, x, y, direction);
            return bullet;
        }

        return new Bullet(parentID, id, x, y, direction)
    }

    release(b: Bullet) {
        this.pool.push(b)
    }

    size() {
        return this.pool.length
    }
}

export class BufferPool {/** TODO, since its mostly usable on server, mb use Buffer module??? */ };

export class idRegistry {
    private ready: number[];
    private next: number;
    private max: number;

    constructor(size: number) {
        this.max = size;
        this.next = 0;
        this.ready = [];
    }

    getId(): number {
        if (this.ready.length > 0) {
            const id = this.ready.pop()!
            return id;
        }

        if (this.next < this.max) {
            const id = this.next;
            this.next++;
            return id
        }

        throw Error('No IDs within limits have left');
    }

    release(id: number): void {
        this.ready.push(id);
    }
}