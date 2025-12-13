import CONSTANTS from "../../shared/constants.js";
import { Entity } from "./entity.js";

export class Bullet extends Entity {
    public parentID: string;

    constructor(parentID: string, x: number, y: number, direction: number) {
        super(
            crypto.randomUUID().substring(0,5),
            x,
            y,
            direction,
            CONSTANTS.BULLET_SPEED
        )

        this.parentID = parentID;
    }

    update(dt: number): boolean  {
        super.update(dt);
        return this.x < 0 || this.x > CONSTANTS.MAP_SIZE || this.y < 0 || this.y > CONSTANTS.MAP_SIZE
    }

    reset(parentID: string, x: number, y: number, direction: number) {
        super.reset(
            crypto.randomUUID().substring(0,5),
            x,
            y,
            direction,
            CONSTANTS.BULLET_SPEED
        )

        this.parentID = parentID;
    }
}


export function bulletFactory(parentID: string, x: number, y: number, direction: number) {
    return new Bullet(parentID, x, y, direction)
}