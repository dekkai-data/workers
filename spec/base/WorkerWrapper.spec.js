import {WorkerWrapper} from '../../dist/WorkerWrapper.js';

function run(env) {
    const {
        createWorker,
        workerOn,
        workerOff,
        workerPost,
        chai,
    } = env;

    describe('WorkerWrapper', function() {
        let worker;
        let wrapped;

        before(function() {
            worker = createWorker('wrapper.worker.js');
            wrapped = new WorkerWrapper(worker);
        });

        it('should be able to wrap a worker for the platform', function() {
            chai.expect(wrapped).to.exist;
        });

        it('returns the original worker through its `worker` property', function() {
            chai.expect(wrapped.worker).to.equal(worker);
        });

        it('wraps the `postMessage` interface', function (done) {
            const handler = msg => {
                workerOff(worker, 'message', handler);
                if (msg.data === 'pong') {
                    done();
                } else {
                    done(new Error(`sent 'ping' message, expected 'pong' as result but got '${msg.data}'`));
                }
            };

            workerOn(worker, 'message', handler);
            wrapped.postMessage('ping');
        });

        it('listens to events using the `on` method', function(done) {
            const handler = msg => {
                workerOff(worker, 'message', handler);
                if (msg.data === 'pong') {
                    done();
                } else {
                    done(new Error(`sent 'ping' message, expected 'pong' as result but got '${msg.data}'`));
                }
            };

            wrapped.on('message', handler);
            workerPost(worker, 'ping');
        });

        it('listens to events using the `addEventListener` method', function(done) {
            const handler = msg => {
                workerOff(worker, 'message', handler);
                if (msg.data === 'pong') {
                    done();
                } else {
                    done(new Error(`sent 'ping' message, expected 'pong' as result but got '${msg.data}'`));
                }
            };

            wrapped.addEventListener('message', handler);
            workerPost(worker, 'ping');
        });

        it('removes listeners using the `off` method', function(done) {
            let isOff = false;

            const handler = msg => {
                if (isOff) {
                    done(new Error('received messages after unregistering the event listener'));
                } else if (msg.data !== 'pong') {
                    done(new Error(`sent 'ping' message, expected 'pong' as result but got '${msg.data}'`));
                } else {
                    wrapped.off('message', handler);
                    isOff = true;

                    const doneHandler = () => {
                        workerOff(worker, 'message', doneHandler);
                        done();
                    };

                    workerOn(worker, 'message', doneHandler);
                    workerPost(worker, 'ping');
                }
            };

            workerOn(worker, 'message', handler);
            workerPost(worker, 'ping');
        });

        it('removes listeners using the `removeEventListener` method', function(done) {
            let isOff = false;

            const handler = msg => {
                if (isOff) {
                    done(new Error('received messages after unregistering the event listener'));
                } else if (msg.data !== 'pong') {
                    done(new Error(`sent 'ping' message, expected 'pong' as result but got '${msg.data}'`));
                } else {
                    wrapped.removeEventListener('message', handler);
                    isOff = true;

                    const doneHandler = () => {
                        workerOff(worker, 'message', doneHandler);
                        done();
                    };

                    workerOn(worker, 'message', doneHandler);
                    workerPost(worker, 'ping');
                }
            };

            workerOn(worker, 'message', handler);
            workerPost(worker, 'ping');
        });

        it('invalidates its internal worker when `terminate` is called', function() {
            wrapped.terminate();
            chai.expect(wrapped._worker).to.equal(null);
        });

        after(function() {
            worker.terminate();
        });
    });
}

export default run;
