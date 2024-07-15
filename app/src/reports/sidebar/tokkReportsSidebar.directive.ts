///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {

    'use strict';

    const styles = require('tokkReportsSidebar.css');

    function tokkReportsSidebar() {
        return {
            scope: {},
            bindToController: {},
            restrict: 'E',
            templateUrl: 'tokkReportsSidebar.template.html',
            controller: ReportsSidebarController,
            controllerAs: 'vm'
        };
    }

    class ReportsSidebarController {
        public styles: any;
        public loaded: boolean;
        public modalOpened: boolean;
        public reportToEdit: IReportListItem;
        public editing: boolean;
        public reports: Array<IReportListItem>;
        public hasReports: boolean;
        public selectedFilterCollection: IFilterCollection;
        public subscriptions: Array<Rx.Subscription>;

        constructor(
            private $scope: ng.IScope,
            private ReportsList: ReportsList,
            private FilterCollections: FilterCollections
        ) {}

        $onInit() {
            this.styles = styles;
            this.loaded = false;
            this.modalOpened = false;
            this.reportToEdit = null;
            this.editing = false;
            this.reports = null;
            this.hasReports = null;
            this.selectedFilterCollection = null;

            this.subscriptions = [
                Rx.Observable.combineLatest(
                    this.ReportsList.observe(),
                    this.FilterCollections.observe(),
                    this.FilterCollections.replay,
                    (s1, s2, s3) => {
                        return {
                            'reports': s1,
                            'filtercollections': s2, 
                            'selected_filtercollection_id': s3
                        };
                    }
                ).subscribe((data) => {
                    this.loaded = true;
                    this.reports = data.reports;
                    this.hasReports = (data.reports && data.reports.length > 0);
                    this.selectedFilterCollection = _(data.filtercollections).find(filtercollection => filtercollection.$id === data.selected_filtercollection_id);

                    if (!this.selectedFilterCollection && data.reports && data.reports.length > 0) {
                        this.FilterCollections.set(data.reports[0].filtercollection_id);
                    }

                    this.$scope.$evalAsync();
                })
            ];

            this.$scope.$on('$destroy', () => {
                this.FilterCollections.set(null);
                this.subscriptions.forEach(subscription => subscription.unsubscribe());
            });
        }


        openModal() {
            this.modalOpened = true;
        }


        closeModal() {
            this.modalOpened = false;
        }


        openReportEditing(report: IReportListItem, event: MouseEvent) {
            event.stopPropagation();
            this.reportToEdit = report;
            this.editing = true;
        }


        closeReportEditing() {
            this.reportToEdit = null;
            this.editing = false;
        }


        selectReport(filterCollectionID: string) {
            this.FilterCollections.set(filterCollectionID);
        }
    }

    angular.module('app').directive('tokkReportsSidebar', tokkReportsSidebar);
}