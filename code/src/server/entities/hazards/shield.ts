import CONSTANTS, { EFFECTS, HAZARDS } from "../../../shared/constants.js";
import { Hazard } from "../hazard.js";
import { Player } from "../player.js";

function shieldEffect(this:Hazard, player: Player) {
    if (this.onCooldown) return;
    this.onCooldown = true;
    
    player.clearEffectTimeout();

    player.speed = CONSTANTS.PLAYER_SPEED * 0.5;
    player.fireRate = 0;
    player.fireCooldown = 7000;
    player.effect = EFFECTS.Shield;

    setTimeout(() => {
        player.speed = CONSTANTS.PLAYER_SPEED;
        player.fireRate = CONSTANTS.PLAYER_FIRE_COOLDOWN;
        player.fireCooldown = 0;
        player.effect = EFFECTS.Null;

        this.onCooldown = false;
        this.reposition();
    }, CONSTANTS.HAZARD_SHIELD_DURATION)

}


export function createShieldHazzard(x:number, y: number) {
    const id = crypto.randomUUID().substring(0, 6);
    const sprite = HAZARDS.Steel;
    return new Hazard(id, x, y, shieldEffect, sprite);
}
