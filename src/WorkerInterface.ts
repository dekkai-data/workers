import {TaskResult, TaskExecutor} from './types';
import {WorkerSelf} from './WorkerSelf';

/**
 * Interface meant to be used within a Worker to handle messages through the use of objects that comply with the rules
 * set by [[TaskExecutor]]. Messages are ony handled if at least one [[TaskExecutor]] has been added.
 *
 * This class is not meant to be used directly, instead, the `WorkerInterface` module exports a single instance of this class.
 * @private
 */
class WorkerInterface {
    /**
     * List of objects to be used as [[TaskExecutor]]s
     */
    private executorList: TaskExecutor[] = [];
    /**
     * Holds a bound to `this` instance of the the `handleMessage` method.
     * @internal
     */
    private boundHandleMessage: (e: MessageEvent) => Promise<void> = this.handleMessage.bind(this);

    /**
     * Adds a [[TaskExecutor]] instance to this `WorkerInterface`. If this is the first [[TaskExecutor]], the interface
     * will start handling messages from the worker's owner and throwing errors for unrecognized tasks.
     * @param executor - Object to add.
     */
    public addTaskExecutor(executor: TaskExecutor): void {
        if (this.executorList.indexOf(executor) === -1) {
            if (!this.executorList.length) {
                this.installEventHandlers();
            }
            this.executorList.push(executor);
        }
    }

    /**
     * Removes a [TaskExecutor]] from this `WorkerInterface`. If, after removing the specified object, there are no more
     * executors left, the interface will stop handling messages from the worker's owner.
     * @param executor - The object to remove.
     */
    public removeTaskExecutor(executor: TaskExecutor): void {
        const index = this.executorList.indexOf(executor);
        if (index !== -1) {
            this.executorList.splice(index, 1);
            if (!this.executorList.length) {
                this.uninstallEventHandlers();
            }
        }
    }

    /**
     * Registers this instance to listen for `message` events from the worker's owner.
     */
    private async installEventHandlers(): Promise<void> {
        await WorkerSelf.ready;
        WorkerSelf.on('message', this.boundHandleMessage);
    }

    /**
     * Unregisters this instance from listening for `message` events from the worker's owner.
     */
    private uninstallEventHandlers(): void {
        WorkerSelf.off('message', this.boundHandleMessage);
    }

    /**
     * Handles messages from the worker's owner, once a message is received, it looks for a task and a matching
     * [[TaskExecutor]] for it. If an executor for a task is found and the task succeeds, the result of the task is sent
     * back as a message to the worker's owner, an error message with an explanation is sent otherwise.
     * @param e - Event from the worker's owner.
     */
    private async handleMessage(e: MessageEvent): Promise<void> {
        const message = e.data;
        if (message.task) {
            for (let i = 0, n = this.executorList.length; i < n; ++i) {
                const taskExecutor = this.executorList[i];
                if (typeof taskExecutor[message.task] === 'function') {
                    try {
                        const taskResult: TaskResult<any> | void = await taskExecutor[message.task](...message.args);
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

        this.sendError(`Unrecognized task: ${message.task}`);
    }

    /**
     * Utility function to send an error message back to the worker's owner.
     * @param reason - The reason for the error.
     */
    private sendError(reason: string): void {
        WorkerSelf.postMessage({
            state: 'error',
            reason,
        });
    }

    /**
     * Utility function to send a success message back to the worker's owner.
     * @param data - An object that will be sent with the message.
     * @param transferable - Transferable objects, if any.
     */
    private sendSuccess(data: any | null = null, transferable?: ArrayBuffer[]): void {
        WorkerSelf.postMessage({
            state: 'success',
            data,
        }, transferable);
    }
}

/**
 * [[WorkerInterface]] instance exported by the `WorkerInterface` module.
 * @internal
 */
const WorkerInterfaceInstance = new WorkerInterface();
export {WorkerInterfaceInstance as WorkerInterface};
