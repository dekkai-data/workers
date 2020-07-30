import {WorkerWrapper} from '../../dist/WorkerWrapper.js';
import {WorkerPool} from '../../dist/WorkerPool.js';

function run(env) {
    const {
        chai,
        performance,
    } = env;

    const createWorker = () => env.createWorker('pool.worker.js');

    describe('WorkerPool', function() {
        let pool;

        it('can be constructed with an array of workers', function() {
            const workers = [
                createWorker(),
                createWorker(),
            ];

            pool = new WorkerPool(workers);
        });

        it('returns its worker count through the `workerCount` property', function() {
            chai.expect(pool.workerCount).to.equal(2);
        });

        it('can add new worker one by one', function() {
            pool.addWorker(createWorker());
            pool.addWorker(createWorker());

            chai.expect(pool.workerCount).to.equal(4);
        });

        it('can add multiple workers at once', function() {
            const workers = [
                createWorker(),
                createWorker(),
            ];
            pool.addWorkers(workers);

            chai.expect(pool.workerCount).to.equal(6);
        });

        it('wraps its workers', function() {
            chai.expect(pool.workers[pool.workers.length - 1] instanceof WorkerWrapper).to.equal(true);
        });

        it('schedules a task without arguments', async function() {
            const task = pool.makeTask('simpleTask');
            const result = await pool.scheduleTask(task);
            chai.expect(result).to.equal(true);
        });

        it('schedules a task with arguments', async function() {
            const a = 9;
            const b = 23;
            const task = pool.makeTask('addNumbers', [a, b]);
            const result = await pool.scheduleTask(task);
            chai.expect(result).to.equal(a + b);
        });

        it('can schedule an init task when adding a worker', async function() {
            const a = 6;
            const b = 67;
            const task = pool.makeTask('addNumbers', [a, b]);
            const result = await pool.addWorker(createWorker(), task);
            chai.expect(result).to.equal(a + b);
        });

        it('handles objects marked for transfer in tasks', async function() {
            const numbers = [34, 56, 67];
            const transfer = new Uint32Array(numbers);
            chai.expect(transfer.length).to.equal(numbers.length);

            const task = pool.makeTask('numberTransfer', [transfer], [transfer.buffer]);
            const result = await pool.scheduleTask(task);
            chai.expect(transfer.length).to.equal(0);
            chai.expect(result).to.eql(numbers);
        });

        it('schedules an array of tasks', async function() {
            const a = 91;
            const b = 34;
            const tasks = [];
            const workerCount = pool.workerCount;
            for (let i = 0; i < workerCount; ++i) {
                tasks.push(pool.makeTask('addNumbers', [a, b]));
            }

            const results = await pool.scheduleTasks(tasks);
            for (let i = 0; i < workerCount; ++i) {
                chai.expect(results[i]).to.equal(a + b);
            }
        });

        it('schedules tasks in multiple workers simultaneously', async function() {
            const wait = 10;
            const task = pool.makeTask('waitAndPing', [wait]);
            const workerCount = pool.workerCount;

            const promises = [];
            for (let i = 0; i < workerCount; ++i) {
                promises.push(pool.scheduleTask(task));
            }

            const start = performance.now();
            const results = await Promise.all(promises);
            const end = performance.now();

            chai.expect(results.length).to.equal(workerCount);
            for (let i = 0; i < workerCount; ++i) {
                chai.expect(results[i]).to.equal('pong');
            }

            const time = end - start;
            chai.expect(time).to.be.below(wait * 2);
        });

        it('correctly reports if tasks are running', async function() {
            const wait = 10;
            const task = pool.makeTask('waitAndPing', [wait]);

            chai.expect(pool.running).to.equal(false);

            const promise = pool.scheduleTask(task);

            chai.expect(pool.running).to.equal(true);

            await promise;

            chai.expect(pool.running).to.equal(false);
        });

        it('cancels all pending tasks', async function() {
            const wait = 10;
            const task = pool.makeTask('waitAndPing', [wait]);
            const workerCount = pool.workerCount;

            const promisesToFullfill = [];
            const promisesToCancel = [];

            for (let i = 0; i < workerCount; ++i) {
                promisesToFullfill.push(pool.scheduleTask(task));
            }

            for (let i = 0; i < workerCount; ++i) {
                promisesToCancel.push(pool.scheduleTask(task));
            }

            pool.cancelAllPending();

            const fullfilled = await Promise.all(promisesToFullfill);
            const cancelled = await Promise.all(promisesToCancel);

            for (let i = 0; i < workerCount; ++i) {
                chai.expect(fullfilled[i]).to.equal('pong');
                chai.expect(cancelled[i]).to.equal(null);
            }
        });

        it('cancels pending tasks with a specific id', async function() {
            const wait = 10;
            const task = pool.makeTask('waitAndPing', [wait]);
            const taskToCancel = pool.makeTask('simpleTask');
            const taskToCancelByString = pool.makeTask('addNumbers', [3, 4]);
            const workerCount = pool.workerCount;

            const promises = [];
            for (let i = 0; i < workerCount; ++i) {
                promises.push(pool.scheduleTask(task));
            }

            const toCancel = pool.scheduleTask(taskToCancel);
            const toCancelByString = pool.scheduleTask(taskToCancelByString);

            for (let i = 0; i < workerCount; ++i) {
                promises.push(pool.scheduleTask(task));
            }

            pool.cancelPending(taskToCancel);
            pool.cancelPending('addNumbers');

            const results = await Promise.all(promises);
            const cancelled = await toCancel;
            const cancelledByString = await toCancelByString;

            chai.expect(cancelled).to.equal(null);
            chai.expect(cancelledByString).to.equal(null);

            chai.expect(results.length).to.equal(workerCount * 2);
            for (let i = 0, n = results.length; i < n; ++i) {
                chai.expect(results[i]).to.equal('pong');
            }
        });

        it('can kill all its workers', function() {
            pool.killWorkers();

            chai.expect(pool.workerCount).to.equal(0);
        });
    });
}

export default run;
