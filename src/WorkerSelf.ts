import {MessagePort} from 'worker_threads';
import {isNodeJS} from './isNodeJS';

// fix `self` type for compilation
declare const self: WorkerGlobalScope;

// declare `__non_webpack_require__` for WebPack environments
// eslint-disable-next-line camelcase
declare const __non_webpack_require__: any;

function checkDynamicImport(): boolean {
    try {
        import(`${null}`).catch(() => false);
        return true;
    } catch {
        return false;
    }
}

class WorkerSelfWrapper {
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
            try {
                const dynamicImportsAvailable = checkDynamicImport();

                let WorkerThreads;

                if (dynamicImportsAvailable) {
                    const libName = 'worker_threads';
                    WorkerThreads = await import(libName);
                } else {
                    WorkerThreads =
                        typeof module !== 'undefined' && typeof module.require === 'function' && module.require('worker_threads') ||
                        // eslint-disable-next-line camelcase
                        typeof __non_webpack_require__ === 'function' && __non_webpack_require__('worker_threads') ||
                        typeof require === 'function' && require('worker_threads'); // eslint-disable-line
                }
                this._self = WorkerThreads.parentPort;
            } catch (e) {} // eslint-disable-line
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

const WorkerSelf = new WorkerSelfWrapper();
export {WorkerSelf};
