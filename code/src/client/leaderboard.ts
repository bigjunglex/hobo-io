const leaderboard = document.getElementById('leaderboard')!;
const rows = document.querySelectorAll('#leaderboard table tr');
const count = document.getElementById('player-count')!;
const score = document.getElementById('my-score')!;


export function updateLeaderboard(leaderboard: Score[]):void {
    for (let i = 0; i < leaderboard.length; i++) {
        const name = `<td>${escapeHtml(leaderboard[i].username.slice(0, 15)) || 'Anonymous'}</td>`
        const score = `<td>${leaderboard[i].score }</td>`
        rows[i +1].innerHTML = `${name}${score}` 
    }
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