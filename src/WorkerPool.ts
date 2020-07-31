import {AnyWorker, PlatformWorker} from './types';
import {WorkerTask} from './types';
import {WorkerWrapper} from './WorkerWrapper';

/**
 * Class to manage multiple workers, send tasks to them and receive results.
 */
export class WorkerPool {
    /**
     * @param workers - Workers to be added to this pool immediately.
     */
    constructor(workers: Worker[] = []) {
        this.workers = this.wrapWorkers(workers);
        this.idleWorkers = [...this.workers];
        this.tasks = [];
    }

    /**
     * Class instance that can be used as a singleton.
     * @internal
     */
    static _sharedInstance = new WorkerPool();
    /**
     * Returns a  class instance that can be used as a singleton.
     */
    static get sharedInstance(): WorkerPool {
        return this._sharedInstance;
    }

    /**
     * A list of all the workers in this pool.
     */
    private workers: WorkerWrapper[];
    /**
     * List of the idle workers in this pool.
     */
    private idleWorkers: WorkerWrapper[];
    /**
     * List of queued tasks in this pool.
     */
    private tasks: WorkerTask[];

    /**
     * Returns the total number of workers held by this pool.
     */
    public get workerCount(): number {
        return this.workers.length;
    }

    /**
     * Returns whether or not there are tasks running in this pool.
     */
    public get running(): boolean {
        return Boolean(this.tasks.length || this.idleWorkers.length !== this.workers.length);
    }

    /**
     * Cancels all pending tasks in this pool.
     *
     * **WARNING:** Tasks that have already been sent to workers are *NOT* cancelled.
     */
    public cancelAllPending(): void {
        for (let i = 0, n = this.tasks.length; i < n; ++i) {
            this.tasks[i].resolve(null);
        }
        this.tasks.length = 0;
    }

    /**
     * Cancels pending tasks of the specified type.
     *
     * **WARNING:** Tasks that have already been sent to workers are *NOT* cancelled.
     * @param task - The task id (name) or a task instance to be cancelled.
     */
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

    /**
     * Immediately kills all the workers in this pool.
     *
     * **WARNING:** Pending and running tasks will not resolve their promises when this method is called.
     */
    public killWorkers(): void {
        for (let i = 0, n = this.workers.length; i < n; ++i) {
            this.workers[i].terminate();
        }
        this.workers.length = 0;
        this.idleWorkers.length = 0;
    }

    /**
     * Adds the specified worker to this pool and, optionally, runs an init task.
     * @param worker - The worker to add
     * @param initTask - Init task to be executed immediately on the worker
     */
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

    /**
     * Adds an array of workers to this pool and, optionally, runs an init task on them.
     * @param workers - A list of workers to add
     * @param initTask - Init task to be executed immediately on each of the workers added
     */
    public addWorkers(workers: AnyWorker[], initTask?: WorkerTask): Promise<any[]> {
        const promises = [];
        for (let i = 0, n = workers.length; i < n; ++i) {
            promises.push(this.addWorker(workers[i], initTask));
        }
        return Promise.all(promises);
    }

    /**
     * Removes a single worker from the pool, there are no guarantees as to which worker will be removed.
     */
    public removeWorker(): PlatformWorker | null {
        if (this.idleWorkers.length) {
            const worker = this.idleWorkers.pop();
            const i = this.workers.indexOf(worker);
            this.workers.splice(i, 1);
            return worker.worker;
        }
        return null;
    }

    /**
     * Makes a [[WorkerTask]] to be executed by any of the workers in this pool.
     * @param id - The task id (name) to execute
     * @param args - Any arguments that need to be passed to the task as described in the [[TaskExecutor]]
     * @param transferable - List of objects that will be transferred to the worker. **NOTE:** Transferred objects are
     * invalidated after the task is sent and cannot be used anymore.
     */
    public makeTask(id: string, args: any[] = [], transferable: ArrayBuffer[] = []): WorkerTask {
        return {
            id,
            args,
            transferable,
        };
    }

    /**
     * Schedules a task to be executed in a worker as soon as one is available. There are no guarantees as of which
     * worker will perform the task.
     * @param task - Task to schedule
     */
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

    /**
     * Schedules an array of tasks to be executed in workers as soon as they become available. There are no guarantees
     * as of which workers will perform the tasks.
     * @param tasks - List of tasks to execute
     */
    public scheduleTasks(tasks: WorkerTask[]): Promise<any[]> {
        const promises = [];
        for (let i = 0, n = tasks.length; i < n; ++i) {
            promises.push(this.scheduleTask(tasks[i]));
        }
        return Promise.all(promises);
    }

    /**
     * Wraps a worker in a [[WorkerWrapper]] instance, if the worker is already wrapped, this function simply returns
     * the already wrapped worker.
     * @param worker - Worker to wrap
     */
    private wrapWorker(worker: AnyWorker): WorkerWrapper {
        if (!(worker instanceof WorkerWrapper)) {
            return new WorkerWrapper(worker);
        }
        return worker;
    }

    /**
     * Wraps multiple workers in [[WorkerWrapper]] instances, worker that are already wrapped are returned as-is.
     * @param workers - List of workers to wrap
     */
    private wrapWorkers(workers: AnyWorker[]): WorkerWrapper[] {
        const result = [];
        for (let i = 0, n = workers.length; i < n; ++i) {
            result.push(this.wrapWorker(workers[i]));
        }
        return result;
    }

    /**
     * Executes the specified task in the worker provided and listens for a response. If a success message is received
     * from the worker, the task promise is resolved with the results, the promise is rejected with an explanation
     * otherwise.
     * @param worker - Worker which will run the task
     * @param task - Task to execute
     */
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

    /**
     * Checks if there are pending tasks in the queue, if so, the next task is executed in the worker provided. If no
     * tasks are pending, the worker is flagged as idle.
     * @param worker - Worker that will execute a task or be marked as idle.
     */
    private executeTaskFromQueue(worker: WorkerWrapper): void {
        if (this.tasks.length) {
            const task = this.tasks.pop();
            this.executeTask(worker, task);
        } else {
            this.idleWorkers.push(worker);
        }
    }
}
