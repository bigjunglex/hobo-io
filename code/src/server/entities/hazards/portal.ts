import CONSTANTS, { HAZARDS } from "../../../shared/constants.js";
import { getRandomCoords } from "../../utils.js";
import { Hazard } from "../hazard.js";
import { Player } from "../player.js";

function portalEffect(this: Hazard, player: Player) {
    if (this.onCooldown) return;
    this.onCooldown = true;
    
    player.x = getRandomCoords();
    player.y = getRandomCoords();

    setTimeout(() => {
        this.onCooldown = false;
        this.reposition();
    }, 500)
}

export function createPortalHazzard(x: number, y: number) {
    const id = crypto.randomUUID().substring(0,6);
    const sprite = HAZARDS.Portal;
    return new Hazard(id, x, y, portalEffect, sprite)
}
