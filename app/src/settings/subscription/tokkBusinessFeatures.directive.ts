///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {

    'use strict';
    
    const styles = require('tokkBusinessFeatures.css');

    function tokkBusinessFeatures() {
        return {
            scope: {},
            bindToController: {},
            restrict: 'E',
            templateUrl: 'tokkBusinessFeatures.template.html',
            controller: BusinessFeaturesController,
            controllerAs: 'vm'
        };
    }

    class BusinessFeaturesController {
        public styles: any;

        $onInit() {
            this.styles = styles;
        }
    }

    angular.module('app').directive('tokkBusinessFeatures', tokkBusinessFeatures);
}