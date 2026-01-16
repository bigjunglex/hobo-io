import CONSTANTS from "../shared/constants.js";
import { Hazard } from "./entities/hazard.js";
import { createFlameHazzard } from "./entities/hazards/flame.js";
import { createPortalHazzard } from "./entities/hazards/portal.js";
import { createWebHazzard } from "./entities/hazards/web.js";
import { Player } from "./entities/player.js";
import { getRandomCoords } from "./utils.js";

type EffectApplicator = (p: Player) => void;
type HazardTransformer = (hazards: Hazard[]) => void;
type HazardFactory = typeof createFlameHazzard;

/**
 * 
 * @returns [ applicator, remover, duration ]
 */
export function slowdownEvent(): [EffectApplicator, EffectApplicator, number] {
    const t = CONSTANTS.EVENTS_DURATION.PLAYERS;
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

/**
 * atm adds 100 webs
 * TODO: Refactor transform function creation - duplicates in all events
 * @param hazards game hazzards array
 * @return [ transformer, duration ] 
 */
export function webwarpEvent(): [HazardTransformer, number] {
    const t = CONSTANTS.EVENTS_DURATION.HAZARDS
    const transformer = createTransformer(createWebHazzard)
    return [transformer, t]
}

export function fireFormationEvent(): [HazardTransformer, number] {
    const t = CONSTANTS.EVENTS_DURATION.HAZARDS
    const transformer = createTransformer(createFlameHazzard)
    return [transformer, t]
}

export function portalProphecyEvent(): [HazardTransformer, number] {
    const t = CONSTANTS.EVENTS_DURATION.HAZARDS
    const transformer = createTransformer(createPortalHazzard)
    return [transformer, t]
}

function createTransformer(factory: HazardFactory): HazardTransformer {
    return function (h) {
        for (let i = 0; i < 100; i++) {
            const x = getRandomCoords();
            const y = getRandomCoords();
            h.push(factory(x, y));
        }
    }
}