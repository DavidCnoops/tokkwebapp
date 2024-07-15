///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';

    function tokkLogoBusiness() {
        return {
            scope: {},
            bindToController: {},
            restrict: 'E',
            templateUrl: 'tokkLogoBusiness.template.html',
            controller: LogoBusinessController,
            controllerAs: 'vm'
        };
    }

    class LogoBusinessController {
        constructor() {}
    }

    angular.module('app').directive('tokkLogoBusiness', tokkLogoBusiness);
}