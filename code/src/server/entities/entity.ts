import { Hazard } from "./hazard";

export class Entity {
    public id: number;
    public x: number;
    public y: number;
    public direction: number;
    public speed: number

    constructor(id: number, x: number, y: number, direction: number, speed: number) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.speed = speed;
    }

    update(dt: number) {
        this.x += dt * this.speed * Math.sin(this.direction);
        this.y -= dt * this.speed * Math.cos(this.direction);
    }

    distanceToSq(target: Entity | Hazard) {
        const dx = this.x - target.x;
        const dy = this.y - target.y;
        return dx * dx + dy * dy;
    }

    setDirection(direction: number) {
        this.direction = direction;
    }

    // reset(...params: ConstructorParameters<typeof Entity>)
    public reset(id: number, x: number, y: number, direction: number, speed: number) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.speed = speed;
    }

    serializeForUpdate(): SerializedEntity {
        return {
            id: this.id,
            x: this.x,
            y: this.y
        }
    }
}