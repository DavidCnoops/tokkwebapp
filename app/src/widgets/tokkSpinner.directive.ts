///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';

    const styles = require('tokkSpinner.css');

    function tokkSpinner() {
        return {
            scope: {},
            bindToController: {
                size: '@',
                color: '@',
                thickness: '@'
            },
            restrict: 'E',
            template: `
                <div class="{{::vm.styles.spinner}}" ng-style="::{
                    'width': vm.size,
                    'height': vm.size,
                    'border-width': vm.thickness,
                    'border-color': vm.color
                }">
                </div>
            `,
            controller: SpinnerController,
            controllerAs: 'vm'
        };
    }

    class SpinnerController {
        public styles: any;
        public size: string;
        public color: string;

        $onInit() {
            this.styles = styles;
        }
    }

    angular.module('app').directive('tokkSpinner', tokkSpinner);
}