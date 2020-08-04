import {WorkerSelf} from '../../build/lib/WorkerSelf.js';

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
            case 'test-self':
                const result = Boolean(WorkerSelf.self === _self);
                _self.postMessage(node ? { data: result } : result);
                break;

            case 'test-on':
            case 'test-addEventListener':
            {
                const name = msg.data.name;
                const handler = subMsg => {
                    (_self.off || _self.removeEventListener).call(_self, 'message', handler);
                    const result = subMsg.data.task === name;
                    _self.postMessage(node ? { data: result } : result);
                }
                if (task === 'test-on') {
                    WorkerSelf.on('message', handler);
                } else {
                    WorkerSelf.addEventListener('message', handler);
                }
                _self.postMessage(node ? { data: 'ready' } : 'ready');
            }
                break;

            case 'test-off':
            case 'test-removeEventListener':
            {
                const name = msg.data.name;
                let count = 0;

                const handler01 = subMsg => {
                    if (subMsg.data.task === name) {
                        if (task === 'test-off') {
                            WorkerSelf.off('message', handler01);
                        } else {
                            WorkerSelf.removeEventListener('message', handler01);
                        }
                        count += 1;
                    }
                };

                let kill = false;
                const handler02 = subMsg => {
                    if (subMsg.data.task === name) {
                        if (kill) {
                            (_self.off || _self.removeEventListener).call(_self, 'message', handler02);
                        }
                        kill = true;
                        setTimeout(() => _self.postMessage(node ? { data: count } : count), 10);
                    }
                };

                (_self.on || self.addEventListener).call(_self, 'message', handler01);
                (_self.on || self.addEventListener).call(_self, 'message', handler02);

                _self.postMessage(node ? { data: 'ready' } : 'ready');
            }
                break;

            case 'test-postMessage':
                WorkerSelf.postMessage(msg.data.message);
                break;

            default:
                // let the task time out
                break;
        }
    });
}

main();
