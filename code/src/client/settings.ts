const soundBtn = document.getElementById('sound-btn')!;
const soundStatus = document.getElementById('sound-status')!;

soundBtn.addEventListener('click', () => {
    const isOn = soundStatus.textContent === 'ON';
    soundStatus.textContent = isOn ? 'OFF' : 'ON';
});

export function getSoundState(): boolean {
    return soundStatus.textContent === 'ON';
}