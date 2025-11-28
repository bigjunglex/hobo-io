import CONSTANTS from "../../shared/constants";
import { Entity } from "./entity";

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
}