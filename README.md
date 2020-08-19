<div align="center">

![@dekkai/workers](https://raw.githubusercontent.com/dekkai-data/assets/master/svg/dekkai_workers_banner_light.svg)  
![browser](https://github.com/dekkai-data/workers/workflows/browser/badge.svg)
![node](https://github.com/dekkai-data/workers/workflows/node/badge.svg)
![deno](https://github.com/dekkai-data/workers/workflows/deno/badge.svg)
![opinion](https://img.shields.io/badge/badges_are-meaningless-blue)

</div>

# @dekkai/workers 

Worker tools to manage workers in browsers, node.js and deno.

Provides a minimum common API between all the platforms through wrappers:

- **WorkerWrapper:** Wraps a worker and exposes `addEventListenr`/`removeEventListener`, `on`/`off` and utility functions.
- **WorkerSelf:** Wraps the `self` interface to expose the same API on all platforms.
- **WorkerInterface:** Provides an interface to wrap objects in workers and handle messaging with the main thread.
- **WorkerPool:** Class to schedule tasks and handling messages with multiple workers.
- **envNodeJS:** Utility functions to detect node and handle loading CommonJS (`require`) and ES Modules (`import`).

Check out the full [API Documentation](https://dekkai-data.github.io/workers/)

## Installation

**Browser/NodeJS**
```shell script
$ yarn add @dekkai/workers
```

**Deno**
```javascript
// import from directly from a CDN, like unpkg.com
import {WorkerPool} from 'https://unpkg.com/@dekkai/workers';
```

## Usage

**Create a task executor in your worker code**
```javascript
// simple.worker.js

// import WorkerInterface
import {WorkerInterface} from '@dekkai/workers';

// create an object (can be a class) that will perform the worker tasks.
// Each function in the object will be registered as a task.
// Tasks must return a TaskResult object:
// export interface TaskResult<T> {
//     result: T;
//     transfer?: ArrayBuffer[];
// }
class MyTaskExecutor {
    ping() {
        return { result: 'pong' };
    }
}

// register the object as a task executor
WorkerInterface.instance.addTaskExecutor(new MyTaskExecutor());
```

**Use a `WorkerPool` in your main thread**
```javascript
// main.js

// import WorkerPool and optionally WorkerWrapper 
import {WorkerPool, WorkerWrapper} from '@dekkai/workers';

// create some workers
// in the browser:
const worker = new Worker('./simple.worker.js', { type: 'module' });
// in node: import worker_threads from  'worker_threads';
const worker = new worker_threads.Worker('./simple.worker.js');
// in deno
const worker = new Worker(new URL('./simple.worker.js', import.meta.url), { type: 'module' });
// or use the convenience function in the WorkerWrapper class
const worker = await WorkerWrapper.createWorker('./simple.worker.js', { type: 'module' });

// initialize a worker pool
// workers can be added when constructing the pool
const pool = new WorkerPool([worker1, worker2, ...]);
// after the pool is initialized as an array
pool.addWorkers([worker1, worker2, ...]);
// or one by one
pool.addWorker(worker);

// create a task to execute
const task = pool.makeTask('ping');

// schedule the task
// you can `await` for the result
const result = await pool.scheduleTask(task);
assert(result === 'pong');
// or you can handle the result later using promises
pool.scheduleTask(task).then(result => assert(result === 'pong'));
```

Check out the full [API Documentation](https://dekkai-data.github.io/workers/)

## Deno notes

Unfortunately the Worker API in deno is incomplete, and the full API will not be operational
until the following bug is resolved:
https://github.com/denoland/deno/issues/3557

The current status of deno tests is:
```
  WorkerWrapper
    ✓ should be able to wrap a worker for the platform
    ✓ returns the original worker through its `worker` property
    ✓ can instantiate workers for the platform at runtime
    ✓ wraps the `postMessage` interface
    ✓ listens to events using the `on` method
    ✓ listens to events using the `addEventListener` method
    ✓ removes listeners using the `off` method
    ✓ removes listeners using the `removeEventListener` method
    ✓ invalidates its internal worker when `terminate` is called

  WorkerSelf
    ✓ returns the original context through the `self` property
    ✓ can listen to messages using the `on` API
    ✓ can listen to messages using the `addEventListener` API
    ✓ removes listeners using the `off` API
    ✓ removes listeners using the `removeEventListener` API
    ✓ can post messages using `postMessage`

  WorkerInterface
    ✓ can add and forward commands to a task executor object
    ✓ raises an error on unknown tasks
    ✓ can remove task executor objects and ignores messages when empty
    ✓ can add and forward messages to multiple executors
    ✓ properly forwards arguments to tasks
    1) receives transferred objects and transfers objects back

  WorkerPool
    ✓ can be constructed with an array of workers
    ✓ returns its worker count through the `workerCount` property
    ✓ can add new worker one by one
    ✓ can add multiple workers at once
    ✓ wraps its workers
    2) schedules a task without arguments
    3) schedules a task with arguments
    4) can schedule an init task when adding a worker
    5) handles objects marked for transfer in tasks
    6) schedules an array of tasks
    7) schedules tasks in multiple workers simultaneously
    8) correctly reports if tasks are running
    9) cancels all pending tasks
    10) cancels pending tasks with a specific id
    ✓ can kill all its workers

  API
    11) executes an init task when workers are added
    12) executes tasks simultaneously
    13) can queue more tasks than workers in the pool
    ✓ can kill all of its workers
    14) properly transfers objects both ways


  27 passing (8s)
  14 failing
```
