import { k } from "./render";

export async function loadAssets() {
    const promises = [];
    
    promises.push(k.loadSprite('bean', 'bean.png'));
    promises.push(k.loadSprite('gun', 'gun.png'));
    promises.push(k.loadFont('happy', 'happy.ttf'))
    promises.push(k.loadSprite('mark', 'mark.png'));
    promises.push(k.loadSprite('zombean', 'zombean.png'));
    promises.push(k.loadSprite('ghosty', 'ghosty.png'));

    return Promise.all(promises)
}
