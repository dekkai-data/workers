import {NodeWorker, WebWorker, PlatformWorker} from './types';
import {isNodeJS, getModule} from './envNodeJS';

const kWorkerPromise: Promise<any> = isNodeJS() ? getModule('worker_threads').then(mod => mod.Worker) : Promise.resolve(Worker);
const kPathPromise: Promise<any> = isNodeJS() ? getModule('path') : Promise.resolve(null);

export class WorkerWrapper {
    constructor(worker: PlatformWorker) {
        this._worker = worker;
    }

    static async createWorker(src: string, options: WorkerOptions): Promise<WorkerWrapper> {
        const args = [];
        const argsOptions = Object.assign({}, options);
        if (isNodeJS() && typeof __dirname !== 'undefined') {
            const path = await kPathPromise;
            args.push(path.resolve(__dirname, src));
        } else if (typeof import.meta !== 'undefined') {
            args.push(new URL(src, import.meta.url));
            // check for deno
            if (typeof (import.meta as any).main !== 'undefined') {
                // Error: Not yet implemented: only "module" type workers are supported
                if (!argsOptions.hasOwnProperty('type') || argsOptions.type !== 'module') {
                    argsOptions.type = 'module';
                }
            }
        } else {
            args.push(src);
        }
        args.push(argsOptions);

        const worker = new (await kWorkerPromise)(...args);
        return new WorkerWrapper(worker);
    }

    private _worker: PlatformWorker;
    public get worker(): PlatformWorker {
        return this._worker;
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    public postMessage(message: any, transferable?: ArrayBuffer[]): void {
        this._worker.postMessage(isNodeJS() ? { data: message } : message, transferable);
    }

    public on(event: string, listener: (...args) => void): void {
        (
            (this._worker as NodeWorker).on ||
            (this._worker as WebWorker).addEventListener
        ).call(this._worker, event, listener);
    }

    public off(event: string, listener: (...args) => void): void {
        (
            (this._worker as NodeWorker).off ||
            (this._worker as WebWorker).removeEventListener
        ).call(this._worker, event, listener);
    }

    public addEventListener(event: string, listener: (...args) => void): void {
        (
            (this._worker as NodeWorker).on ||
            (this._worker as WebWorker).addEventListener
        ).call(this._worker, event, listener);
    }

    public removeEventListener(event: string, listener: (...args) => void): void {
        (
            (this._worker as NodeWorker).off ||
            (this._worker as WebWorker).removeEventListener
        ).call(this._worker, event, listener);
    }

    public terminate(): void {
        this._worker.terminate();
        this._worker = null;
    }
}
