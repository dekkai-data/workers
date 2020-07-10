import {TaskResult, TaskExecutor} from './types';
import {WorkerSelf} from './WorkerSelf';

export class WorkerInterface {
    private constructor(executor?: TaskExecutor) {
        this.installEventHandlers();
        if (executor) {
            this.executorList.push(executor);
        }
    }

    private static _instance: WorkerInterface | null = null;
    public static get instance(): WorkerInterface {
        if (!this._instance) {
            this._instance = new WorkerInterface();
        }
        return this._instance;
    }
    private executorList: TaskExecutor[] = [];

    public addTaskExecutor(executor: TaskExecutor): void {
        if (this.executorList.indexOf(executor) === -1) {
            this.executorList.push(executor);
        }
    }

    public removeTaskExecutor(executor: TaskExecutor): void {
        const index = this.executorList.indexOf(executor);
        if (index !== -1) {
            this.executorList.splice(index, 1);
        }
    }

    private installEventHandlers(): void {
        WorkerSelf.on('message', this.handleMessage.bind(this));
    }

    private async handleMessage(e: MessageEvent): Promise<void> {
        const message = e.data;
        if (message.type) {
            for (let i = 0, n = this.executorList.length; i < n; ++i) {
                const taskExecutor = this.executorList[i];
                if (typeof taskExecutor[message.type] === 'function') {
                    try {
                        const taskResult: TaskResult<any> | void = await taskExecutor[message.type](...message.args);
                        if (taskResult) {
                            this.sendSuccess(taskResult.result, taskResult.transfer);
                        } else {
                            this.sendSuccess(taskResult);
                        }
                    } catch (err) {
                        this.sendError(err.toString());
                    }
                    return;
                }
            }
        }

        this.sendError(`Unrecognized task: ${message.type}`);
    }

    private sendError(reason: string): void {
        WorkerSelf.postMessage({
            type: 'error',
            reason,
        });
    }

    private sendSuccess(data: any | null = null, transferable?: ArrayBuffer[]): void {
        WorkerSelf.postMessage({
            type: 'success',
            data,
        }, transferable);
    }
}
