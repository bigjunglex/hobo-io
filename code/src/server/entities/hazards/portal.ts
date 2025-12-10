import CONSTANTS from "../../../shared/constants.js";
import { Hazard } from "../hazard.js";
import { Player } from "../player.js";

function portalEffect(this: Hazard, player: Player) {
    if (this.onCooldown) return;
    this.onCooldown = true;
    
    setTimeout(() => {
        this.onCooldown = false;
        this.reposition();
    }, 500)
}

export function createPortalHazzard(x: number, y: number) {
    const id = crypto.randomUUID().substring(0,6);
    const sprite = CONSTANTS.HAZARD_PORTAL_SPRITE;
    return new Hazard(id, x, y, portalEffect, sprite)
}
