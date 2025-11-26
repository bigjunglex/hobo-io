import { updateDirection } from "./networking";

function onMouseInput(e: MouseEvent) {
    handleInput(e.clientX, e.clientY);
}

function onTouchInput(e: TouchEvent) {
    const touch = e.touches[0];
    handleInput(touch.clientX, touch.clientY);
}

function handleInput(x: number, y: number) {
    const dir = Math.atan2(
        x - window.innerWidth / 2,
        window.innerHeight / 2 - y
    )

    updateDirection(dir)
}

export function startCapturingInput() {
    window.addEventListener('mousemove', onMouseInput);
    window.addEventListener('touchmove', onTouchInput);
}

export function stopCapturingInput() {
    window.removeEventListener('mousemove', onMouseInput);
    window.removeEventListener('touchmove', onTouchInput);
}