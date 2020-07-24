
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
        if (msg.data === 'ping') {
            _self.postMessage(node ? { data: 'pong' } : 'pong');
        }
    });
}

main();
