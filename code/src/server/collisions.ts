import CONSTANTS, { EFFECTS } from "../shared/constants.js";
import { Bullet } from "./entities/bullet.js";
import { Entity } from "./entities/entity.js";
import { Hazard } from "./entities/hazard.js";
import { Player } from "./entities/player.js";


/**
 * OLD one (without broad-phase)
 */
export function applyCollisions(players: Player[], bullets: Bullet[], hazards: Hazard[]): Bullet[] {
    const destroyedBullets:Bullet[] = [];
    const collideRange = (CONSTANTS.PLAYER_RADIUS + CONSTANTS.BULLET_RADIUS) ** 2;
    const collideRangeHazards = (CONSTANTS.PLAYER_RADIUS + CONSTANTS.HAZARD_RADIUS) ** 2;
    const collideRangeMelee = (CONSTANTS.PLAYER_RADIUS * 2) ** 2;

    for (let i = 0; i < bullets.length; i++) {
        const bullet = bullets[i];
        for (let j = 0; j < players.length; j++) {
            const player = players[j];
            if (
                bullet.parentID !== player.id &&
                player.distanceToSq(bullet) <= collideRange
            ) {
                if (player.effect === EFFECTS.Shield && shieldAndBulletFacing(player, bullet)) {
                    destroyedBullets.push(bullet);
                    break;
                } else {
                    destroyedBullets.push(bullet);
                    player.takeDamage(CONSTANTS.BULLET_DAMAGE);
                    break;
                }
            }
        }
    }

    for (let i = 0; i < hazards.length; i++) {
        const hazard = hazards[i];
        for (let j = 0; j < players.length; j++) {
            const player = players[j];
            if (player.distanceToSq(hazard) <= collideRangeHazards) {
                hazard.effect(player);
            } 
        }
    }

    for (let i = 0; i < players.length; i++) {
        const collider = players[i];
        if (collider.effect !== EFFECTS.Shield) {
            continue;
        } else {
            for (let j = 0; j < players.length; j++) {
                const collision = players[j]
                if (
                    collision.id !== collider.id &&
                    collider.distanceToSq(collision) <= collideRangeMelee
                ) {
                    collision.takeDamage(CONSTANTS.MELEE_DAMAGE);
                    collider.onDealtDamage();
                }
            }
        }
    }

    return destroyedBullets;
}

/**
 * what it was supposed to do???? QUESTOIN MARK
 */
export function applyMeleeCollisions() {}

function shieldAndBulletFacing(player: Player, bullet: Bullet): boolean {
    const dirDiff = (player.direction - bullet.direction + Math.PI) % (2 * Math.PI) - Math.PI;
    const dirDev = Math.abs(Math.abs(dirDiff) - Math.PI)
    return dirDev <= Math.PI / 4;
}

/**
 * New 2 step Collision, after broad-phase grid filter resolves narrow phase
 */
export function twoPhaseCollisions(
    players: Player[],
    bullets: Bullet[],
    hazards: Hazard[],
    grid: Grid
): Bullet[] {
    const destroyedBullets: Bullet[] = [];
    grid.clear();

    players.forEach(p => grid.insert(p, CONSTANTS.PLAYER_RADIUS));
    hazards.forEach(h => grid.insert(h, CONSTANTS.HAZARD_RADIUS));

    let average = 0;
    let count = 0;

    for (const b of bullets) {
        const nearBy = grid.getNearBy(b.x, b.y, CONSTANTS.BULLET_RADIUS);

        count++;
        average += nearBy.size;

        const isHit = bulletCollisonResolve(b, nearBy);
        if (isHit) {
            destroyedBullets.push(b);
        }
    }

    for (const h of hazards) {
        const nearBy = grid.getNearBy(h.x, h.y, CONSTANTS.HAZARD_RADIUS);
        count++;
        average += nearBy.size;

        hazardCollisonResolve(h, nearBy);
    }

    for (const p of players) {
        const nearBy = grid.getNearBy(p.x, p.y, CONSTANTS.PLAYER_RADIUS);
        count++;
        average += nearBy.size;

        playerCollisionResolve(p, nearBy)
    }

    return destroyedBullets;
}

/**
 * resolves bullet collision
 * @returns if bullet should be added to destroy array
 */
function bulletCollisonResolve(b: Bullet, entities: Set<Entity>): boolean {
    const collideRange = (CONSTANTS.PLAYER_RADIUS + CONSTANTS.BULLET_RADIUS) ** 2;
    for (const t of entities) {
        if ( !(t instanceof Player) ) continue;

        if (b.parentID !== t.id && t.distanceToSq(b) <= collideRange) {
            if (t.effect === EFFECTS.Shield && shieldAndBulletFacing(t, b)) {
                return true
            } else {
                t.takeDamage(CONSTANTS.BULLET_DAMAGE);
                return true;
            }
        }
    }

    return false
}

function hazardCollisonResolve(h: Hazard, entities: Set<Entity>) {
    const collideRangeHazards = (CONSTANTS.PLAYER_RADIUS + CONSTANTS.HAZARD_RADIUS) ** 2;
    for (const t of entities) {
        if (!(t instanceof Player)) continue;

        if (t.distanceToSq(h) <= collideRangeHazards) {
            h.effect(t);
        }
    }
}

function playerCollisionResolve(p: Player, entities: Set<Entity>) {
    if (p.effect !== EFFECTS.Shield) return;

    const collideRangeMelee = (CONSTANTS.PLAYER_RADIUS * 2) ** 2;
    for (const t of entities) {
        if (!(t instanceof Player)) continue;

        if ( t.id !== p.id && p.distanceToSq(t) <= collideRangeMelee ) {
            t.takeDamage(CONSTANTS.MELEE_DAMAGE);
            p.onDealtDamage();
        }
    }
}


/**
 *  unoptimized hash grid for circles
 *  TODO: what can be pooled? reuse strings? get rid of string keys? set pool?
 *  
 */
export class Grid {
    private grid: Map< string, Set<Entity> >;
    private cellsize: number;
    
    constructor(cellsize: number) {
        this.grid = new Map<string, Set<Entity>>;
        this.cellsize = cellsize;
    }

    private getKeys(x: number, y: number, r: number): string[] {
        const out: string[] = [];

        const minGX = Math.floor((x - r) / this.cellsize);
        const maxGX = Math.floor((x + r) / this.cellsize);
        const minGY = Math.floor((y - r) / this.cellsize);
        const maxGY = Math.floor((y + r) / this.cellsize);

        for (let gx = minGX; gx <= maxGX; gx++) {
            for (let gy = minGY; gy <= maxGY; gy++) {
                out.push(`${gx},${gy}`);
            }
        }

        return out
    }

    public insert(e: Entity, r: number) {
        const keys = this.getKeys(e.x, e.y, r);
        for (const k of keys) {
            if (!this.grid.has(k)) {
                this.grid.set(k, new Set());
            }
            
            this.grid.get(k)!.add(e)
        }
    }

    public getNearBy(x: number, y: number, r: number): Set<Entity> {
        const out = new Set<Entity>();
        const keys = this.getKeys(x, y, r);
        for (const k of keys) {
            const set = this.grid.get(k);
            if ( set ) {
                for (const e of set) {
                    out.add(e);
                }
            }
        }

        return out;
    }

    public clear() {
        this.grid.clear();
    }
}