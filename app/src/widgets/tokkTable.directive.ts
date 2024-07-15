///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';

    const styles = require('tokkTable.css');

    function tokkTable() {
        return {
            scope: {},
            bindToController: {},
            restrict: 'E',
            template: `<div class="{{::vm.styles.container}}" ng-transclude></div>`,
            transclude: true,
            controller: TableController,
            controllerAs: 'vm'
        };
    }

    class TableController {
        public styles: any;

        $onInit() {
            this.styles = styles;
        }
    }

    angular.module('app').directive('tokkTable', tokkTable);
}