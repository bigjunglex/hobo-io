import { Player } from "./player.js";
import CONSTANTS from "../../shared/constants.js";
import { Entity } from "./entity.js";

type Effect = (entity: Player) => void;

export class Hazard extends Entity {
    private sprite: string;
    public effect: Effect;
    
    constructor(id: string, x: number, y: number, effect: Effect, sprite: string) {
        super(id, x, y, 0, 0);
        this.effect = effect;
        this.sprite = sprite;
    }

    serializeForUpdate(): SerializedHazard {
        return {
            ...(super.serializeForUpdate()),
            sprite: this.sprite
        }
    }
}

const webEffect:Effect = (player) => {
    player.speed = 0;
    setTimeout(() => player.speed = CONSTANTS.PLAYER_SPEED, 2000)
};


export function createWebHazzard(x:number, y: number) {
    const id = crypto.randomUUID().substring(0,6);
    const sprite = CONSTANTS.HAZARD_WEB_SPRITE;
    return new Hazard(id, x, y, webEffect, sprite)
}
