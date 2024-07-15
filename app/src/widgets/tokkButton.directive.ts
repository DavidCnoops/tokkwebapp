///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';

    const styles = require('tokkButton.css');

    function tokkButton() {
        return {
            scope: {},
            bindToController: {
                text: '@',
                type: '@',
                disabled: '<',
                loading: '<',
                layout: '@?'
            },
            restrict: 'E',
            templateUrl: 'tokkButton.template.html',
            controller: ButtonController,
            controllerAs: 'vm'
        };
    }

    class ButtonController {
        public styles: any;
        public text: string;
        public type: string;
        public disabled: boolean;
        public loading: boolean;
        public layout?: string;
        public spinnerSize: string;

        $onInit() {
            this.styles = styles;
            this.loading = (!_.isBoolean(this.loading) ? false : this.loading);
            this.disabled = (!_.isBoolean(this.disabled) ? false : this.disabled);
            this.spinnerSize = (this.layout === 'big' ? '26px' : '20px');
        }
    }

    angular.module('app').directive('tokkButton', tokkButton);
}