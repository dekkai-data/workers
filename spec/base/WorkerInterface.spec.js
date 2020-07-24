function run(env) {
    const {
        createWorker,
        workerOn,
        workerOff,
        workerPost,
        chai,
    } = env;

    function reportSuccess(worker, handler, done) {
        workerOff(worker, 'message', handler);
        done();
    }

    function reportError(worker, handler, done, error) {
        workerOff(worker, 'message', handler);
        done(error);
    }

    describe('WorkerInterface', function() {
        let worker;

        before(function() {
            worker = createWorker('interface.worker.js');
        });

        it('can add and forward commands to a task executor object', function(done) {
            const handler = msg => {
                if (msg.data === 'ready') {
                    workerPost(worker, { task: 'ping', args: [] });
                } else if (msg.data) {
                    if (msg.data.state === 'success' && msg.data.data === 'pong') {
                        reportSuccess(worker, handler, done);
                    } else if (msg.data.state === 'error') {
                        reportError(worker, handler, done, new Error(msg.data.reason));
                    }
                }
            };

            workerOn(worker, 'message', handler);
            workerPost(worker, { task: 'test-addTaskExecutor01' });
        });

        it('raises an error on unknown tasks', function(done) {
            const handler = msg => {
                if (msg.data && msg.data.state === 'error') {
                    reportSuccess(worker, handler, done);
                } else {
                    reportError(worker, handler, done, new Error('No error received when executing an unknown task'));
                }
            };

            workerOn(worker, 'message', handler);
            workerPost(worker, { task: 'unknownTask', args: [] });
        });

        it('can remove task executor objects and ignores messages when empty', function(done) {
            let timeoutHandle = null;
            const handler = msg => {
                if (msg.data) {
                    if (msg.data.state === 'success' && msg.data.data === 'ready') {
                        workerPost(worker, { task: 'ping', args: [] });
                        timeoutHandle = setTimeout(() => {
                            reportSuccess(worker, handler, done);
                        }, 10);
                    } else if (msg.data.state === 'error') {
                        if (timeoutHandle) {
                            clearTimeout(timeoutHandle);
                        }
                        reportError(worker, handler, done, new Error(msg.data.reason));
                    }
                } else {
                    reportError(worker, handler, done, new Error('Did not receive a proper response from the task executor.'));
                }
            };

            workerOn(worker, 'message', handler);
            workerPost(worker, { task: 'test-removeTaskExecutor01', args: [] });
        });

        it('can add and forward messages to multiple executors', function(done) {
            const handler = msg => {
                if (msg.data === 'ready') {
                    workerPost(worker, { task: 'ping', args: [] });
                } else if (msg.data) {
                    if (msg.data.state === 'success' && msg.data.data === 'pong') {
                        workerPost(worker, { task: 'foo', args: [] });
                    } else if (msg.data.state === 'success' && msg.data.data === 'bar') {
                        reportSuccess(worker, handler, done);
                    } else if (msg.data.state === 'error') {
                        reportError(worker, handler, done, new Error(msg.data.reason));
                    }
                }
            };

            workerOn(worker, 'message', handler);
            workerPost(worker, { task: 'test-addTaskExecutor-all' });
        });

        function checkResult(result, expected, done, handler) {
            try {
                chai.expect(result).to.eql(expected);
                return true;
            } catch (e) {
                reportError(worker, handler, done, e);
                return false;
            }
        }

        it('properly forwards arguments to tasks', function(done) {
            const args = [3, 5];
            let taskCount = 0;
            const handler = msg => {
                if (msg.data) {
                    if (msg.data.state === 'success') {
                        taskCount += 1;
                        if (taskCount === 1 && checkResult(msg.data.data, args, done, handler)) {
                            workerPost(worker, { task: 'add', args });
                        } else if (taskCount === 2 && checkResult(msg.data.data, args[0] + args[1], done, handler)) {
                            reportSuccess(worker, handler, done);
                        }
                    } else if (msg.data.state === 'error') {
                        reportError(worker, handler, done, new Error(msg.data.reason));
                    }
                } else {
                    reportError(worker, handler, done, new Error('Worker sent unrecognized message'));
                }
            };

            workerOn(worker, 'message', handler);
            workerPost(worker, { task: 'repeat', args });
        });

        it('receives transferred objects and transfers objects back', function(done) {
            const args = new Float32Array([23.2, 17.4]);
            const lengthBefore = args.length;

            const handler = msg => {
                if (msg.data) {
                    if (msg.data.state === 'success') {
                        if (msg.data.data === 'received') {
                            const lengthAfter = args.length;
                            try {
                                chai.expect(lengthAfter).to.not.equal(lengthBefore);
                                chai.expect(lengthAfter).to.equal(0);
                                workerPost(worker, { task: 'sendTransfer', args: [] });
                            } catch (e) {
                                reportError(worker, handler, done, e);
                            }
                        } else if (msg.data.data instanceof Float32Array) {
                            const transfer = msg.data.data;
                            try {
                                chai.expect(transfer.length).to.equal(lengthBefore);
                                workerPost(worker, { task: 'confirmTransfer', args: [] });
                            } catch (e) {
                                reportError(worker, handler, done, e);
                            }
                        } else if (msg.data.data === 'transferred') {
                            reportSuccess(worker, handler, done);
                        }
                    } else if (msg.data.state === 'error') {
                        reportError(worker, handler, done, new Error(msg.data.reason));
                    }
                } else {
                    reportError(worker, handler, done, new Error('Worker sent unrecognized message'));
                }
            };

            workerOn(worker, 'message', handler);
            workerPost(worker, { task: 'receiveTransfer', args: [args] }, [args.buffer]);
        });

        after(function() {
            worker.terminate();
        });
    });
}

export default run;
