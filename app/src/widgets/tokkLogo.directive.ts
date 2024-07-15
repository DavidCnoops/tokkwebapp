///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';

    function tokkLogo() {
        return {
            scope: {},
            bindToController: {},
            restrict: 'E',
            templateUrl: 'tokkLogo.template.html',
            controller: LogoController,
            controllerAs: 'vm'
        };
    }

    class LogoController {
        constructor() {}
    }

    angular.module('app').directive('tokkLogo', tokkLogo);
}