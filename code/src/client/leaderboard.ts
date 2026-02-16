import { getUsernameById } from "./state";

const leaderboard = document.getElementById('leaderboard')!;
const rows = document.querySelectorAll('#leaderboard table tr');
const count = document.getElementById('player-count')!;
const score = document.getElementById('my-score')!;
const allTimeRows = document.querySelectorAll('#topscores tr');


export function updateLeaderboard(leaderboard: Score[]):void {
    try {
        for (let i = 0; i < leaderboard.length; i++) {
            console.assert(leaderboard[i], 'undefined leaderboard: %s', leaderboard);
            const username = getUsernameById(leaderboard[i].id).slice(0, 15)
            const name = `<td>${escapeHtml(username) || 'Anonymous'}</td>`
            const score = `<td>${leaderboard[i].score }</td>`
            rows[i + 1].innerHTML = `${name}${score}` 
        }
    } catch (e) {}
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export function setLeaderboardHidden(hidden:boolean):void{
    if (hidden) {
        leaderboard.classList.add('hidden')
    } else {
        leaderboard.classList.remove('hidden')
    }
}


export function updatePlayerCount(c: number) {
    count.textContent = '' + c;
}

export function updateMyScore(s:number) {
    score.textContent = '' + s;
}

export function topScores(data: ScoreData[]) {
    for (let i = 0; i < allTimeRows.length; i++) {
        const name = `<td>${escapeHtml(data[i].name.slice(0, 15))}</td>`
        const score = `<td>${data[i].score.toFixed(0)}</td>`
        const time = `<td>${data[i].date.split(' ')[0]}</td>`
        allTimeRows[i].innerHTML = `${name}${score}${time}`
    }
}