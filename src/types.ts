import {WorkerWrapper} from './WorkerWrapper';

/**
 * Task executors must return objects of this type.
 * @typeParam T - The return type of the task, this is the type of the data that will be sent to the main thread.
 */
export interface TaskResult<T> {
    /**
     * The result of the task
     */
    result: T;
    /**
     * An array of buffers to transfer back to the main thread
     */
    transfer?: ArrayBuffer[];
}

/**
 * Object that describes a task to be executed in a worker part of a [[WorkerPool]]
 */
export interface WorkerTask {
    /**
     * The `id` of the task to execute, this is equivalent to a function name in a [[TaskExecutor]]
     */
    id: string;
    /**
     * An array of arguments for the task, these arguments will be passed to a function called from a [[TaskExecutor]]
     */
    args: any[];
    /**
     * Array of memory buffers to transfer to the worker in which the task will be executed.
     */
    transferable?: ArrayBuffer[];
    /**
     * Function to resolve a promise attached to this task.
     * @internal
     */
    resolve?: (r: any) => void;
    /**
     * Function to reject a promise attached to this task.
     * @internal
     */
    reject?: (e: Error | string) => void;
}

/**
 * Any object added to a [[WorkerInterface]] as a task executor must comply with a few rules:
 * - Must implement functions as top level properties.
 * - Functions that are to be used as tasks must return a [[TaskResult]]
 *
 * Each function exposed in the object as a top level property will be exposed as a task by a [[WorkerInterface]].
 *
 * A `TaskExecutor` can be an instance of a class or a plain object with functions as properties.
 */
export type TaskExecutor = any;

/**
 * Worker type in NodeJS
 */
export type NodeWorker = import('worker_threads').Worker;

/**
 * Worker type in browsers and deno
 */
export type WebWorker = Worker;

/**
 * Type for a raw worker on any supported platform
 */
export type PlatformWorker = WebWorker | NodeWorker;

/**
 * Type for a raw worker or a wrapped worker on any platform
 */
export type AnyWorker = PlatformWorker | WorkerWrapper;
