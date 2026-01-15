import CONSTANTS from "../shared/constants.js";
import { Player } from "./entities/player.js";

type EffectApplicator = (p: Player) => void; 
/**
 * 
 * @returns [ applicator, remover, t ]
 */
export function slowdownEvent(): [EffectApplicator, EffectApplicator, number] {
    const t = CONSTANTS.EVENTS_DURATION.SLOWDOWN;
    const applicator: EffectApplicator = (p) => {
        p.speed = CONSTANTS.PLAYER_SPEED / 4;
        p.fireRate = CONSTANTS.PLAYER_FIRE_COOLDOWN * 4;
    }

    const remover: EffectApplicator = (p) =>{
        p.speed = CONSTANTS.PLAYER_SPEED;
        p.fireRate = CONSTANTS.PLAYER_FIRE_COOLDOWN;
    }
    
    return [applicator, remover, t]
}