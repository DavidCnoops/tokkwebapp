///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {

    'use strict';

    export class ReplayBroadcaster {
        private behaviorSubject: Rx.BehaviorSubject<IBroadcastObject>;
        private publish: Rx.Observable<IBroadcastObject>;
        private list: { [key: string]: Rx.Observable<IBroadcastObject>; };

        constructor() {
            this.behaviorSubject = new Rx.BehaviorSubject<IBroadcastObject>(null);
            this.publish = this.behaviorSubject.publishReplay(1).refCount();
            this.list = {};
        }


        emit(object: IBroadcastObject) {
            this.behaviorSubject.next(object);
        }


        observe() {
            return this.publish;
        }


        observeKey(key: string) {
            if (!this.list[key]) {
                this.list[key] = this.behaviorSubject.filter(data => data && data.key === key).publishReplay(1).refCount();
            }

            return this.list[key];
        }
    }

    angular.module('app').service('ReplayBroadcaster', ReplayBroadcaster);
}