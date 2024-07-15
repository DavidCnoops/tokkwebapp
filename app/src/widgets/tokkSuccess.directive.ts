///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';
    
    const styles = require('tokkSuccess.css');

    function tokkSuccess() {
        return {
            scope: {},
            bindToController: {
                visible: '<',
                message: '<',
                paddingTop: '@',
                paddingBottom: '@'
            },
            restrict: 'E',
            templateUrl: 'tokkSuccess.template.html',
            controller: SuccessController,
            controllerAs: 'vm'
        };
    }

    class SuccessController {
        public styles: any;
        public visible: boolean;
        public message: string;
        public paddingTop: string;
        public paddingBottom: string;

        $onInit() {
            this.styles = styles;
        }
    }

    angular.module('app').directive('tokkSuccess', tokkSuccess);
}