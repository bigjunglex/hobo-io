import CONSTANTS from "../../../shared/constants.js";
import { Hazard } from "../hazard.js";
import { Player } from "../player.js";

function shieldEffect(this:Hazard, player: Player) {
    if (this.onCooldown) return;
    this.onCooldown = true;
    
    player.speed = CONSTANTS.PLAYER_SPEED * 1.5;
    player.fireRate = CONSTANTS.PLAYER_FIRE_COOLDOWN / 2;
    player.effect = CONSTANTS.PLAYER_EFFECT_BOOST;

    setTimeout(() => {
        player.speed = CONSTANTS.PLAYER_SPEED;
        player.fireRate = CONSTANTS.PLAYER_FIRE_COOLDOWN;
        player.effect = undefined;
    }, 3000)

    setTimeout(() => {
        this.onCooldown = false;
        this.reposition();
    }, 3000)
}


export function createShieldHazzard(x:number, y: number) {
    const id = crypto.randomUUID().substring(0, 6);
    const sprite = CONSTANTS.HAZARD_HASTE_SPRITE;
    return new Hazard(id, x, y, shieldEffect, sprite);
}
