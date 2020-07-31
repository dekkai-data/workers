import {MessagePort} from 'worker_threads';
import {getModule, isNodeJS} from './envNodeJS';

// fix `self` type for compilation
declare const self: WorkerGlobalScope;

class WorkerSelf {
    private _ready: Promise<void> = this.initialize();
    public get ready(): Promise<void> {
        return this._ready;
    }

    private _self: WorkerGlobalScope | MessagePort;
    public get self(): WorkerGlobalScope | MessagePort {
        return this._self;
    }

    private async initialize(): Promise<void> {
        if (isNodeJS()) {
            const WorkerThreads = await getModule('worker_threads');
            this._self = WorkerThreads.parentPort;
        } else {
            this._self = self;
        }
    }

    public on(event: string, listener: (...args) => void): void {
        (
            (this._self as MessagePort).on ||
            (this._self as WorkerGlobalScope).addEventListener
        ).call(this._self, event, listener);
    }

    public off(event: string, listener: (...args) => void): void {
        (
            (this._self as MessagePort).off ||
            (this._self as WorkerGlobalScope).removeEventListener
        ).call(this._self, event, listener);
    }

    public addEventListener(event: string, listener: (...args) => void): void {
        (
            (this._self as MessagePort).on ||
            (this._self as WorkerGlobalScope).addEventListener
        ).call(this._self, event, listener);
    }

    public removeEventListener(event: string, listener: (...args) => void): void {
        (
            (this._self as MessagePort).off ||
            (this._self as WorkerGlobalScope).removeEventListener
        ).call(this._self, event, listener);
    }

    public postMessage(message: any, transferList?: ArrayBuffer[]): void {
        (this._self as MessagePort).postMessage(isNodeJS() ? { data: message } : message, transferList);
    }
}

const WorkerSelfInstance = new WorkerSelf();
export {WorkerSelfInstance as WorkerSelf};
