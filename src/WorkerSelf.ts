import {MessagePort} from 'worker_threads';
import {isNodeJS} from './isNodeJS';

// fix `self` type for compilation
declare var self: WorkerGlobalScope;

// declare `__non_webpack_require__` for WebPack environments
declare var __non_webpack_require__: any;

let _self: WorkerGlobalScope | MessagePort | null = null;
if (isNodeJS()) {
    try {
        const WorkerThreads =
            typeof module !== 'undefined' && typeof module.require === 'function' && module.require('worker_threads') ||
            typeof __non_webpack_require__ === 'function' && __non_webpack_require__('worker_threads') ||
            typeof require === 'function' && require('worker_threads');
        _self = WorkerThreads.parentPort;
    } catch (e) {} // eslint-disable-line
} else {
    _self = self;
}

class WorkerSelfWrapper {
    constructor(self: WorkerGlobalScope | MessagePort) {
        this._self = self;
    }

    private _self: WorkerGlobalScope | MessagePort;
    public get self(): WorkerGlobalScope | MessagePort {
        return this._self;
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

export const WorkerSelf = new WorkerSelfWrapper(_self);
