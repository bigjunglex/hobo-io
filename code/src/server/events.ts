import CONSTANTS from "../shared/constants.js";
import { Hazard } from "./entities/hazard.js";
import { createFlameHazzard } from "./entities/hazards/flame.js";
import { createBoostHazzard } from "./entities/hazards/haste.js";
import { createPortalHazzard } from "./entities/hazards/portal.js";
import { createShieldHazzard } from "./entities/hazards/shield.js";
import { createWebHazzard } from "./entities/hazards/web.js";
import { Player } from "./entities/player.js";
import { getRandomCoords, idRegistry } from "./utils.js";

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
        if (p.effectTimeout) clearTimeout(p.effectTimeout);
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
 * @param registry uses Game.idRegistry singleton, 100% argdrilled
 * @return [ transformer, duration ] 
 */
export function webwarpEvent(registry: idRegistry): [HazardTransformer, number] {
    const t = CONSTANTS.EVENTS_DURATION.HAZARDS
    const transformer = createTransformer(createWebHazzard, registry)
    return [transformer, t]
}

export function fireFormationEvent(registry: idRegistry): [HazardTransformer, number] {
    const t = CONSTANTS.EVENTS_DURATION.HAZARDS
    const transformer = createTransformer(createFlameHazzard, registry)
    return [transformer, t]
}

export function portalProphecyEvent(registry: idRegistry): [HazardTransformer, number] {
    const t = CONSTANTS.EVENTS_DURATION.HAZARDS
    const transformer = createTransformer(createPortalHazzard, registry)
    return [transformer, t]
}

export function mushroomMadnessEvent(registry: idRegistry): [HazardTransformer, number] {
    const t = CONSTANTS.EVENTS_DURATION.HAZARDS
    const transformer = createTransformer(createBoostHazzard, registry)
    return [transformer, t]
}

export function shieldSlamEvent(registry: idRegistry): [HazardTransformer, number] {
    const t = CONSTANTS.EVENTS_DURATION.HAZARDS
    const transformer = createTransformer(createShieldHazzard, registry)
    return [transformer, t]
}

function createTransformer(factory: HazardFactory, registry: idRegistry): HazardTransformer {
    return function (h) {
        for (let i = 0; i < 100; i++) {
            const x = getRandomCoords();
            const y = getRandomCoords();
            h.push(factory(x, y, registry));
        }
    }
}