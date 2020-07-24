import {WorkerWrapper} from './WorkerWrapper';

export interface TaskResult<T> {
    result: T;
    transfer?: ArrayBuffer[];
}

export interface WorkerTask {
    id: string;
    args: any[];
    transferable?: ArrayBuffer[];
    resolve?: (r: any) => void;
    reject?: (e: Error | string) => void;
}

export type TaskExecutor = any;

export type NodeWorker = import('worker_threads').Worker;
export type WebWorker = Worker;
export type PlatformWorker = WebWorker | NodeWorker;
export type AnyWorker = PlatformWorker | WorkerWrapper;
