import CONSTANTS, { HAZARDS } from "../../../shared/constants.js";
import { Hazard } from "../hazard.js";
import { Player } from "../player.js";

function webEffect(this:Hazard, player: Player) {
    if (this.onCooldown) return;
    this.onCooldown = true;
    player.speed = 0;

    setTimeout(() => {
        player.speed = CONSTANTS.PLAYER_SPEED;
    }, 2000)

    setTimeout(() => {
        this.onCooldown = false;
    }, 3000)
};

export function createWebHazzard(x:number, y: number) {
    const id = crypto.randomUUID().substring(0,6);
    const sprite = HAZARDS.Spider_Web;
    return new Hazard(id, x, y, webEffect, sprite)
}
