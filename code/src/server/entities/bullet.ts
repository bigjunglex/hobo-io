import CONSTANTS from "../../shared/constants.js";
import { Entity } from "./entity.js";

export class Bullet extends Entity {
    public parentID: number;

    constructor(parentID: number, id:number, x: number, y: number, direction: number) {
        super(
            id,
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

    reset(parentID: number, id: number, x: number, y: number, direction: number) {
        super.reset(
            id,
            x,
            y,
            direction,
            CONSTANTS.BULLET_SPEED
        )

        this.parentID = parentID;
    }
}


export function bulletFactory(parentID: number, id: number, x: number, y: number, direction: number) {
    return new Bullet(parentID, id, x, y, direction)
}