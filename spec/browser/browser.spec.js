import {env} from './env.js';
import specWorkerWrapper from '../base/WorkerWrapper.spec.js';
import specWorkerSelf from '../base/WorkerSelf.spec.js';
import specWorkerInterface from '../base/WorkerInterface.spec.js';
import specWorkerPool from '../base/WorkerPool.spec.js';
import specAPI from '../base/API.spec.js';

specWorkerWrapper(env);
specWorkerSelf(env);
specWorkerInterface(env);
specWorkerPool(env);
specAPI(env);
