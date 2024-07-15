///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {

    'use strict';

    const styles = require('tokkAddReport.css');

    function tokkAddReport() {
        return {
            scope: {},
            bindToController: {
                opened: '<',
                close: '&'
            },
            restrict: 'E',
            templateUrl: 'tokkAddReport.template.html',
            controller: AddReportController,
            controllerAs: 'vm'
        };
    }

    class AddReportController {
        public styles: any;
        public opened: boolean;
        public close: () => void;
        public inputText: string;
        public processing: boolean;

        constructor(
            private $scope: ng.IScope,
            private $timeout: ng.ITimeoutService,
            private $element: ng.IRootElementService,
            private FilterCollections: FilterCollections,
            private Reports: Reports
        ) {}

        $onInit() {
            this.styles = styles;
            this.inputText = null;
            this.processing = false;

            const listener = this.$scope.$watch(() => this.opened, (newValue, oldValue) => {
                this.inputText = null;
                this.processing = false;

                if (oldValue !== true && newValue === true) {
                    this.$timeout(() => {
                        const input = <HTMLInputElement>this.$element[0].querySelector(`.${this.styles.input}`);
                        input.focus();
                    });
                }
            }, true);

            this.$scope.$on('$destroy', () => {
                listener();
            });
        }


        closeModal() {
            if (!this.processing) {
                this.close();
            }
        }


        createReport(reportName: string) {
            if (!this.processing && reportName && reportName.length > 0) {
                this.processing = true;

                this.Reports.add(reportName).then((filterCollectionID) => {
                    this.FilterCollections.set(filterCollectionID);
                    this.close();
                });
            }
        }
    }

    angular.module('app').directive('tokkAddReport', tokkAddReport);
}