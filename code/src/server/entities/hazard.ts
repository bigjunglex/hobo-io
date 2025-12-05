import { Player } from "./player.js";
import CONSTANTS from "../../shared/constants.js";
import { Entity } from "./entity.js";

type Effect = (entity: Player) => void;

export class Hazard extends Entity {
    private sprite: string;
    public effect: Effect;
    public onCooldown: boolean;
    
    constructor(id: string, x: number, y: number, effect: Effect, sprite: string) {
        super(id, x, y, 0, 0);
        this.effect = effect.bind(this);
        this.sprite = sprite;
        this.onCooldown = false;
    }

    serializeForUpdate(): SerializedHazard {
        return {
            ...(super.serializeForUpdate()),
            sprite: this.sprite
        }
    }
}

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


function portalEffect(this: Hazard, player: Player) {
    if (this.onCooldown) return;
    this.onCooldown = true;

    const x = CONSTANTS.MAP_SIZE * (0.45 + Math.random() * 0.5);
    const y = CONSTANTS.MAP_SIZE * (0.45 + Math.random() * 0.5);

    player.x = x;
    player.y = y;
    
    setTimeout(() => {
        this.onCooldown = false;
    }, 500)
}

export function createPortalHazzard(x: number, y: number) {
    const id = crypto.randomUUID().substring(0,6);
    const sprite = CONSTANTS.HAZARD_PORTAL_SPRITE;
    return new Hazard(id, x, y, portalEffect, sprite)
}

export function createWebHazzard(x:number, y: number) {
    const id = crypto.randomUUID().substring(0,6);
    const sprite = CONSTANTS.HAZARD_WEB_SPRITE;
    return new Hazard(id, x, y, webEffect, sprite)
}
