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

    public cancelPending(task: string | WorkerTask): void {
        let id;
        if (typeof task === 'string' || task instanceof String) {
            id = task;
        } else {
            id = task.id;
        }

        this.tasks = this.tasks.filter((t: WorkerTask): boolean => {
            if (t.id === id) {
                t.resolve(null);
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

    public addWorker(worker: AnyWorker, initTask?: WorkerTask): Promise<any> {
        const wrappedWorker = this.wrapWorker(worker);
        this.workers.push(wrappedWorker);

        if (initTask) {
            return new Promise((resolve, reject) => {
                const asyncTask = Object.assign({}, initTask, { resolve, reject });
                this.executeTask(wrappedWorker, asyncTask);
            });
        }

        this.executeTaskFromQueue(wrappedWorker);
        return Promise.resolve();
    }

    public addWorkers(workers: AnyWorker[], initTask?: WorkerTask): Promise<any[]> {
        const promises = [];
        for (let i = 0, n = workers.length; i < n; ++i) {
            promises.push(this.addWorker(workers[i], initTask));
        }
        return Promise.all(promises);
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

    public makeTask(id: string, args: any[] = [], transferable: ArrayBuffer[] = []): WorkerTask {
        return {
            id,
            args,
            transferable,
        };
    }

    public scheduleTask(task: WorkerTask): Promise<any> {
        return new Promise((resolve, reject) => {
            const asyncTask = Object.assign({}, task, { resolve, reject });
            if (this.idleWorkers.length) {
                this.executeTask(this.idleWorkers.pop(), asyncTask);
            } else {
                this.tasks.unshift(asyncTask);
            }
        });
    }

    public scheduleTasks(tasks: WorkerTask[]): Promise<any[]> {
        const promises = [];
        for (let i = 0, n = tasks.length; i < n; ++i) {
            promises.push(this.scheduleTask(tasks[i]));
        }
        return Promise.all(promises);
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

            if (message.state === 'success') {
                task.resolve(message.data);
            } else if (message.state === 'error') {
                task.reject(message.reason);
            } else {
                throw `ERROR: Unrecognized message state sent from data worker "${message.state}"`;
            }

            this.executeTaskFromQueue(worker);
        };
        worker.addEventListener('message', handler);

        const message = {
            task: task.id,
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
