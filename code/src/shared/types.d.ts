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
} & Position;

type Bullet = {
    id: string;
    direction: number;
} & Position;

type Score = {
    username: string;
    score: number;
}

type GameState = {
    t: number;
    me: Player;
    others: Player[];
    bullets: Bullet[];
    leaderboard: Score[];
}