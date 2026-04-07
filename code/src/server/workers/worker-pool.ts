import os from "os";
import { Worker } from "worker_threads";


/**
 * worker pool for AOI batching and
 */
export class AOIWorkerPool {
    private workers: Worker[] = [];
    private resolve: AoiWorkerResolve;

    constructor( file: string, resolve: AoiWorkerResolve, size = os.cpus().length - 1 ) {
        this.workers = [];
        this.resolve = resolve;

        for (let i = 0; i < size; i++) {
            const w = new Worker(file);
            w.on('message', (data: AoiWorkerReturn) => this.resolve(data));
            w.on('error', (e) => console.error(e));
            w.on('exit', (code) => console.log('Worker exit with %d code', code));
            this.workers.push(w);
        }
    };

    private batchUpdates(ids: number[]) {
        const wLen = this.workers.length
        const batches: number[][] = [];

        for (let i = 0; i < wLen; i++) {
            batches.push([])
        }

        ids.forEach((id, index) => {
            const workerIndex = index % wLen;
            batches[workerIndex].push(id);
        });
        
        return batches
    }

    public createUpdates(ids: number[], buf: Uint8Array<ArrayBufferLike>) {
        const batches = this.batchUpdates(ids);
        const w = this.workers;
        const sharedIn = new SharedArrayBuffer(buf.byteLength);
        const sharedOut = new SharedArrayBuffer(buf.byteLength);
        const view = new Uint8Array(sharedIn);
        view.set(buf);

        for (let i = 0; i < w.length; i++) {
            w[i].postMessage({ ids: batches[i], bufIn: sharedIn, bufOut: sharedOut } as AoiWorkerData)
        }
    }

}