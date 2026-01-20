import CONSTANTS from "../../../shared/constants.js";
import { Hazard } from "../hazard.js";
import { Player } from "../player.js";

function flameEffect(this:Hazard, player: Player) {
    if (this.onCooldown) return;
    this.onCooldown = true;

    player.takeDamage(CONSTANTS.FLAME_DAMAGE);

    setTimeout(() => {
        this.onCooldown = false;
    }, 500)
}

export function createFlameHazzard(x:number, y: number) {
    const id = crypto.randomUUID().substring(0, 6);
    const sprite = CONSTANTS.HAZARD_SPRITES[4];
    return new Hazard(id, x, y, flameEffect, sprite)
}