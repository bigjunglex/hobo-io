import { k } from "./render";

export async function loadAssets() {
    const promises = [];
    
    promises.push(k.loadSprite('bean', 'bean.png'));
    promises.push(k.loadSprite('gun', 'gun.png'));
    promises.push(k.loadFont('happy', 'happy.ttf'))
    promises.push(k.loadSprite('mark', 'mark.png'));
    promises.push(k.loadSprite('zombean', 'zombean.png'));
    promises.push(k.loadSprite('ghosty', 'ghosty.png'));
    promises.push(k.loadSprite('spider_web', 'spider_web.png'));
    promises.push(k.loadSprite('portal', 'portal.png'));
    promises.push(k.loadSprite('mushroom', 'mushroom.png'))
    
    return Promise.all(promises);
}
