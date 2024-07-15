///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';

    const styles = require('tokkPageSection.css');

    function tokkPageSection() {
        return {
            scope: {},
            bindToController: {},
            restrict: 'E',
            template: `
                <div class="tokkPageSectionContainer {{::vm.styles.container}}">
                    <div class="{{::vm.styles.header}}" ng-transclude="header"></div>
                    <div class="{{::vm.styles.content}}" ng-transclude="content"></div>
                </div>
            `,
            transclude: {
                header: 'tokkPageSectionHeader',
                content: 'tokkPageSectionContent'
            },
            controller: PageSectionController,
            controllerAs: 'vm'
        };
    }

    class PageSectionController {
        public styles: any;

        $onInit() {
            this.styles = styles;
        }
    }

    angular.module('app').directive('tokkPageSection', tokkPageSection);
}