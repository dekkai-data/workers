import {env} from './env.js'
import WorkerWrapper from '../base/WorkerWrapper.spec.js';
import WorkerSelf from '../base/WorkerSelf.spec.js';
import WorkerInterface from '../base/WorkerInterface.spec.js';
import WorkerPool from '../base/WorkerPool.spec.js';
import API from '../base/API.spec.js';

WorkerWrapper(env);
WorkerSelf(env);
WorkerInterface(env);
WorkerPool(env);
API(env);
