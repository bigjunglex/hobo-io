import { DatabaseSync } from "node:sqlite";
import { parentPort, isMainThread } from "node:worker_threads";

type insertMessage = { score: number; name: string};

(function main() {
    if (isMainThread) return;
    const conn = new DatabaseSync('./scores.db');
    const insertStmt = conn.prepare(`
        INSERT INTO scores (score, name, date)
        VALUES (?, ?, datetime('now'))
    `);

    parentPort!.on('message', (val: insertMessage) => {
        const { score, name } = val;
        insertStmt.run(score, name);
        parentPort!.postMessage('done');
    }) 

})()

