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

/**
 * no big diff, on VPS main bottleneck is sync socket.emit
 * ---> get rid of socket io
 *  OR
 * ----> group broadcasts? bad idea prob, i need to find all entities near
 *  so diff playes in 1 grid cell, will have different neighbors? hmmmmm
 */
export class Grid {
    private bounds: Bounds;
    private dimensions: Dimensions;
    private cells: Map<string, Set<Client>>;

    constructor(bounds: Bounds, dimensions: Dimensions) {
        this.bounds = bounds;
        this.dimensions = dimensions;
        this.cells = new Map()
    }

    public newClient(position: Position, dimensions: Dimensions): Client {
        const client: Client = {
            position,
            dimensions,
            indices: null
        };

        this.insert(client)

        return client
    }

    private insert(client: Client) {
        const { x, y } = client.position;
        const { width, height } = client.dimensions;

        const i1 = this.getCellIndex([x - width / 2, y - height / 2]);
        const i2 = this.getCellIndex([x + width / 2, y + height / 2]);
         
        client.indices= [i1, i2];

        for (let x = i1[0], xn = i2[0]; x <= xn; x++) {
            for (let y = i1[1], yn = i2[1]; y <= yn; y++) {
                const k = this.getKey(x, y);
                
                if (!(k in this.cells)) {
                    this.cells.set(k, new Set());
                }

                this.cells.get(k)!.add(client)
            }
        }
    }


    private getKey(x: number, y: number):string {
        return x + '.' + y;
    }

    
    private getCellIndex(pos: [number, number]): [number, number] {
        const x = sat((pos[0] - this.bounds.minX) / (this.bounds.maxX - this.bounds.minX));
        const y = sat((pos[1] - this.bounds.minY) / (this.bounds.maxY - this.bounds.minY));
        

        const xIdx = Math.floor(x * (this.dimensions.width - 1));
        const yIdx = Math.floor(y * (this.dimensions.height - 1));

        return [xIdx, yIdx]
    }


    nearBy(position: Position, dimensions: Dimensions) {
        const { x, y } = position;
        const { width, height } = dimensions;
        const clients = new Set();

        const i1 = this.getCellIndex([x - width / 2, y - height / 2]);
        const i2 = this.getCellIndex([x + width / 2, y + height / 2]);
         
        for (let x = i1[0], xn = i2[0]; x <= xn; x++) {
            for (let y = i1[1], yn = i2[1]; y <= yn; y++) {
                const k = this.getKey(x, y);
                
                if (this.cells.has(k)) {
                    for (let v of this.cells.get(k)!) {
                        clients.add(v)
                    }
                }
            }
        }
        return clients;
    }

    updateClient(client: Client) {
        this.removeClient(client);
        this.insert(client)
    }

    removeClient(client: Client) {
        const [i1, i2] = client.indices!

        for (let x = i1[0], xn = i2[0]; x <= xn; x++) {
            for (let y = i1[1], yn = i2[1]; y <= yn; y++) {
                const k = this.getKey(x, y);
                this.cells.get(k)!.delete(client)
            }
        }
    }
}

function sat(x: number) {
    return Math.min(Math.max(x, 0.0), 1.0);
}