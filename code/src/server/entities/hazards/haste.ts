import CONSTANTS, { EFFECTS, HAZARDS } from "../../../shared/constants.js";
import { idRegistry } from "../../utils.js";
import { Hazard } from "../hazard.js";
import { Player } from "../player.js";


function hasteEffect(this:Hazard, player: Player) {
    if (this.onCooldown) return;
    this.onCooldown = true;
    
    player.clearEffectTimeout();
    player.speed = CONSTANTS.PLAYER_SPEED * 1.5;
    player.fireRate = CONSTANTS.PLAYER_FIRE_COOLDOWN / 2;
    player.effect = EFFECTS.Boost;
    player.hp += CONSTANTS.HAZARD_BOOST_HEAL;   

    const effectTimeout = setTimeout(() => {
        player.speed = CONSTANTS.PLAYER_SPEED;
        player.fireRate = CONSTANTS.PLAYER_FIRE_COOLDOWN;
        player.effect = EFFECTS.Null;
    }, CONSTANTS.HAZARD_BOOST_DURATION)

    player.effectTimeout = effectTimeout;

    setTimeout(() => {
        this.onCooldown = false;
        this.reposition();
    }, CONSTANTS.HAZARD_BOOST_DURATION)
}


export function createBoostHazzard(x:number, y: number, registry: idRegistry) {
    const id = registry.getId();
    const sprite = HAZARDS.Mushroom;
    return new Hazard(id, x, y, hasteEffect, sprite);
}

