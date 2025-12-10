import { Player } from "./player.js";
import CONSTANTS from "../../shared/constants.js";
import { Entity } from "./entity.js";
import { getRandomCoords } from "../utils.js";

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
            sprite: this.sprite,
            onCooldown: this.onCooldown,
        }
    }

    reposition() {
        this.x = getRandomCoords();
        this.y = getRandomCoords();
    }
}




