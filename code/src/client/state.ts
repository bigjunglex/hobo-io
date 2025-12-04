import { updateLeaderboard } from "./leaderboard";

const RENDER_DELAY = 100;

const gameUpdates:GameState[] = [];
let gameStart = 0;
let firstServerTimestamp = 0;

export function initState() {
    gameStart = 0;
    firstServerTimestamp = 0;
}

export function processGameUpdate(update: GameState) {
    if (!firstServerTimestamp) {
        firstServerTimestamp = update.t;
        gameStart = Date.now();
    }
    gameUpdates.push(update);

    updateLeaderboard(update.leaderboard);
    
    const base = getBaseUpdate();
    if (base > 0) gameUpdates.splice(0, base);
}

function currentServerTime() {
    return firstServerTimestamp + (Date.now() - gameStart) - RENDER_DELAY;
}

function getBaseUpdate() :number {
    const serverTime = currentServerTime();
    for (let i = gameUpdates.length - 1; i >= 0; i--) {
        if (gameUpdates[i].t <= serverTime) return i;
    }
    return -1;
}


export function getCurrentState() {
    if (!firstServerTimestamp) return {} as GameState;

    const base = getBaseUpdate();
    const serverTime = currentServerTime();

    if (base < 0) {
        return gameUpdates[gameUpdates.length - 1];
    } else if (base === gameUpdates.length - 1) {
        return gameUpdates[base];
    } else {
        const baseUpdate = gameUpdates[base];
        const next = gameUpdates[base + 1];
        const r = (serverTime - baseUpdate.t) / (next.t - baseUpdate.t);

        return {
            me: interpolateObject<Player>(baseUpdate.me, next.me, r),
            others: interpolateObjectArray<Player>(baseUpdate.others, next.others, r),
            bullets: interpolateObjectArray<Bullet>(baseUpdate.bullets, next.bullets, r),
            hazards: baseUpdate.hazards
        } satisfies Pick<GameState, 'me' | 'bullets' | 'others' | 'hazards'>
    }
};

function interpolateObject<T extends Bullet | Player >(from: T, to: T, ratio: number): T {
    if (!to) return from;

    const interpolated = {} as T;
    Object.keys(from).forEach(key => {
        if (key === 'direction') {
            interpolated[key] = interpolateDirection(from[key]!, to[key]!, ratio)
        } else if (key === 'x' || key === 'y') {
            interpolated[key] = from[key] + (to[key] - from[key]) * ratio;
        } else {
            //@ts-ignore
            interpolated[key] = to[key]
        }
    })

    return interpolated as T
}

function interpolateObjectArray<T extends Bullet | Player>(from: T[], to: T[], ratio: number): T[] {
    return from.map(obj => interpolateObject<T>(obj, to.find(obj2 => obj.id === obj2.id)!, ratio))
}

function interpolateDirection(from: number, to: number, ratio: number): any {
    const absDir = Math.abs(to - from);
    if (absDir >= Math.PI) {
        if (from > to) {
            return from + (to + 2 * Math.PI - from) * ratio;
        } else {
            return from - (to - 2 * Math.PI - from) * ratio;
        }
    } else {
        return from + (to - from) * ratio
    }
}
