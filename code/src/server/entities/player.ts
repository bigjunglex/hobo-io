import CONSTANTS from "../../shared/constants.js";
import { Bullet } from "./bullet.js";
import { Entity } from "./entity.js";

export class Player extends Entity {
    public score: number;
    public fireCooldown: number;
    public hp: number;
    public username: string;
    public sprite: string;

    constructor(id: string, username: string, x: number, y: number, sprite: string) {
        super(
            id,
            x,
            y,
            Math.random() * 2 * Math.PI,
            CONSTANTS.PLAYER_SPEED
        )
        
        this.sprite = sprite;
        this.username = username;
        this.hp = CONSTANTS.PLAYER_MAX_HP;
        this.fireCooldown = 0;
        this.score = 0;
    }

    update(dt: number): Bullet|null {
        super.update(dt);
        this.score += dt * CONSTANTS.SCORE_PER_SECOND;
        
        this.x = Math.max(0, Math.min(CONSTANTS.MAP_SIZE, this.x));
        this.y = Math.max(0, Math.min(CONSTANTS.MAP_SIZE, this.y));

        this.fireCooldown -= dt;
        if (this.fireCooldown <= 0) {
            this.fireCooldown += CONSTANTS.PLAYER_FIRE_COOLDOWN;
            return new Bullet(this.id, this.x, this.y, this.direction)
        }
        return null
    }

    takeBulletDamage() {
        this.hp -= CONSTANTS.BULLET_DAMAGE;
    }

    onDealtDamage() {
        this.score += CONSTANTS.SCORE_BULLET_HIT;
    }

    serializeForUpdate(): SerializedPlayer {
        return {
            ...(super.serializeForUpdate()),
            username: this.username,
            sprite: this.sprite,
            direction: this.direction,
            hp: this.hp
        }
    }

}