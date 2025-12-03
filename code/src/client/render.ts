import kaplay from 'kaplay';
import { debounce } from 'throttle-debounce';
import { getCurrentState } from './state';
import CONSTANTS from '../shared/constants';
import assert from 'assert';

const canvas = document.getElementById('game') as HTMLCanvasElement;
setCanvasDimensions();
window.addEventListener('resize', debounce(40, setCanvasDimensions))
export const k = kaplay({ canvas });

const { PLAYER_MAX_HP, BULLET_RADIUS, MAP_SIZE } = CONSTANTS;

k.scene('arena', () => {
    k.add(createBackground())
    k.onUpdate(() => {
        k.destroyAll('obj')
        const { me, others, bullets } = getCurrentState();
        
        if (me) {
            k.setCamPos(me.x, me.y);
            k.add(createPlayer(me));
            
            for (const p of others) {
                k.add(createPlayer(p))
            }

            for (const b of bullets) {
                k.add(createBullet(b))
            }
        }
    })
})

k.scene('entry', () => {
    const bg = createBackground();
    bg.pos = k.vec2(-200, -200)
    k.add(bg)
})

export function stopRendering() {
    k.go('entry');
};

export function startRendering() {
    k.go('arena')
};


function createPlayer(player: Player & { sprite?: string }) {
    const { x, y, direction, hp } = player;
    const degrees = k.rad2deg(direction) - 90;
    const obj = k.make([
        k.sprite(player.sprite!),
        k.pos(x,y),
        k.anchor('center'),
        'obj'
    ])

    const gun = obj.add([
        k.sprite('gun'),
        k.anchor('left'),
        k.pos(15, 10),
        k.rotate(degrees)
    ])

    if (degrees < -90){
        gun.flipY = true;
        gun.pos = k.vec2(-15, 10);
    }

    obj.add([
        k.text(player.username, {
            font: 'happy',
            size: 20
        }),
        k.pos(0, -40),
        k.anchor('center')
    ])

    obj.add([
        k.text(`${Math.floor(hp)}/${PLAYER_MAX_HP}`, {
            size: 12,
            font: 'happy'
        
        }),
        k.pos(0, 35),
        k.anchor('center')
    ])


    return obj
}


function createBackground() {
    const cell = 50;
    const lineColor = k.rgb(42, 48, 60)
    const mainColor = k.rgb(36, 41, 51)

    const bg = k.make([
        k.rect(MAP_SIZE, MAP_SIZE),
        k.color(mainColor),
        k.pos(0),
        k.outline(4, k.MAGENTA)
    ]);
    
    for (let x = 0; x <= MAP_SIZE; x += cell) {
        const width = x % (cell * 4) === 0 ? 2 : 1;
        const opacity = x % (cell * 4) === 0 ? 0.4 : 0.2;
        
        bg.add([
            k.rect(width, MAP_SIZE),
            k.pos(x, 0),
            k.color(lineColor),
            k.opacity(opacity)
        ]);
    }
    
    for (let y = 0; y <= MAP_SIZE; y += cell) {
        const height = y % (cell * 4) === 0 ? 2 : 1;
        const opacity = y % (cell * 4) === 0 ? 0.4 : 0.2;
        
        bg.add([
            k.rect(MAP_SIZE, height),
            k.pos(0, y),
            k.color(lineColor),
            k.opacity(opacity)
        ]);
    }

    return bg;
}

function createBullet(bullet: Bullet | SerializedEntity) {
    return k.make([
        k.circle(BULLET_RADIUS),
        k.pos(bullet.x, bullet.y),
        k.color(k.MAGENTA),
        'obj'
    ])
}


function setCanvasDimensions() {
    const scaleR = Math.max(1, 800 / window.innerWidth);
    canvas.width = scaleR * window.innerWidth;
    canvas.height = scaleR * window.innerHeight;
}