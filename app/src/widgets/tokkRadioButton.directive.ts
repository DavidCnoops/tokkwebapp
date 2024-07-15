///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';

    const styles = require('tokkRadioButton.css');

    function tokkRadioButton() {
        return {
            scope: {},
            bindToController: {
                size: '@',
                checked: '<',
                disabled: '<',
                click: '&'
            },
            restrict: 'E',
            templateUrl: `tokkRadioButton.template.html`,
            controller: RadioButtonController,
            controllerAs: 'vm'
        };
    }

    class RadioButtonController {
        public styles: any;
        public checked: boolean;
        public disabled: boolean;
        public click: Function;

        $onInit() {
            this.styles = styles;
        }


        radiobuttonClicked() {
            if (!this.disabled) {
                this.click();
            }
        }
    }

    angular.module('app').directive('tokkRadioButton', tokkRadioButton);
}