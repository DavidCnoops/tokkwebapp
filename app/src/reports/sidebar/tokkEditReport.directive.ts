///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {

    'use strict';
    
    const styles = require('tokkEditReport.css');

    function tokkEditReport() {
        return {
            scope: {},
            bindToController: {
                report: '<',
                opened: '<',
                close: '&'
            },
            restrict: 'E',
            templateUrl: 'tokkEditReport.template.html',
            controller: EditReportController,
            controllerAs: 'vm'
        };
    }

    class EditReportController {
        public styles: any;
        public report: IReportListItem;
        public opened: boolean;
        public close: () => void;
        public inputText: string;
        public confirmationModalOpened: boolean;
        public processing: boolean;
        public reports: Array<IReportListItem>;
        public selectedFilterCollectionID: string;
        public subscriptions: Array<Rx.Subscription>;

        constructor(
            private $scope: ng.IScope,
            private ReportsList: ReportsList,
            private Reports: Reports,
            private FilterCollections: FilterCollections
        ) {}

        $onInit() {
            this.styles = styles;
            this.inputText = null;
            this.confirmationModalOpened = false;
            this.processing = false;
            this.reports = null;
            this.selectedFilterCollectionID = null;

            const listener = this.$scope.$watch(() => this.opened, (newValue, oldValue) => {
                this.inputText = (oldValue !== true && newValue === true ? this.report.name : null);
                this.confirmationModalOpened = false;
                this.processing = false;
            }, true);

            this.subscriptions = [
                Rx.Observable.combineLatest(
                    this.ReportsList.observe(),
                    this.FilterCollections.replay,
                    (s1, s2) => {
                        return {
                            'reports': s1,
                            'selected_filtercollection_id': s2
                        };
                    }
                ).subscribe((data) => {
                    this.reports = data.reports;
                    this.selectedFilterCollectionID = data.selected_filtercollection_id;
                    this.$scope.$evalAsync();
                })
            ];

            this.$scope.$on('$destroy', () => {
                listener();
                this.subscriptions.forEach(subscription => subscription.unsubscribe());
            });
        }


        openConfirmationModal() {
            this.confirmationModalOpened = true;
        }


        closeConfirmationModal() {
            if (!this.processing) {
                this.confirmationModalOpened = false;
            }
        }


        update(reportName: string) {
            if (reportName && reportName.length > 0) {
                this.ReportsList.update(this.report.$id, {'name': reportName});
                this.close();
            }
        }


        remove() {
            if (!this.processing) {
                const filterCollectionID = this.report.filtercollection_id;
                const reportID = this.report.$id;

                this.processing = true;

                this.Reports.remove(filterCollectionID, reportID).then(() => {
                    this.processing = false;
                    this.close();
                });
            }
        }
    }

    angular.module('app').directive('tokkEditReport', tokkEditReport);
}