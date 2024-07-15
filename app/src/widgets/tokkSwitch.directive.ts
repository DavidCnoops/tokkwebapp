///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';

    const styles = require('tokkSwitch.css');

    function tokkSwitch() {
        return {
            scope: {},
            bindToController: {
                checked: '<',
                disabled: '<',
                click: '&'
            },
            restrict: 'E',
            template: `
                <div class="{{::vm.styles.container}}" 
                        ng-click="vm.toggle(vm.disabled)" 
                        ng-class="{'{{::vm.styles.disabled}}': vm.disabled}">

                    <input type="checkbox" ng-checked="vm.checked"><i></i>

                </div>
            `,
            controller: SwitchController,
            controllerAs: 'vm'
        };
    }

    class SwitchController {
        public styles: any;
        public checked: boolean;
        public disabled: boolean;
        public click: Function;

        $onInit() {
            this.styles = styles;
        }


        toggle(disabled: boolean) {
            if (!disabled) {
                this.click();
            }
        }
    }

    angular.module('app').directive('tokkSwitch', tokkSwitch);
}