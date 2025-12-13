declare module '*.css' {
    const content: { [className: string]: string };
    export default content;
}

type GameCallback = (...args: any) => void;

type Position = {
    x: number;
    y: number;
}

type Player = {
    direction: number;
    id: string;
    hp: number;
    username: string;
    sprite: string;
    effect?: string;
} & Position;

type Bullet = {
    id: string;
    direction?: number;
    parentID?: string;
} & Position;

type Score = {
    username: string;
    score: number;
}

type SerializedHazard = {
    id: string;
    sprite: string;
    onCooldown: boolean;
} & Position;

type GameState = {
    t: number;
    me: Player;
    others: Player[];
    bullets: SerializedEntity[];
    hazards: SerializedHazard[];
    leaderboard: Score[];
}

type EffectEntry = {
    entityID: string;
    type: string;
    ref: Object;
}

type SerializedEntity = {
    id: string;
} & Position;

type SerializedPlayer = SerializedEntity & {
    username: string;
    sprite:string;
    effect?: string;
    direction: number;
    hp: number
}

type Factory<T> = (...args:any[]) => T
