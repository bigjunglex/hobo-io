import os from "os";
import { Worker } from "worker_threads";
import { writeGlobalState } from "../../shared/messages.js";


/**
 * worker pool for AOI batching and
 */
export class AOIWorkerPool {
    private workers: Worker[] = [];
    private resolve: AoiWorkerResolve;
    private stateBuf: SharedArrayBuffer;
    public packetsBuf: SharedArrayBuffer;
    private wReady: number;

    constructor( file: string, resolve: AoiWorkerResolve, size: number ) {
        this.workers = [];
        this.resolve = resolve;
        this.stateBuf = new SharedArrayBuffer(1024 * 1024 * 64);
        this.packetsBuf = new SharedArrayBuffer(1024 * 1024 * 64);
        this.wReady = 0;

        for (let i = 0; i < size; i++) {
            const w = new Worker(file, {
                workerData: [
                    this.stateBuf,
                    this.packetsBuf,
                    i * 1024 * 1024 * 22
                ] 
            });
            w.on('message', () => this.resolveWorkers());
            w.on('error', (e) => console.error(e));
            w.on('exit', (code) => console.log('Worker exit with %d code', code));
            this.workers.push(w);
        }
    }
    
    private batchUpdates(ids: string[]): number[][] {
        const wLen = this.workers.length
        const batches: number[][] = [];

        for (let i = 0; i < wLen; i++) {
            batches.push([])
        }

        ids.forEach((id, index) => {
            const workerIndex = index % wLen;
            batches[workerIndex].push(+id);
        });
        
        return batches
    }

    public createUpdates(ids: string[]): void {
        const batches = this.batchUpdates(ids);
        this.workers.forEach((w, i) => w.postMessage({ ids: batches[i] }));
    }

    public updateStateBuf(state: GlobalState & { c: number }): void {
        writeGlobalState(state, this.stateBuf);
    }

    private resolveWorkers(): void {
        this.wReady++;
        if (this.wReady === this.workers.length) {
            this.resolve(this.packetsBuf)
            this.wReady = 0;
        }
    }
}