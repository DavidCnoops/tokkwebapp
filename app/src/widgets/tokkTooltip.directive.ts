///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';

    const styles = require('tokkTooltip.css');

    function tokkTooltip() {
        return {
            scope: {},
            bindToController: {
                message: '@',
                vdistance: '@'
            },
            restrict: 'E',
            template: `
                <span class="{{::vm.styles.container}}">
                    <span class="{{::vm.styles.tooltip}}" ng-style="::{'top': vm.vdistance}" ng-bind-html="::vm.message"></span>
                </span>
            `,
            controller: TooltipController,
            controllerAs: 'vm'
        };
    }

    class TooltipController {
        public styles: any;
        public message: string;
        public vdistance: string;

        $onInit() {
            this.styles = styles;
        }
    }

    angular.module('app').directive('tokkTooltip', tokkTooltip);
}