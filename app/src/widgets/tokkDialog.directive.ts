///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';

    const styles = require('tokkDialog.css');

    function tokkDialog() {
        return {
            scope: {},
            bindToController: {
                opened: '<',
                uniqueid: '@',
                width: '@',
                close: '&'
            },
            restrict: 'E',
            template: `
                <div class="{{::vm.styles.container}}">

                    <div ng-transclude="button"></div>

                    <div class="{{::vm.styles.dialog}} {{::vm.uniqueid}}-noclose" 
                            ng-if="vm.opened" 
                            ng-style="::{'width': vm.width}"
                            tokk-click-outside container="{{::vm.uniqueid}}-noclose" action="vm.close()">

                        <div ng-transclude="content"></div>

                    </div>

                </div>
            `,
            transclude: {
                button: 'tokkDialogButton',
                content: 'tokkDialogContent'
            },
            controller: DialogController,
            controllerAs: 'vm'
        };
    }

    class DialogController {
        public styles: any;
        public opened: boolean;

        $onInit() {
            this.styles = styles;
        }
    }

    angular.module('app').directive('tokkDialog', tokkDialog);
}