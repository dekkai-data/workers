function run(env) {
    const {
        createWorker,
        workerOn,
        workerOff,
        workerPost,
        chai,
    } = env;

    function testAddListenerAPI(worker, task, name, done) {
        let ready = false;
        const handler = msg => {
            if (!ready) {
                try {
                    chai.expect(msg.data).to.equal('ready');
                    ready = true;
                    workerPost(worker, { task: name });
                } catch (e) {
                    done(e);
                }
            } else {
                workerOff(worker, 'message', handler);
                try {
                    chai.expect(msg.data).to.equal(true);
                    done();
                } catch (e) {
                    done(e);
                }
            }
        };

        workerOn(worker, 'message', handler);
        workerPost(worker, { task, name });
    }

    function testRemoveListenerAPI(worker, task, name, done) {
        let ready = false;
        let pong = 0;

        const handler = msg => {
            if (!ready) {
                try {
                    chai.expect(msg.data).to.equal('ready');
                    ready = true;
                    workerPost(worker, { task: name });
                } catch (e) {
                    done(e);
                }
            } else if (pong === 0) {
                try {
                    chai.expect(msg.data).to.equal(1);
                    pong += 1;
                    workerPost(worker, { task: name });
                } catch (e) {
                    done(e);
                }
            } else {
                workerOff(worker, 'message', handler);
                try {
                    chai.expect(msg.data).to.equal(1);
                    done();
                } catch (e) {
                    done(e);
                }
            }
        };

        workerOn(worker, 'message', handler);
        workerPost(worker, { task, name });
    }

    describe('WorkerSelf', function() {
        let worker;

        before(function() {
            worker = createWorker('self.worker.js');
        });

        it('returns the original context through the `self` property', function(done) {
            const handler = msg => {
                workerOff(worker, 'message', handler);
                try {
                    chai.expect(msg.data).to.equal(true);
                    done();
                } catch (e) {
                    done(e);
                }
            };

            workerOn(worker, 'message', handler);
            workerPost(worker, { task: 'test-self' });
        });

        it('can listen to messages using the `on` API', function(done) {
            testAddListenerAPI(worker, 'test-on', 'on-tester', done);
        });

        it('can listen to messages using the `addEventListener` API', function(done) {
            testAddListenerAPI(worker, 'test-addEventListener', 'addEventListener-tester', done);
        });

        it('removes listeners using the `off` API', function(done) {
            testRemoveListenerAPI(worker, 'test-off', 'off-tester', done);
        });

        it('removes listeners using the `removeEventListener` API', function(done) {
            testRemoveListenerAPI(worker, 'test-removeEventListener', 'removeEventListener-tester', done);
        });

        it('can post messages using `postMessage`', function(done) {
            const handler = () => {
                workerOff(worker, 'message', handler);
                done();
            };

            workerOn(worker, 'message', handler);
            workerPost(worker, { task: 'test-postMessage', message: null });
        });

        after(function() {
            worker.terminate();
        });
    });
}

export default run;
