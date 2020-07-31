import {MessagePort} from 'worker_threads';
import {getModule, isNodeJS} from './envNodeJS';

/**
 * Declare `self` for browser environments.
 * @internal
 */
declare const self: WorkerGlobalScope;

/**
 * Wrapper for the [WorkerGlobalScope](https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope) in the
 * browser/deno and [MessagePort](https://nodejs.org/api/worker_threads.html#worker_threads_class_messageport) in NodeJS.
 *
 * This class is not meant to be used directly, instead, the `WorkerSelf` module exports a single instance of this class.
 * @private
 */
class WorkerSelf {
    /**
     * When this promise resolves, the WorkerSelfWrapper is ready to be used
     * @internal
     */
    private _ready: Promise<void> = this.initialize();
    /**
     * Returns a promise that, when resolved, indicates when the WorkerSelfWrapper is ready to be used.
     */
    public get ready(): Promise<void> {
        return this._ready;
    }

    /**
     * Underlying [WorkerGlobalScope](https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope) or
     * [MessagePort](https://nodejs.org/api/worker_threads.html#worker_threads_class_messageport) for the platform.
     * @internal
     */
    private _self: WorkerGlobalScope | MessagePort;
    /**
     * Returns the underlying [WorkerGlobalScope](https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope) or
     * [MessagePort](https://nodejs.org/api/worker_threads.html#worker_threads_class_messageport) for the platform.
     */
    public get self(): WorkerGlobalScope | MessagePort {
        return this._self;
    }

    /**
     * Initializes the underlying messaging system for the platform.
     */
    private async initialize(): Promise<void> {
        if (isNodeJS()) {
            const WorkerThreads = await getModule('worker_threads');
            this._self = WorkerThreads.parentPort;
        } else {
            this._self = self;
        }
    }

    /**
     * Minimum viable API to provide node's [`on` API](https://nodejs.org/api/events.html#events_emitter_on_eventname_listener)
     * for all platforms.
     * @param event - The event to subscribe to.
     * @param listener - Event handler function
     */
    public on(event: string, listener: (...args) => void): void {
        (
            (this._self as MessagePort).on ||
            (this._self as WorkerGlobalScope).addEventListener
        ).call(this._self, event, listener);
    }

    /**
     * Minimum viable API to provide node's [`off` API](https://nodejs.org/api/events.html#events_emitter_off_eventname_listener)
     * for all platforms.
     * @param event - The event to unsubscribe from
     * @param listener - Event handler function that was registered using either `on` or `addEventListener`
     */
    public off(event: string, listener: (...args) => void): void {
        (
            (this._self as MessagePort).off ||
            (this._self as WorkerGlobalScope).removeEventListener
        ).call(this._self, event, listener);
    }

    /**
     * Minimum viable API to provide the browser's [`addEventListener` API](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener)
     * for all platforms.
     * @param event - The event to subscribe to.
     * @param listener - Event handler function
     */
    public addEventListener(event: string, listener: (...args) => void): void {
        (
            (this._self as MessagePort).on ||
            (this._self as WorkerGlobalScope).addEventListener
        ).call(this._self, event, listener);
    }

    /**
     * Minimum viable API to provide the browser's [`removeEventListener` API](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/removeEventListener)
     * for all platforms.
     * @param event - The event to unsubscribe from
     * @param listener - Event handler function that was registered using either `on` or `addEventListener`
     */
    public removeEventListener(event: string, listener: (...args) => void): void {
        (
            (this._self as MessagePort).off ||
            (this._self as WorkerGlobalScope).removeEventListener
        ).call(this._self, event, listener);
    }

    /**
     * Posts a message to the code owner of this worker thread, this is meant to be homogeneous across platforms.
     * @param message - The message to send to the worker, can be anything that is supported by the
     * [structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm)
     * @param transferList - Objects to transfer to the worker, limited to `ArrayBuffer` objects as a minimum viable
     * API on all platforms.
     */
    public postMessage(message: any, transferList?: ArrayBuffer[]): void {
        (this._self as MessagePort).postMessage(isNodeJS() ? { data: message } : message, transferList);
    }
}

/**
 * [[WorkerSelf]] instance exported by the `WorkerSelf` module.
 * @internal
 */
const WorkerSelfInstance = new WorkerSelf();
export {WorkerSelfInstance as WorkerSelf};
