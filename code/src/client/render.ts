import kaplay, { GameObj, PosComp } from 'kaplay';
import { getCurrentState } from './state';
import CONSTANTS from '../shared/constants';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const { PLAYER_MAX_HP, BULLET_RADIUS, MAP_SIZE } = CONSTANTS;


export const k = kaplay({ canvas, debugKey: 'f3' });

// commented out until proper scaling achived
// setCanvasDimensions();
// window.addEventListener('resize', debounce(40, setCanvasDimensions))
// k.onSceneLeave(() => setCanvasDimensions())

type RenderState = ReturnType<typeof getCurrentState>


k.scene('arena', () => {
    let effects:EffectEntry[] = [];

    k.add(createBackground())
    k.onUpdate(() => {
        const state = getCurrentState();
        const me = state.me;
        
        if (me) {
            const y = me.y > MAP_SIZE / 2 
            ? Math.min(me.y, MAP_SIZE - canvas.height / 2)
            : Math.max(me.y, canvas.height / 2);
            
            const x = me.x > MAP_SIZE / 2 
            ? Math.min(me.x, MAP_SIZE - canvas.width / 2)
            : Math.max(me.x, canvas.width / 2);
            
            k.setCamPos(x, y);
            effects = updateEffects(state, effects);
        }
    })

    k.onDraw(() => {
        const {me, others, bullets, hazards } = getCurrentState();

        if (me) {
            drawPlayer(me);
        }

        if (others) {
            for (const p of others) {
                drawPlayer(p)
            }
        }

        if (bullets) {
            for (const b of bullets) {
                drawBullet(b)
            }
        }

        if (hazards) {
            for (const h of hazards) {
                if (!h.onCooldown || h.sprite === CONSTANTS.HAZARD_WEB_SPRITE) {
                    drawHazard(h)
                }
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

function updateEffects(state: RenderState, effects: EffectEntry[]) {
    const effectedPlayers:Player[] = [];
    const aliveEffects:EffectEntry[] = [];

    if (state.me?.effect === CONSTANTS.PLAYER_EFFECT_BOOST) effectedPlayers.push(state.me);

    for (let i = 0; i < state.others.length; i++) {
        const p = state.others[i];
        if (!isDrawable(p.x, p.y)) continue;
        if (p?.effect === CONSTANTS.PLAYER_EFFECT_BOOST) effectedPlayers.push(p);
    }

    for (let i = 0; i < effectedPlayers.length; i++) {
        const p = effectedPlayers[i];
        const effect = p.effect!;

        if (effects.find(e => e.entityID === p.id)) continue;
        
        const ref = k.add([
            k.sprite(effect, { anim: 'anim' }),
            k.scale(0.5),
            k.anchor('center'),
            k.pos(p.x, p.y),
            'effect'
        ])
        
        const entry: EffectEntry = {
            entityID: p.id,
            type: effect,
            ref
        }

        effects.push(entry);
    }
    
    effects.forEach(e => {
        let anchorEntity:Player|null = null;
        const effect = e.ref as GameObj & PosComp;

        if (e.entityID === state.me.id){
            anchorEntity = state.me;
        } else {
            const others = state.others.find(p => p.id === e.entityID);
            if (others) anchorEntity = others;
        }
        
        if (anchorEntity && anchorEntity.effect) {
            const { x, y } = anchorEntity;
            const newPos = k.vec2(x, y)
            effect.moveTo(newPos)
            aliveEffects.push(e)
        } else {
            effect.destroy();
        }
    })

    return aliveEffects
}

function drawPlayer(player: Player, animState: null|number = null) {
    const { x, y, direction, hp } = player;
    const degrees = k.rad2deg(direction) - 90;
    const flipped = degrees < -90;

    if (!isDrawable(x, y)) return;

    k.drawSprite({
        sprite: player.sprite,
        pos: k.vec2(x, y),
        anchor: 'center',
    })

    if (player?.effect && player.effect === CONSTANTS.PLAYER_EFFECT_SHIELD) {
        const shieldX = x + 40 * Math.cos(direction - Math.PI / 2); 
        const shieldY = y + 40 * Math.sin(direction - Math.PI / 2);

        k.drawSprite({
            sprite: 'shield',
            pos: k.vec2(shieldX, shieldY),
            anchor: 'center',
            angle: degrees + 90
        })

    } else {
        k.drawSprite({
            sprite: 'gun',
            anchor: 'left',
            pos: flipped ? k.vec2(x - 15, y + 10) : k.vec2(x + 15, y + 10),
            angle: degrees,
            flipY: flipped,
        })
    }

    k.drawText({
        text: player.username,
        font: 'happy',
        size: 20,
        pos: k.vec2(x, y - 40),
        anchor: 'center'
    })

    k.drawText({
        text: `${Math.floor(hp)}/${PLAYER_MAX_HP}`,
        font: 'happy',
        size: 12,
        pos: k.vec2(x, y + 35),
        anchor: 'center'
    })
}

function drawHazard(hazard: SerializedHazard) {
    if (!isDrawable(hazard.x, hazard.y)) return;
    const scale = hazard.sprite === CONSTANTS.HAZARD_SHIELD_SPRITE ? 0.6 : 1;
    k.drawSprite({
        sprite: hazard.sprite,
        anchor: 'center',
        scale,
        pos: k.vec2(hazard.x, hazard.y)
    })
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

function drawBullet(bullet: Bullet | SerializedEntity) {
    if (!isDrawable(bullet.x, bullet.y)) return;
    k.drawCircle({
        radius: BULLET_RADIUS,
        color: k.MAGENTA,
        pos: k.vec2(bullet.x, bullet.y)
    })
}

/**
 * TODO: add offsets maybe so it stayas halfed on screen???
 * if offest, how to find size of sprite / 2?
 */
function isDrawable(x:number, y: number): boolean {
    const screenPos = k.toScreen(k.vec2(x,y));
    const xCheck = screenPos.x >= 0 && screenPos.x <= canvas.width; 
    const yCheck = screenPos.y >= 0 && screenPos.y <= canvas.height;

    return xCheck && yCheck
}

/**
 * BUG OUT on phones / through telegram webview, 
 * TODO: how to scale for different screens?
 * atm big screens see whole map, while phones see pointblank
 */
function setCanvasDimensions() {
    const scaleR = Math.max(1, 800 / window.innerWidth);
    canvas.width = scaleR * window.innerWidth;
    canvas.height = scaleR * window.innerHeight;
}

