import { DatabaseSync, StatementSync } from "node:sqlite";
import { isMainThread, Worker, parentPort, workerData } from "node:worker_threads";


export class DbRunner {
    private db: DatabaseSync;
    private topScoresStmt: StatementSync;
    private writer = new Worker('./src/server/database/db-worker.ts');

    constructor(db: DatabaseSync) {
        this.db = db;
        this.topScoresStmt = this.getTopScoresStmt();

        this.writer.on('message', console.log)
        this.writer.on('error', console.log)
    }

    // private getInsertStmt(): StatementSync {
    //     return this.db.prepare(`
    //         INSERT INTO scores (score, name, date)
    //         VALUES (?, ?, datetime('now'))
    //     `)
    // }

    private getTopScoresStmt(): StatementSync {
        return this.db.prepare(`
            SELECT * FROM scores
            ORDER BY score DESC
            LIMIT 10;
        `)
    }

    public insertScore(score: number, name: string) {
        this.writer.postMessage({ score, name })
    }

    public getTopScores() {
        return this.topScoresStmt.all();
    }
    /**
     * REWRITE to db-runner-reader and db-runner-writer
     * 
     * db-runner-reader stays as is with only getTopScores funcionality
     * 
     * db-runner-writer creates worker
     *  if IS_MAIN - sends insertScore message down the persisten worker_thread;
     *  if WORKER - has message que, writes to SQLite in sync mode from queue
     * 
     */
}