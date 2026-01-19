import { DatabaseSync } from "node:sqlite";
import { DbRunner } from "./db-runner.js";

const db = new DatabaseSync('./scores.db',);
let runner:DbRunner;

process.on('SIGINT', () => {
    if (db.isOpen) {
        console.log('Closing database connection')
        db.close()
    }
})

if (db) {
    try {
        db.exec(`create table if not exists scores (
            id integer primary key autoincrement,
            score integer not null,
            name text not null,
            date text not null
        )`)
        runner = new DbRunner(db)
    } catch (err) {
        console.error('Failed to start db', err);
    }
}


export function getRunner() {
    return runner
}