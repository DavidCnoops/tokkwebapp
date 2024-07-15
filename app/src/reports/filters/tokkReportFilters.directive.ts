///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {

    'use strict';

    const styles = require('tokkReportFilters.css');

    function tokkReportFilters() {
        return {
            scope: {},
            bindToController: {},
            restrict: 'E',
            templateUrl: 'tokkReportFilters.template.html',
            controller: ReportFiltersController,
            controllerAs: 'vm'
        };
    }

    class ReportFiltersController {
        public styles: any;
        public loaded: boolean;
        public visible: boolean;
        public reportName: string;
        public selectedFilterCollection: IFilterCollection;
        public users: Array<IUser>;
        public startDay: string;
        public endDay: string;
        public headerElement: HTMLDivElement;
        public hasBusinessSubscription: boolean;
        public hasAccessToGroupEntries: boolean;
        public filterOpened: { [key: string]: boolean };
        public subscriptions: Array<Rx.Subscription>;

        constructor(
            private $scope: ng.IScope,
            private $element: ng.IRootElementService,
            private Auth: Auth,
            private ReportsList: ReportsList,
            private ReportDependencies: ReportDependencies,
            private FilterCollections: FilterCollections,
            private Broadcaster: Broadcaster,
            private GroupSubscription: GroupSubscription,
            private Users: Users
        ) {}

        $onInit() {
            this.styles = styles;
            this.loaded = false;
            this.visible = false;
            this.reportName = null;
            this.selectedFilterCollection = null;
            this.users = null;
            this.startDay = null;
            this.endDay = null;
            this.headerElement = null;
            this.hasBusinessSubscription = false;
            this.hasAccessToGroupEntries = false;
            this.filterOpened = {
                'days': false,
                'projects': false,
                'tasks': false,
                'tags': false,
                'users': false
            };

            this.subscriptions = [
                Rx.Observable.zip(
                    this.Broadcaster.observeKey('dd3412c5-7e8c-47f5-ad86-d1a0023c4227'), 
                    this.Broadcaster.observeKey('a1217022-9040-465b-997f-2e59ac8c5b1c')
                ).subscribe(() => {
                    this.visible = true;
                    this.$scope.$evalAsync();
                }),


                Rx.Observable.combineLatest(
                    this.ReportsList.observe(),

                    this.FilterCollections.observe(),

                    this.FilterCollections.replay
                        .distinctUntilChanged()
                        .do(() => {
                            this.loaded = false;
                            this.visible = false;
                            this.headerElement = null;
                            this.reset();
                            this.$scope.$evalAsync();
                        })
                        .delay(50),

                    this.GroupSubscription.observe(this.Auth.userGroup),

                    this.Users.observe(),

                    (s1, s2, s3, s4, s5) => {
                        return {
                            'reports': s1,
                            'filtercollections': s2, 
                            'selected_filtercollection_id': s3,
                            'subscription': s4,
                            'users': s5
                        };
                    }
                ).subscribe((data) => {
                    this.reportName = null;
                    this.selectedFilterCollection = null;
                    this.startDay = null;
                    this.endDay = null;
                    this.hasBusinessSubscription = (data.subscription.type === 'business');
                    this.users = data.users;
                    this.hasAccessToGroupEntries = _(data.users).find(user => user.$id === this.Auth.userUID).can_access_all_entries;

                    if (data.reports && data.selected_filtercollection_id) {
                        const selectedReport = _(data.reports).find(report => report.filtercollection_id === data.selected_filtercollection_id);

                        if (selectedReport) {
                            this.reportName = selectedReport.name;

                            const selectedFilterCollection = _(data.filtercollections).find(filtercollection => filtercollection.$id === data.selected_filtercollection_id);

                            if (selectedFilterCollection) {
                                this.selectedFilterCollection = {
                                    ...selectedFilterCollection,
                                    'projects': this.ReportDependencies.getFilterValuesViewNames(selectedFilterCollection, 'projects'),
                                    'tasks': this.ReportDependencies.getFilterValuesViewNames(selectedFilterCollection, 'tasks'),
                                    'tags': this.ReportDependencies.getFilterValuesViewNames(selectedFilterCollection, 'tags'),
                                    'users': this.ReportDependencies.getFilterValuesViewNames(selectedFilterCollection, 'users')
                                };

                                if (this.selectedFilterCollection.days !== 'all') {
                                    this.startDay = moment(this.selectedFilterCollection.days[0]).format('MMMM D, YYYY');
                                    this.endDay = moment(this.selectedFilterCollection.days[1]).format('MMMM D, YYYY');
                                }

                                if (!this.loaded) {
                                    this.loaded = true;

                                    this.Broadcaster.emit({
                                        'key': 'a1217022-9040-465b-997f-2e59ac8c5b1c', 
                                        'message': 'reportfiltersloaded', 
                                        'value': true
                                    });
                                }
                            }
                        }
                    }

                    this.$scope.$evalAsync();
                })
            ];

            this.$scope.$on('$destroy', () => {
                this.subscriptions.forEach(subscription => subscription.unsubscribe());
            });
        }


        reset() {
            this.filterOpened = {
                'days': false,
                'projects': false,
                'tasks': false,
                'tags': false,
                'users': false
            };
        }


        toggleCollapse(filterName: 'days' | 'projects' | 'tasks' | 'tags' | 'users') {
            const filteredOpened = !this.filterOpened[filterName];
            this.reset();
            this.filterOpened[filterName] = filteredOpened;
        }


        scrolling(position: number) {
            const action = () => {
                if (position === 0) {
                    this.headerElement.classList.remove('showSeparator');
                }
                else if (!this.headerElement.classList.contains('showSeparator')) {
                    this.headerElement.classList.add('showSeparator');
                }
            };

            if (!this.headerElement) {
                this.headerElement = <HTMLDivElement>this.$element[0].querySelector(`.${this.styles.header}`);

                if (this.headerElement) {
                    action();
                }
            }
            else {
                action();
            }
        }
    }

    angular.module('app').directive('tokkReportFilters', tokkReportFilters);
}