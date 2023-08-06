/* global chai */

import chai from 'npm:chai@4.2.0';

function createWorker(file) {
    // eslint-disable-next-line
    return new Worker(new URL(`../workers/${file}`, import.meta.url), { type: 'module' });
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
    if (transfer.length) {
        worker.postMessage(message, transfer);
    } else {
        worker.postMessage(message);
    }
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
