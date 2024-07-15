///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';

    const styles = require('tokkSuccessModal.css');

    function tokkSuccessModal() {
        return {
            scope: {},
            bindToController: {
                opened: '<',
                close: '&'
            },
            restrict: 'E',
            templateUrl: 'tokkSuccessModal.template.html',
            transclude: {
                title: 'tokkSuccessModalTitle',
                content: 'tokkSuccessModalContent'
            },
            controller: SuccessModalController,
            controllerAs: 'vm'
        };
    }

    class SuccessModalController {
        public styles: any;
        public opened: boolean;
        public close: Function;

        $onInit() {
            this.styles = styles;
        }
    }

    angular.module('app').directive('tokkSuccessModal', tokkSuccessModal);
}