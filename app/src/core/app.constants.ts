///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';

    export interface IKeys {
        backspace: number;
        enter: number;
        esc: number;
        tab: number;
        arrowLeft: number;
        arrowUp: number;
        arrowRight: number;
        arrowDown: number;
    }

	angular
        .module('app')
        .constant('keys', <IKeys>{
            backspace: 8,
            enter: 13,
            esc: 27,
            tab: 9,
            arrowLeft: 37,
            arrowUp: 38,
            arrowRight: 39,
            arrowDown: 40
        });
}