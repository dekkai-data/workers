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

    function sendError(reason) {
        const message = {
            state: 'error',
            reason,
        };
        _self.postMessage(node ? {data: message} : message);
    }

    function sendSuccess(data, transferable = undefined) {
        const message = {
            state: 'success',
            data,
        };
        _self.postMessage(node ? { data: message } : message);
    }

    (_self.on || _self.addEventListener).call(_self, 'message', msg => {
        if (msg.data) {
            const task = msg.data.task;
            const args = msg.data.args;
            switch (task) {
                case 'simpleTask':
                    sendSuccess(true);
                    break;

                case 'addNumbers':
                    sendSuccess(args[0] + args[1]);
                    break;

                case 'numberTransfer':
                    sendSuccess([...args[0]]);
                    break;

                case 'waitAndPing':
                    setTimeout(() => sendSuccess('pong'), args[0]);
                    break;

                default:
                    sendError(`Unrecognized task: ${task}`);
            }
        } else {
            sendError('Wrong message format received.');
        }
    });
}

main();
