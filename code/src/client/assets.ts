import { k } from "./render";

export async function loadAssets() {
    const promises = [];
    
    promises.push(k.loadShaderURL('vhs', null, 'shaders/vhs.frag'));
    promises.push(k.loadSprite('bean', 'bean.png'));
    promises.push(k.loadSprite('gun', 'gun.png'));
    promises.push(k.loadFont('happy', 'happy.ttf'))
    promises.push(k.loadSprite('mark', 'mark.png'));
    promises.push(k.loadSprite('zombean', 'zombean.png'));
    promises.push(k.loadSprite('ghosty', 'ghosty.png'));
    promises.push(k.loadSprite('spider_web', 'spider_web.png'));
    promises.push(k.loadSprite('portal', 'portal.png'));
    promises.push(k.loadSprite('mushroom', 'mushroom.png'));
    promises.push(k.loadSprite('steel', 'steel.png'));
    promises.push(k.loadSprite('shield', 'spike.png'));
    promises.push(k.loadSprite('boost', 'poof.png', {
        sliceX: 6,
        sliceY: 5,
        anims: {
            "anim": {
                from: 2,
                to: 15,
                loop: true,
                speed: 30,
            },
        },
    }))
    promises.push(k.loadSound('hit', 'sounds/bean_voice.wav'));
    promises.push(k.loadSound('hurt', 'sounds/mark_voice.wav'));

    
    return Promise.all(promises);
}
