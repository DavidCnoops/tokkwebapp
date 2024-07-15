///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {

    'use strict';
    
    export interface IBroadcastObject {
        key: string;
        message: string;
        value?: any;
    }

    export class Broadcaster {
        private subject: Rx.Subject<IBroadcastObject>;
        private publish: Rx.Observable<IBroadcastObject>;
        private list: { [key: string]: Rx.Observable<IBroadcastObject>; };

        constructor() {
            this.subject = new Rx.Subject<IBroadcastObject>();
            this.publish = this.subject.share();
            this.list = {};
        }


        emit(object: IBroadcastObject) {
            this.subject.next(object);
        }


        observe() {
            return this.publish;
        }


        observeKey(key: string) {
            if (!this.list[key]) {
                this.list[key] = this.subject.filter(data => data && data.key === key).share();
            }

            return this.list[key];
        }
    }

    angular.module('app').service('Broadcaster', Broadcaster);
}