import kaplay, { GameObj, PosComp } from 'kaplay';
import { getCurrentState } from './state';
import CONSTANTS from '../shared/constants';
import { debounce } from 'throttle-debounce';
import { getSoundState } from './settings';

let scale = 1;
let u_intensity = 8;

const canvas = document.getElementById('game') as HTMLCanvasElement;
const { PLAYER_MAX_HP, BULLET_RADIUS, MAP_SIZE } = CONSTANTS;

export const k = kaplay({ canvas, debugKey: 'f3' });

setScale();
window.addEventListener('resize', debounce(40, setScale))
k.onSceneLeave(() => setScale())

type RenderState = ReturnType<typeof getCurrentState>

k.scene('arena', () => {
    let effects:EffectEntry[] = [];
    let prevHP = 0;
    let prevScore = 0;

    k.add(createBackground())
    k.onUpdate(() => {
        const state = getCurrentState();
        const me = state.me;
        let shakeOnCD = false;
        
        k.usePostEffect('vhs', () => ({ "u_intensity": u_intensity }));

        if (me) {
            const viewWidth = canvas.width / scale;
            const viewHeight = canvas.height / scale;

            const y = me.y > MAP_SIZE / 2 
                ? Math.min(me.y, MAP_SIZE - viewHeight / 2)
                : Math.max(me.y, viewHeight / 2);
            
            const x = me.x > MAP_SIZE / 2 
                ? Math.min(me.x, MAP_SIZE - viewWidth / 2 )
                : Math.max(me.x, viewWidth / 2);
            
            if (!prevHP) prevHP = me.hp;
            if (!prevScore) prevScore = state.score;

            k.setCamScale(scale);
            k.setCamPos(x, y);
            
            if (prevHP > me.hp && !shakeOnCD){ 
                const color = k.Color.fromHex(CONSTANTS.CAMER_FLASH_COLOR)
                shakeOnCD = true;

                if (getSoundState()) {
                    k.play('hurt');
                }

                k.shake(7);
                k.flash(color, 0.05)
                setTimeout(() => shakeOnCD = false, 3000);
            }

            prevHP = me.hp;

            if ((state.score - prevScore) > CONSTANTS.SCORE_BULLET_HIT / 2) {
                if (getSoundState()) {
                    k.play('hit');
                }

                drawHitMark(me);
            }

            prevScore = state.score;

            effects = updateEffects(state, effects);
        }
    })

    k.onDraw(() => {
        const {me, others, bullets, hazards } = getCurrentState();

        if (me) {
            drawPlayer(me, true);
        }

        if (others) {
            for (const p of others) {
                drawPlayer(p, false)
            }
        }

        if (bullets) {
            for (const b of bullets) {
                drawBullet(b)
            }
        }

        if (hazards) {
            for (const h of hazards) {
                if (!h.onCooldown || h.sprite === CONSTANTS.HAZARD_WEB_SPRITE || h.sprite === CONSTANTS.HAZARD_FLAME_SPRITE) {
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
            ref,
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


function drawPlayer(player: Player, isMe: boolean) {
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
        size: 20 / scale,
        color: isMe ? k.GREEN : k.WHITE,
        pos: k.vec2(x, y - 40),
        anchor: 'center'
    })

    k.drawText({
        text: `${Math.floor(hp)}/${PLAYER_MAX_HP}`,
        font: 'happy',
        color: isMe ? k.GREEN : k.WHITE,
        size: 12 / scale,
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

function drawHitMark(me: Player) {
    const hitMark = k.add([
        k.pos(me.x, me.y),
        k.timer(),
        k.outline(1, k.WHITE, 0.8),
        k.color(k.YELLOW),
        k.text("HIT!", {
            font: 'happy',
            align: 'center',
            letterSpacing: 8,
             transform: (i, ch) => ({
                pos: k.vec2(0, k.wave(-8, 8, k.time() * 5 * i * 0.5)),
            })
        })
    ])

    hitMark.wait(1.5, () => hitMark.destroy())
}

/**
 * Scaling camera to fix mob devices disandvantage
 * big screen sees whole game > small sees 1 meter from nose
 * TODO:
 *  Корявая тема, особо не тестил, значение scale рандомне
 */
function setScale() {
    const w = window.innerWidth;
    if (w < 480) {          
        scale = 0.6;
        u_intensity = 12;
    } else if (w < 768) {   
        scale = 0.75;
        u_intensity = 10;
    } else if (w < 1024) {  
        scale = 0.9;
        u_intensity = 8;
    } else if (w < 1440) {
        u_intensity = 6; 
        scale = 1.0;
    } else if (w < 1920) {
        u_intensity = 4;  
        scale = 1.15;
    } else {                
        scale = 1.3;
        u_intensity = 4;
    }
}

