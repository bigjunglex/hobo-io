import CONSTANTS from "../shared/constants.js";
import { Bullet } from "./entities/bullet.js";
import { Hazard } from "./entities/hazard.js";
import { Player } from "./entities/player.js";

export function applyCollisions(players: Player[], bullets: Bullet[], hazards: Hazard[]): Bullet[] {
    const destroyedBullets:Bullet[] = [];
    const collideRange = (CONSTANTS.PLAYER_RADIUS + CONSTANTS.BULLET_RADIUS) ** 2;
    const collideRangeHazards = (CONSTANTS.PLAYER_RADIUS + CONSTANTS.HAZARD_RADIUS) ** 2;

    for (let i = 0; i < bullets.length; i++) {
        const bullet = bullets[i];
        for (let j = 0; j < players.length; j++) {
            const player = players[j];
            if (
                bullet.parentID !== player.id &&
                player.distanceToSq(bullet) <= collideRange
            ) {
                destroyedBullets.push(bullet);
                player.takeBulletDamage();
                break;
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

    return destroyedBullets;
}