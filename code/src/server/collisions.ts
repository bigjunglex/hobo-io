import CONSTANTS from "../shared/constants.js";
import { Bullet } from "./entities/bullet.js";
import { Hazard } from "./entities/hazard.js";
import { Player } from "./entities/player.js";

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
                if (player.effect === CONSTANTS.PLAYER_EFFECT_SHIELD && shieldAndBulletFacing(player, bullet)) {
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
        if (collider.effect !== CONSTANTS.PLAYER_EFFECT_SHIELD) {
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

export function applyMeleeCollisions() {}

function shieldAndBulletFacing(player: Player, bullet: Bullet): boolean {
    const dirDiff = (player.direction - bullet.direction + Math.PI) % (2 * Math.PI) - Math.PI;
    const dirDev = Math.abs(Math.abs(dirDiff) - Math.PI)
    return dirDev <= Math.PI / 4;
}