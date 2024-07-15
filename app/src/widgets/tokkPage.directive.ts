///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';

    const styles = require('tokkPage.css');

    function tokkPage() {
        return {
            scope: {},
            bindToController: {},
            restrict: 'E',
            template: `
                <div class="{{::vm.styles.container}}">

                    <div class="animationPageHeader {{::vm.styles.header}}" ng-if="vm.show" ng-transclude="header"></div>

                    <div class="animationPageContent {{::vm.styles.content}}" ng-if="vm.show">
                        <div class="{{::vm.styles.inner}}" ng-transclude="content">
                        </div>
                    </div>

                </div>
            `,
            transclude: {
                header: 'tokkPageHeader',
                content: 'tokkPageContent'
            },
            controller: PageController,
            controllerAs: 'vm'
        };
    }

    class PageController {
        public styles: any;
        public show: boolean;

        constructor(
            private $timeout: ng.ITimeoutService
        ) {}

        $onInit() {
            this.styles = styles;
            this.show = false;
        }


        $postLink() {
            this.$timeout(() => {
                this.show = true;
            }, 50);
        }
    }

    angular.module('app').directive('tokkPage', tokkPage);
}