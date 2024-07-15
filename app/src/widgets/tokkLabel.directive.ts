///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';

    const styles = require('tokkLabel.css');

    function tokkLabel() {
        return {
            scope: {},
            bindToController: {},
            restrict: 'E',
            transclude: true,
            template: `<div class="{{::vm.styles.container}}" ng-transclude></div>`,
            controller: LabelController,
            controllerAs: 'vm'
        };
    }

    class LabelController {
        public styles: any;

        $onInit() {
            this.styles = styles;
        }
    }

    angular.module('app').directive('tokkLabel', tokkLabel);
}