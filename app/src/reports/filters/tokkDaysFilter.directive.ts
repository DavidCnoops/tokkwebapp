///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {

    'use strict';

    const styles = require('tokkDaysFilter.css');

    function tokkDaysFilter() {
        return {
            scope: {},
            bindToController: {},
            restrict: 'E',
            templateUrl: 'tokkDaysFilter.template.html',
            controller: DaysFilterController,
            controllerAs: 'vm'
        };
    }

    class DaysFilterController {
        public styles: any;
        public activated: boolean;
        public todayISODate: string;
        public startDate: string;
        public endDate: string;
        public startMinDate: string;
        public startMaxDate: string;
        public endMinDate: string;
        public endMaxDate: string;
        private dateRange: Array<number>;
        public selectedFilterCollection: IFilterCollection;
        private subscriptions: Array<Rx.Subscription>;

        constructor(
            private $scope: ng.IScope,
            private Today: Today,
            private FilterCollections: FilterCollections
        ) {}

        $onInit() {
            this.styles = styles;
            this.activated = false;
            this.todayISODate = null;
            this.startDate = null;
            this.endDate = null;
            this.startMinDate = null;
            this.startMaxDate = null;
            this.endMinDate = null;
            this.endMaxDate = null;
            this.dateRange = null;

            this.subscriptions = [
                Rx.Observable.combineLatest(
                    this.FilterCollections.observe(),
                    this.FilterCollections.replay,
                    this.Today.replay,
                    (s1, s2, s3) => {
                        return {
                            'filtercollections': s1, 
                            'selected_filtercollection_id': s2,
                            'today_iso_date': s3
                        };
                    }
                ).subscribe((data) => {
                    this.todayISODate = data.today_iso_date;
                    this.selectedFilterCollection = _(data.filtercollections).find(filtercollection => filtercollection.$id === data.selected_filtercollection_id);

                    if (!this.activated) {
                        this.activated = true;

                        if (_.isArray(this.selectedFilterCollection.days)) {
                            const startIsoDate = moment(this.selectedFilterCollection.days[0]).format('YYYY-MM-DD');
                            const endIsoDate = moment(this.selectedFilterCollection.days[1]).format('YYYY-MM-DD');
                            this.selectDateRange(startIsoDate, endIsoDate, false);
                        }
                    }

                    this.$scope.$evalAsync();
                })
            ];

            this.$scope.$on('$destroy', () => {
                this.subscriptions.forEach(subscription => subscription.unsubscribe());
            });
        }


        selectAllDays() {
            this.FilterCollections.update(this.selectedFilterCollection.$id, {'days': 'all'});
        }


        selectDateRange(startIsoDate: string, endIsoDate: string, save: boolean = true) {
            this.startDate = startIsoDate;
            this.endDate = endIsoDate;
            this.startMaxDate = endIsoDate;
            this.endMinDate = startIsoDate;
            this.dateRange = [
                moment(startIsoDate, 'YYYY-MM-DD', true).startOf('day').valueOf(), 
                moment(endIsoDate, 'YYYY-MM-DD', true).endOf('day').valueOf()
            ];

            if (save) {
                this.FilterCollections.update(this.selectedFilterCollection.$id, {'days': this.dateRange});
            }
        }


        selectStartDate(isoDate: string) {
            this.startDate = isoDate;
            this.endMinDate = isoDate;
            this.dateRange = [
                moment(isoDate, 'YYYY-MM-DD', true).startOf('day').valueOf(),
                this.dateRange[1]
            ];

            this.FilterCollections.update(this.selectedFilterCollection.$id, {'days': this.dateRange});
        }


        selectEndDate(isoDate: string) {
            this.endDate = isoDate;
            this.startMaxDate = isoDate;
            this.dateRange = [
                this.dateRange[0],
                moment(isoDate, 'YYYY-MM-DD', true).endOf('day').valueOf()
            ];

            this.FilterCollections.update(this.selectedFilterCollection.$id, {'days': this.dateRange});
        }
    }

    angular.module('app').directive('tokkDaysFilter', tokkDaysFilter);
}