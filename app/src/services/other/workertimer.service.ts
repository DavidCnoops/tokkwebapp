///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {

    'use strict';

    export class WorkerTimer {
        private id: number;
        private worker: Worker;
        private callbacks: Array<{
            fn: any;
            context: any;
        }>;

        constructor() {
            this.id = 0;
            this.callbacks = [];
            this.worker = new Worker('/static/js/timer-worker.js');
            this.worker.onmessage = this.onMessage.bind(this);
        }


        setInterval(cb, interval, context) {
            this.id = this.id + 1;
            const id = this.id;
            this.callbacks[this.id] = {fn: cb, context: context};
            this.worker.postMessage({command: 'interval:start', interval: interval, id: id});
            return id;
        }


        setTimeout(cb, delay, context) {
            this.id = this.id + 1;
            const id = this.id;
            this.callbacks[this.id] = {fn: cb, context: context};
            this.worker.postMessage({command: 'timeout:start', delay: delay, id: id});
            return id;
        }


        onMessage(e) {
            if (e.data.message === 'interval:tick' || e.data.message === 'timeout:ended') {
                const callback = this.callbacks[e.data.id];

                if (callback && callback.fn) {
                    callback.fn.apply(callback.context);
                }
            }

            if (e.data.message === 'interval:cleared' || e.data.message === 'timeout:cleared') {
                delete this.callbacks[e.data.id];
            }
        }


        clearInterval(id) {
            this.worker.postMessage({command: 'interval:clear', id: id});
        }


        clearTimeout(id) {
            this.worker.postMessage({command: 'timeout:clear', id: id});
        }
    }

    angular.module('app').service('WorkerTimer', WorkerTimer);
}