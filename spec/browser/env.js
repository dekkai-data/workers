/* global chai */

function createWorker(file) {
    return new Worker(`/base/spec/workers/${file}`, { type: 'module' });
}

function isWorker(worker) {
    return worker instanceof Worker;
}

function workerOn(worker, evt, handler) {
    worker.addEventListener(evt, handler);
}

function workerOff(worker, evt, handler) {
    worker.removeEventListener(evt, handler);
}

function workerPost(worker, message, transfer = []) {
    worker.postMessage(message, transfer);
}

export const env = {
    createWorker,
    isWorker,
    workerOn,
    workerOff,
    workerPost,
    chai,
    performance,
};
