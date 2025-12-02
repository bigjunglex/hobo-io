import CONSTANTS from "../shared/constants.js";
import { Bullet } from "./entities/bullet.js";
import { Player } from "./entities/player.js";

export function applyCollisions(players: Player[], bullets: Bullet[]): Bullet[] {
    const destroyedBullets:Bullet[] = [];
    const collideRange = CONSTANTS.PLAYER_RADIUS + CONSTANTS.BULLET_RADIUS;
    for (let i = 0; i < bullets.length; i++) {
        const bullet = bullets[i];
        for (let j = 0; j < players.length; j++) {
            const player = players[j];
            if (
                bullet.parentID !== player.id &&
                player.distanceTo(bullet) <= collideRange
            ) {
                destroyedBullets.push(bullet);
                player.takeBulletDamage();
                break;
            }
        }
    }

    return destroyedBullets;
}