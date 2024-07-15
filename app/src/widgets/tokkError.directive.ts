///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';
    
    const styles = require('tokkError.css');

    function tokkError() {
        return {
            scope: {},
            bindToController: {
                visible: '<',
                message: '<',
                paddingTop: '@',
                paddingBottom: '@'
            },
            restrict: 'E',
            templateUrl: 'tokkError.template.html',
            controller: ErrorController,
            controllerAs: 'vm'
        };
    }

    class ErrorController {
        public styles: any;
        public visible: boolean;
        public message: string;
        public paddingTop: string;
        public paddingBottom: string;

        $onInit() {
            this.styles = styles;
        }
    }

    angular.module('app').directive('tokkError', tokkError);
}