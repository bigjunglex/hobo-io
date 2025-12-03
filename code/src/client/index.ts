import './css/styles.css';
import { startCapturingInput, stopCapturingInput } from './input';
import { setLeaderboardHidden } from './leaderboard';
import { connect, play } from './networking';
import { startRendering, stopRendering } from './render';
import { loadAssets } from './assets';
import { initState } from './state';


const playMenu = document.getElementById('play-menu')!;
const playButton = document.getElementById('play-button')!;
const usernameInput = document.getElementById('username-input')! as HTMLInputElement;

stopRendering();

Promise.all([
    connect(onGameOver),
    loadAssets(),
]).then(() => {
    playMenu.classList.remove('hidden');
    usernameInput.focus();
    playButton.onclick = () => {
        const spriteSelect = document.querySelector('input[type="radio"]:checked') as HTMLInputElement;
        play(usernameInput.value, spriteSelect.value);
        playMenu.classList.add('hidden');
        initState();
        startCapturingInput();
        setLeaderboardHidden(false);
        startRendering();
    }
})

function onGameOver():void {
    stopCapturingInput();
    stopRendering();
    playMenu.classList.remove('hidden');
    setLeaderboardHidden(true);
}