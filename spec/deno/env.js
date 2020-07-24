import '../../node_modules/chai/chai.js';

function createWorker(file) {
    return new Worker(new URL(`../workers/${file}`, import.meta.url), { type: 'module' });
}

function workerOn(worker, evt, handler) {
    worker.addEventListener(evt, handler);
}

function workerOff(worker, evt, handler) {
    worker.removeEventListener(evt, handler);
}

function workerPost(worker, message, transfer = []) {
    if (transfer.length) {
        worker.postMessage(message, transfer);
    } else {
        worker.postMessage(message);
    }
}

export const env = {
    createWorker,
    workerOn,
    workerOff,
    workerPost,
    chai,
    performance,
};
