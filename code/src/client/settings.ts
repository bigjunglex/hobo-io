import { setChatHidden } from "./chat";

const soundBtn = document.getElementById('sound-btn')!;
const soundStatus = document.getElementById('sound-status')!;

const chatBtn = document.getElementById('chat-btn')!;
const chatStatus = document.getElementById('chat-status')!;

soundBtn.addEventListener('click', () => {
    const isOn = soundStatus.textContent === 'ON';
    soundStatus.textContent = isOn ? 'OFF' : 'ON';
});

export function getSoundState(): boolean {
    return soundStatus.textContent === 'ON';
}

chatBtn.addEventListener('click', () => {
    const isOn = chatStatus.textContent === 'ON';
    chatStatus.textContent = isOn ? 'OFF' : 'ON';

    setChatHidden(isOn)
})