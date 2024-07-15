///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';

    const styles = require('tokkModal.css');

    function tokkModal() {
        return {
            scope: {},
            bindToController: {
                opened: '<',
                close: '&',
                width: '@?'
            },
            restrict: 'E',
            templateUrl: 'tokkModal.template.html',
            transclude: {
                header: 'tokkModalHeader',
                content: 'tokkModalContent',
                footer: 'tokkModalFooter'
            },
            controller: ModalController,
            controllerAs: 'vm'
        };
    }

    class ModalController {
        public styles: any;
        public opened: boolean;
        public close: Function;

        $onInit() {
            this.styles = styles;
        }
    }

    angular.module('app').directive('tokkModal', tokkModal);
}