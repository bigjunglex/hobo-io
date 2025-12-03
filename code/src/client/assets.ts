import { k } from "./render";

export async function loadAssets() {
    const promises = [];
    
    promises.push(k.loadSprite('bean', 'ghosty.png'));
    promises.push(k.loadSprite('gun', 'gun.png'));
    promises.push(k.loadFont('happy', 'happy.ttf'))

    return Promise.all(promises)
}
