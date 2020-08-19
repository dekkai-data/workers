/* global Deno */

/*
 * deno is not viable for this work until the following task is completed:
 * https://github.com/denoland/deno/issues/3557
 */
import '../../node_modules/mocha/mocha.js';

import {env} from './env.js';
import specWorkerWrapper from '../base/WorkerWrapper.spec.js';
import specWorkerSelf from '../base/WorkerSelf.spec.js';
import specWorkerInterface from '../base/WorkerInterface.spec.js';
import specWorkerPool from '../base/WorkerPool.spec.js';
import specAPI from '../base/API.spec.js';

mocha.setup({ ui: 'bdd', reporter: 'spec' });
mocha.checkLeaks();

specWorkerWrapper(env);
specWorkerSelf(env);
specWorkerInterface(env);
specWorkerPool(env);
specAPI(env);

function onCompleted(failures) {
    if (failures > 0) {
        Deno.exit(1);
    } else {
        Deno.exit(0);
    }
}

// Browser based Mocha requires `window.location` to exist.
window.location = new URL('http://localhost:0');

mocha.color(true);
mocha.run(onCompleted).globals(['onerror']);
