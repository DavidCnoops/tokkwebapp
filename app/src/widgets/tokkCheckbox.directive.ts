///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';

    const styles = require('tokkCheckbox.css');

    function tokkCheckbox() {
        return {
            scope: {},
            bindToController: {
                size: '@',
                checked: '<',
                disabled: '<',
                click: '&'
            },
            restrict: 'E',
            templateUrl: 'tokkCheckbox.template.html',
            controller: CheckboxController,
            controllerAs: 'vm'
        };
    }

    class CheckboxController {
        public styles: any;
        public checked: boolean;
        public disabled: boolean;
        public click: () => void;

        $onInit() {
            this.styles = styles;
        }


        checkboxClicked() {
            if (!this.disabled) {
                this.click();
            }
        }
    }

    angular.module('app').directive('tokkCheckbox', tokkCheckbox);
}