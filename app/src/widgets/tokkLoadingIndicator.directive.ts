///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';

    const styles = require('tokkLoadingIndicator.css');

    function tokkLoadingIndicator() {
        return {
            scope: {},
            bindToController: {},
            restrict: 'E',
            template: `<div class="{{::vm.styles.loading}}">Loading</div>`,
            controller: LoadingIndicatorController,
            controllerAs: 'vm'
        };
    }

    class LoadingIndicatorController {
        public styles: any;

        $onInit() {
            this.styles = styles;
        }
    }

    angular.module('app').directive('tokkLoadingIndicator', tokkLoadingIndicator);
}