/*
 * deno is not viable for this work until the following task is completed:
 * https://github.com/denoland/deno/issues/3557
 */
import "../../node_modules/mocha/mocha.js";

import {env} from './env.js'
import WorkerWrapper from '../base/WorkerWrapper.spec.js';
import WorkerSelf from '../base/WorkerSelf.spec.js';
import WorkerInterface from '../base/WorkerInterface.spec.js';
import WorkerPool from '../base/WorkerPool.spec.js';
import API from '../base/API.spec.js';

mocha.setup({ ui: "bdd", reporter: "spec" });
mocha.checkLeaks();

WorkerWrapper(env);
WorkerSelf(env);
WorkerInterface(env);
WorkerPool(env);
API(env);

function onCompleted(failures) {
    if (failures > 0) {
        Deno.exit(1);
    } else {
        Deno.exit(0);
    }
}

console.log(import.meta.url);
// Browser based Mocha requires `window.location` to exist.
window.location = new URL("http://localhost:0");
mocha.run(onCompleted).globals(["onerror"]);
