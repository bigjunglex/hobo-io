import CONSTANTS from "../shared/constants.js";

export function getRandomCoords(): number {
    return CONSTANTS.MAP_SIZE * (0.45 + Math.random() * 0.5);
}

export function getRandomCoordsCenter(): number {
    return CONSTANTS.MAP_SIZE * (0.25 + Math.random() * 0.5);
}