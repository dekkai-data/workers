import {WorkerInterface} from '../../dist/WorkerInterface.js';

class Executor01 {
    ping() {
        return { result: 'pong' };
    }
    'test-removeTaskExecutor01'() {
        WorkerInterface.instance.removeTaskExecutor(this);
        return { result: 'ready'};
    }
    repeat(...args) {
        return { result: args };
    }
    add(...args) {
        let result = 0;
        for (let i = 0, n = args.length; i < n; ++i) {
            result += args[i];
        }
        return { result };
    }
    receiveTransfer(transfer) {
        if (!(transfer instanceof Float32Array)) {
            throw 'Transfer must be of type Float32Array';
        }

        if (!transfer.length) {
            throw 'Transfer must contain at least one element';
        }

        this.transfer = transfer;
        return { result: 'received' };
    }
    sendTransfer() {
        return { result: this.transfer, transfer: [this.transfer.buffer] };
    }
    confirmTransfer() {
        if (this.transfer.length) {
            throw 'Object was copied rather than transferred';
        }
        return { result: 'transferred' };
    }
}
const executor01 = new Executor01();

class Executor02 {
    foo() {
        return { result: 'bar' };
    }
    'test-removeTaskExecutor02'() {
        WorkerInterface.instance.removeTaskExecutor(this);
        return { result: 'ready'};
    }
}
const executor02 = new Executor02();

async function main() {
    let _self;
    let node = false;

    try {
        const worker_threads = await import('worker_threads');
        _self = worker_threads.parentPort;
        node = true;
    } catch (e) {
        _self = self;
    }

    (_self.on || _self.addEventListener).call(_self, 'message', msg => {
        const task = msg.data.task;
        switch (task) {
            case 'test-addTaskExecutor01':
                WorkerInterface.instance.addTaskExecutor(executor01);
                _self.postMessage(node ? { data: 'ready'} : 'ready');
                break;

            case 'test-addTaskExecutor-all':
                WorkerInterface.instance.addTaskExecutor(executor01);
                WorkerInterface.instance.addTaskExecutor(executor02);
                _self.postMessage(node ? { data: 'ready'} : 'ready');
                break;

            default:
                break;
        }
    });
}

main();
