import CONSTANTS from "../../shared/constants.js";
import { Entity } from "./entity.js";

export class Player extends Entity {
    public score: number;
    public fireCooldown: number;
    public hp: number;
    public username: string;
    public sprite: string;
    public fireRate: number;
    public effect: string|undefined;
    public effectTimeout: NodeJS.Timeout|null;

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
        this.fireRate = CONSTANTS.PLAYER_FIRE_COOLDOWN;
        this.effect = undefined;
        this.effectTimeout = null;
    }

    update(dt: number): true|null {
        super.update(dt);
        this.score += dt * CONSTANTS.SCORE_PER_SECOND;
        
        this.x = Math.max(0, Math.min(CONSTANTS.MAP_SIZE, this.x));
        this.y = Math.max(0, Math.min(CONSTANTS.MAP_SIZE, this.y));

        this.fireCooldown -= dt;
        if (this.fireCooldown <= 0) {
            this.fireCooldown += this.fireRate
            return true
        }
        return null
    }

    takeDamage(damage: number) {
        this.hp -= damage;
    }

    onDealtDamage() {
        this.score += CONSTANTS.SCORE_BULLET_HIT;
    }

    clearEffectTimeout() {
        if (this.effectTimeout) {
            clearTimeout(this.effectTimeout)
            this.effectTimeout = null
        }
    }

    serializeForUpdate(): SerializedPlayer {
        return {
            ...(super.serializeForUpdate()),
            username: this.username,
            sprite: this.sprite,
            direction: this.direction,
            hp: this.hp,
            effect: this.effect,
        }
    }

    respawn(x:number, y: number) {
        this.hp = CONSTANTS.PLAYER_MAX_HP;
        this.fireCooldown = 0;
        this.score = 0;
        this.fireRate = CONSTANTS.PLAYER_FIRE_COOLDOWN;
        this.effect = undefined;
        this.effectTimeout = null;

        this.x = x;
        this.y = y;
    }

}