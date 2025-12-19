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

/**
 * c = player count
 */
type GameState = {
    t: number;
    me: Player;
    others: Player[];
    bullets: SerializedEntity[];
    hazards: SerializedHazard[];
    leaderboard: Score[];
    c: number;
    score: number;  
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

type GlobalState = Pick<GameState, 'bullets' | 'hazards' | 'leaderboard' | 't'> & { players: SerializedPlayer[] };

type Factory<T> = (...args:any[]) => T

type Bounds = {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

type Dimensions = {
    width: number;
    height: number;
}

type Client = {
    position: Position;
    dimensions: Dimensions;
    indices: null | [number, number][];
}
