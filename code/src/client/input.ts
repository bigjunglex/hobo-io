import { updateDirection } from "./networking";
import { k } from "./render"
import { getCurrentState } from "./state";

function onMouseInput(e: MouseEvent) {
    handleInput(e.clientX, e.clientY);
}

function onTouchInput(e: TouchEvent) {
    const touch = e.touches[0];
    handleInput(touch.clientX, touch.clientY);
}

function handleInput(x: number, y: number) {
    const me = getCurrentState().me;
    if (me) {
        const mePos = k.vec2(me.x, me.y)
        const anchor = k.toScreen(mePos);
        const dir = Math.atan2(
            x - anchor.x,
            anchor.y - y
        )

        updateDirection(dir)
    }
}

export function startCapturingInput() {
    window.addEventListener('mousemove', onMouseInput);
    window.addEventListener('touchmove', onTouchInput);
}

export function stopCapturingInput() {
    window.removeEventListener('mousemove', onMouseInput);
    window.removeEventListener('touchmove', onTouchInput);
}