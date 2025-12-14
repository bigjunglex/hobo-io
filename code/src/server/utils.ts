import { throws } from "assert";
import CONSTANTS from "../shared/constants.js";
import { Bullet } from "./entities/bullet.js";

export function getRandomCoords(): number {
    return  Math.random() * CONSTANTS.MAP_SIZE;
}

export function getRandomCoordsCenter(): number {
    return CONSTANTS.MAP_SIZE * (0.25 + Math.random() * 0.5);
}

export function distanceToSq(fx: number, fy:number, tx: number, ty: number) {
    const dx = fx - tx;
    const dy = fy - ty;
    return dx * dx + dy * dy;
}

export class BulletPool {
    private pool: Bullet[];

    constructor() {
        this.pool = [];
    }

    recieve(parentID: string, x: number, y: number, direction: number): Bullet {
        const pool = this.pool;
        if (pool.length) {
            const bullet = pool.pop()!;
            bullet.reset(parentID, x, y, direction);
            return bullet;
        }

        return new Bullet(parentID, x, y, direction)
    }

    release(b: Bullet) {
        this.pool.push(b)
    }

    size() {
        return this.pool.length
    }
}