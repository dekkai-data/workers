import {NodeWorker, WebWorker, PlatformWorker} from './types';
import {isNodeJS, getModule} from './envNodeJS';

/**
 * A promise that returns the Worker class for the platform.
 * @internal
 */
const kWorkerPromise: Promise<any> = isNodeJS() ? getModule('worker_threads').then(mod => mod.Worker) : Promise.resolve(Worker);

/**
 * This promise returns the `path` module in NodeJS and `null` otherwise
 * @internal
 */
const kPathPromise: Promise<any> = isNodeJS() ? getModule('path') : Promise.resolve(null);

/**
 * Wraps a worker instance on supported platforms and exposes a shared minimum viable API, while providing access to
 * the original instance for advanced, platform specific functionality.
 */
export class WorkerWrapper {
    /**
     * @param worker - The worker instance to wrap
     */
    constructor(worker: PlatformWorker) {
        this._worker = worker;
    }

    /**
     * Utility function to create a Worker instance and wrap it.
     * Supports browsers, NodeJS and deno.
     * @param src - A string containing the path to the worker source. Can be an absolute or relative path.
     * @param options - Options to use when creating the worker.
     */
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

    /**
     * Holds the underlying worker instance for the platform.
     * @internal
     */
    private _worker: PlatformWorker;
    /**
     * Returns the underlying worker instance, can be used to access the full Worker API on the running platform.
     */
    public get worker(): PlatformWorker {
        return this._worker;
    }

    /**
     * Posts a message to the worker code, this is meant to be homogeneous across platforms.
     * @param message - The message to send to the worker, can be anything that is supported by the
     * [structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm)
     * @param transferable - Objects to transfer to the worker, limited to `ArrayBuffer` objects as a minimum viable
     * API on all platforms.
     */
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    public postMessage(message: any, transferable?: ArrayBuffer[]): void {
        this._worker.postMessage(isNodeJS() ? { data: message } : message, transferable);
    }

    /**
     * Minimum viable API to provide node's [`on` API](https://nodejs.org/api/events.html#events_emitter_on_eventname_listener)
     * for all platforms.
     * @param event - The event to subscribe to.
     * @param listener - Event handler function
     */
    public on(event: string, listener: (...args) => void): void {
        (
            (this._worker as NodeWorker).on ||
            (this._worker as WebWorker).addEventListener
        ).call(this._worker, event, listener);
    }

    /**
     * Minimum viable API to provide node's [`off` API](https://nodejs.org/api/events.html#events_emitter_off_eventname_listener)
     * for all platforms.
     * @param event - The event to unsubscribe from
     * @param listener - Event handler function that was registered using either `on` or `addEventListener`
     */
    public off(event: string, listener: (...args) => void): void {
        (
            (this._worker as NodeWorker).off ||
            (this._worker as WebWorker).removeEventListener
        ).call(this._worker, event, listener);
    }

    /**
     * Minimum viable API to provide the browser's [`addEventListener` API](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener)
     * for all platforms.
     * @param event - The event to subscribe to.
     * @param listener - Event handler function
     */
    public addEventListener(event: string, listener: (...args) => void): void {
        (
            (this._worker as NodeWorker).on ||
            (this._worker as WebWorker).addEventListener
        ).call(this._worker, event, listener);
    }

    /**
     * Minimum viable API to provide the browser's [`removeEventListener` API](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/removeEventListener)
     * for all platforms.
     * @param event - The event to unsubscribe from
     * @param listener - Event handler function that was registered using either `on` or `addEventListener`
     */
    public removeEventListener(event: string, listener: (...args) => void): void {
        (
            (this._worker as NodeWorker).off ||
            (this._worker as WebWorker).removeEventListener
        ).call(this._worker, event, listener);
    }

    /**
     * Terminates the underlying worker instance and invalidates the handle to it. This WorkerWrapper instance will become
     * unusable after calling this method.
     */
    public terminate(): void {
        this._worker.terminate();
        this._worker = null;
    }
}
