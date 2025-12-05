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

    player.x = getRandomCoords();
    player.y = getRandomCoords();
    
    setTimeout(() => {
        this.onCooldown = false;
        this.x = getRandomCoords();
        this.y = getRandomCoords();
    }, 500)
}

function hasteEffect(this:Hazard, player: Player) {
    if (this.onCooldown) return;
    this.onCooldown = true;
    
    player.speed = CONSTANTS.PLAYER_SPEED * 1.5;
    player.fireRate = CONSTANTS.PLAYER_FIRE_COOLDOWN / 2;

    setTimeout(() => {
        player.speed = CONSTANTS.PLAYER_SPEED;
        player.fireRate = CONSTANTS.PLAYER_FIRE_COOLDOWN;
    }, 3000)

    setTimeout(() => {
        this.onCooldown = false;
        this.x = getRandomCoords();
        this.y = getRandomCoords();
    }, 3000)
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

export function createHasteHazzard(x:number, y: number) {
    const id = crypto.randomUUID().substring(0, 6);
    const sprite = CONSTANTS.HAZARD_HASTE_SPRITE;
    return new Hazard(id, x, y, hasteEffect, sprite);
}

