import {WorkerWrapper} from './WorkerWrapper';

export interface TaskResult<T> {
    result: T;
    transfer?: ArrayBuffer[];
}

export interface WorkerTask {
    type: string;
    args: any[];
    transferable?: ArrayBuffer[];
    resolve?: Function;
    reject?: Function;
}

export type TaskExecutor = any;

export type NodeWorker = import('worker_threads').Worker;
export type WebWorker = Worker;
export type PlatformWorker = WebWorker | NodeWorker;
export type AnyWorker = PlatformWorker | WorkerWrapper;
