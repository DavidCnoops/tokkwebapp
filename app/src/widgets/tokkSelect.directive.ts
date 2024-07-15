///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';

    const styles = require('tokkSelect.css');

    function tokkSelect() {
        return {
            scope: {},
            bindToController: {
                disabled: '<'
            },
            restrict: 'E',
            template: `
                <div class="custom-select" ng-disabled="vm.disabled">
                    <span ng-transclude></span>
                </div>
            `,
            transclude: true,
            controller: SelectController,
            controllerAs: 'vm'
        };
    }

    class SelectController {
        public styles: any;
        public disabled: boolean;

        $onInit() {
            this.styles = styles;
            this.disabled = (!_.isBoolean(this.disabled) ? false : this.disabled);
        }
    }

    angular.module('app').directive('tokkSelect', tokkSelect);
}