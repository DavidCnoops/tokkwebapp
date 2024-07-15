///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {

    'use strict';

    export interface IStream<T> {
        value: T;
        set: (value: T) => void;
        play: Rx.Observable<T>;
        replay: Rx.Observable<T>;
        subscription: Rx.Subscription;
    }

    export interface IStreamNames {
        projects: IStream<'active' | 'completed'>;
        sharing: IStream<string>;
        resultgrouping1: IStream<'list' | 'day' | 'user'>;
        resultgrouping2: IStream<'list' | 'day' | 'user'>;
        fullscreen: IStream<boolean>;
    }

    export class Streams {
        public stream: IStreamNames;

        constructor() {
            this.stream = <any>{};

            ['projects', 'sharing', 'resultgrouping1', 'resultgrouping2', 'fullscreen'].forEach((key) => {
                const behaviorSubject = new Rx.BehaviorSubject(null);

                this.stream[key] = <IStream<any>>{
                    value: null,
                    play: behaviorSubject.share(),
                    replay: behaviorSubject.distinctUntilChanged().publishReplay(1).refCount(),
                    set: (value) => {
                        this.stream[key].value = value;
                        behaviorSubject.next(value);
                    }
                };
            });
        }
    }

    angular.module('app').service('Streams', Streams);
}