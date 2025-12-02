import { k } from "./render";

export async function loadAssets() {
    const promises = [];
    
    promises.push(k.loadSprite('bean', 'bean.png'));
    promises.push(k.loadSprite('gun', 'gun.png'));

    return Promise.all(promises)
}
