import CONSTANTS, { HAZARDS } from "../../../shared/constants.js";
import { idRegistry } from "../../utils.js";
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

export function createFlameHazzard(x:number, y: number, registry: idRegistry) {
    const id = registry.getId();
    const sprite = HAZARDS.Flame;
    return new Hazard(id, x, y, flameEffect, sprite)
}