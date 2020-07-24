import {NodeWorker, WebWorker, PlatformWorker} from './types';
import {isNodeJS} from './isNodeJS';

export class WorkerWrapper {
    constructor(worker: PlatformWorker) {
        this._worker = worker;
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
