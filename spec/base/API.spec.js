import {WorkerPool} from '../../build/dist/mod.js';

// these tests are supposed to test the basic usage of the complete system.
function run(env) {
    const {chai} = env;
    const createWorker = () => env.createWorker('api.worker.js');

    describe('API', function () {
        const pool = new WorkerPool();

        it('executes an init task when workers are added', async function () {
            const workers = [
                createWorker(),
                createWorker(),
                createWorker(),
                createWorker(),
            ];

            const task = pool.makeTask('initialize');
            const results = await pool.addWorkers(workers, task);

            for (let i = 0, n = results.length; i < n; ++i) {
                chai.expect(results[i]).to.equal(true);
            }
        });

        it('executes tasks simultaneously', async function() {
            const tasks = [];
            for (let i = 0, n = pool.workerCount; i < n; ++i) {
                tasks.push(pool.makeTask('setID', [i]));
            }

            const results = await pool.scheduleTasks(tasks);
            for (let i = 0, n = results.length; i < n; ++i) {
                chai.expect(results[i]).to.equal(true);
            }
        });

        it('can queue more tasks than workers in the pool', async function() {
            const taskCount = pool.workerCount * 4;
            const promises = [];
            for (let i = 0; i < taskCount; ++i) {
                const task = pool.makeTask('bounceNumber', [i]);
                promises.push(pool.scheduleTask(task));
            }

            const results = await Promise.all(promises);
            chai.expect(results.length).to.equal(taskCount);

            const bounced = [];
            const idMap = new Map();
            for (let i = 0; i < taskCount; ++i) {
                const result = results[i];
                chai.expect(bounced.indexOf(result.number)).to.equal(-1);
                bounced.push(result.number);
                if (!idMap.has(result.id)) {
                    idMap.set(result.id, 0);
                }
                idMap.set(result.id, idMap.get(result.id) + 1);
            }

            for (let i = 0, n = pool.workerCount; i < n; ++i) {
                chai.expect(idMap.has(i)).to.equal(true);
                chai.expect(idMap.get(i)).to.be.above(1);
            }
        });

        it('can kill all of its workers', function() {
            pool.killWorkers();
            chai.expect(pool.workerCount).to.equal(0);
        });

        it('properly transfers objects both ways', async function() {
            // make sure there's only one worker in the pool
            if (pool.workerCount) {
                pool.killWorkers();
            }
            pool.addWorker(createWorker());

            const reference = [1, 2, 3, 5, 7, 11, 13];
            const typedArray = new Uint32Array(reference);
            chai.expect(typedArray.length).to.equal(reference.length);

            const task = pool.makeTask('bounceTransfer', [typedArray, reference], [typedArray.buffer]);
            const result = await pool.scheduleTask(task);

            chai.expect(typedArray.length).to.equal(0);
            chai.expect(result.length).to.equal(reference.length);
            chai.expect(result).to.eql(new Uint32Array(reference));

            const check = await pool.scheduleTask(pool.makeTask('checkLastTransfer'));
            chai.expect(check).to.equal(true);
        });

        after(function() {
            pool.killWorkers();
        });
    });
}

export default run;
