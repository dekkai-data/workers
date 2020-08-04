import {WorkerInterface} from '../../build/dist/mod.js';

class APIWorker {
    initialize() {
        return { result: true };
    }

    setID(id) {
        if (this.hasOwnProperty('id')) {
            throw `This worker already has an ID: ${this.id}`;
        }
        this.id = id;
        return { result: true };
    }

    async bounceNumber(val) {
        await new Promise(resolve => setTimeout(resolve));
        return { result: {
            number: val,
            id: this.id,
        }};
    }

    bounceTransfer(transfer, reference) {
        if (transfer.length !== reference.length) {
            throw 'The transferred object\'s length is not equal to the reference\'s length';
        }

        for (let i = 0, n = reference.length; i < n; ++i) {
            if (transfer[i] !== reference[i]) {
                throw `The value at index ${i} of the transferred object is not equal to the reference (${transfer[i]} != ${reference[i]}).`
            }
        }

        this.lastTransfer = transfer;

        return {
            result: transfer,
            transfer: [transfer.buffer],
        }
    }

    checkLastTransfer() {
        return { result: Boolean(this.lastTransfer.length === 0) };
    }
}

WorkerInterface.addTaskExecutor(new APIWorker());
