import {AnyWorker, PlatformWorker} from './types';
import {WorkerTask} from './types';
import {WorkerWrapper} from './WorkerWrapper';

export class WorkerPool {
    static _sharedInstance = new WorkerPool();
    static get sharedInstance(): WorkerPool {
        return this._sharedInstance;
    }

    private workers: WorkerWrapper[];
    private idleWorkers: WorkerWrapper[];
    private tasks: WorkerTask[];

    constructor(workers: Worker[] = []) {
        this.workers = this.wrapWorkers(workers);
        this.idleWorkers = [...this.workers];
        this.tasks = [];
    }

    public get workerCount(): number {
        return this.workers.length;
    }

    public get running(): boolean {
        return Boolean(this.tasks.length || this.idleWorkers.length !== this.workers.length);
    }

    public cancelAllPending(): void {
        for (let i = 0, n = this.tasks.length; i < n; ++i) {
            this.tasks[i].resolve(null);
        }
        this.tasks.length = 0;
    }

    public cancelPendingOfType(type: string): void {
        this.tasks = this.tasks.filter((task: WorkerTask): boolean => {
            if (task.type === type) {
                task.resolve(null);
                return false;
            }
            return true;
        });
    }

    public killWorkers(): void {
        for (let i = 0, n = this.workers.length; i < n; ++i) {
            this.workers[i].terminate();
        }
        this.workers.length = 0;
        this.idleWorkers.length = 0;
    }

    public scheduleTask(type: string, args: any[] = [], transferable: ArrayBuffer[] = []): Promise<any> {
        return new Promise((resolve, reject) => {
            if (this.idleWorkers.length) {
                this.executeTask(this.idleWorkers.pop(), { type, args, transferable, resolve, reject });
            } else {
                this.tasks.unshift({
                    type,
                    args,
                    transferable,
                    resolve,
                    reject,
                });
            }
        });
    }

    public addWorker(worker: AnyWorker, initTask: WorkerTask | null = null): Promise<any> {
        const wrappedWorker = this.wrapWorker(worker);
        this.workers.push(wrappedWorker);

        if (initTask) {
            return new Promise((resolve, reject) => {
                this.executeTask(wrappedWorker, Object.assign({}, initTask, { resolve, reject }));
            });
        }

        this.executeTaskFromQueue(wrappedWorker);
        return Promise.resolve();
    }

    public removeWorker(): PlatformWorker | null {
        if (this.idleWorkers.length) {
            const worker = this.idleWorkers.pop();
            const i = this.workers.indexOf(worker);
            this.workers.splice(i, 1);
            return worker.worker;
        }
        return null;
    }

    private wrapWorker(worker: AnyWorker): WorkerWrapper {
        if (!(worker instanceof WorkerWrapper)) {
            return new WorkerWrapper(worker);
        }
        return worker;
    }

    private wrapWorkers(workers: AnyWorker[]): WorkerWrapper[] {
        const result = [];
        for (let i = 0, n = workers.length; i < n; ++i) {
            result.push(this.wrapWorker(workers[i]));
        }
        return result;
    }

    private executeTask(worker: WorkerWrapper, task: WorkerTask): void {
        const handler = (e): void => {
            const message = e.data;
            worker.removeEventListener('message', handler);

            if (message.type === 'success') {
                task.resolve(message.data);
            } else if (message.type === 'error') {
                task.reject(message.reason);
            } else {
                throw `ERROR: Unrecognized message type sent from data worker "${message.type}"`;
            }

            this.executeTaskFromQueue(worker);
        };
        worker.addEventListener('message', handler);

        const message = {
            type: task.type,
            args: task.args,
        };
        worker.postMessage(message, task.transferable);
    }

    private executeTaskFromQueue(worker: WorkerWrapper): void {
        if (this.tasks.length) {
            const task = this.tasks.pop();
            this.executeTask(worker, task);
        } else {
            this.idleWorkers.push(worker);
        }
    }
}
