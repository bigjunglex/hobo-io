import { DatabaseSync, StatementSync } from "node:sqlite";

export class DbRunner {
    private db: DatabaseSync;
    private scoreInsertStmt: StatementSync;
    private topScoresStmt: StatementSync;

    constructor(db: DatabaseSync) {
        this.db = db;
        this.scoreInsertStmt = this.getInsertStmt();
        this.topScoresStmt = this.getTopScoresStmt();
    }

    private getInsertStmt(): StatementSync {
        return this.db.prepare(`
            INSERT INTO scores (score, name, date)
            VALUES (?, ?, datetime('now'))
        `)
    }

    private getTopScoresStmt(): StatementSync {
        return this.db.prepare(`
            SELECT * FROM scores
            ORDER BY score DESC
            LIMIT 10;
        `)
    }

    public insertScore(score: number, name: string) {
        this.scoreInsertStmt.run(score, name);
    }

    public getTopScores() {
        return this.topScoresStmt.all();
    }

}