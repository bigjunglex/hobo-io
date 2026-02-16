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
    id: number;
    hp: number;
    username: string;
    sprite: number;
    effect: number;
} & Position;

type Bullet = {
    id: number;
    direction?: number;
    parentID?: string;
} & Position;

type Score = {
    id: number;
    score: number;
}

type SerializedHazard = {
    id: number;
    sprite: number;
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
    entityID: number;
    type: number;
    ref: Object;
}

type SerializedEntity = {
    id: number;
} & Position;

type SerializedPlayer = SerializedEntity & {
    username: string;
    sprite: number;
    effect: number;
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

type ChatForm = HTMLFormElement & { 
    elements: {
        message: HTMLInputElement
    } 
}

type ChatMessage = {
    username: string;
    id: number;
    message: string;
    time: number;
}

type NotifyMessage = Omit<ChatMessage, 'message'>

type GameEvent = 'death' | 'web warp' | 'fire formation' | 'mushroom monday'

type ScoreData = {
    id: number;
    score: number;
    name: string;
    date: string;
}

interface Socket {
    id: number
}