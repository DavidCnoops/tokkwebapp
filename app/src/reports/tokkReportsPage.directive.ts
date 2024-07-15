///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';

    const styles = require('tokkReportsPage.css');

    function tokkReportsPage() {
        return {
            scope: {},
            bindToController: {},
            restrict: 'E',
            templateUrl: 'tokkReportsPage.template.html',
            controller: ReportsPageController,
            controllerAs: 'vm'
        };
    }

    class ReportsPageController {
        public styles: any;
        public loaded: boolean;
        public hasReports: boolean;
        public subscriptions: Array<Rx.Subscription>;

        constructor(
            private $scope: ng.IScope,
            private Auth: Auth,
            private Users: Users,
            private FilterCollections: FilterCollections,
            private Entries: Entries,
            private GroupProjects: GroupProjects,
            private GroupTasks: GroupTasks,
            private GroupTags: GroupTags,
            private UserProjectsList: UserProjectsList,
            private UserTasksList: UserTasksList,
            private UserTagsList: UserTagsList,
            private ReportDependencies: ReportDependencies,
            private ReportsList: ReportsList
        ) {}

        $onInit() {
            this.styles = styles;
            this.loaded = false;
            this.hasReports = null;

            this.subscriptions = [
                Rx.Observable.combineLatest(
                    this.ReportsList.observe(),
                    this.FilterCollections.observe()
                ).subscribe(([reports, filterCollections]) => {
                    this.hasReports = (reports && reports.length > 0);
                    this.$scope.$evalAsync();
                })
            ];


            this.Users.observe().switchMap((users) => {
                const user = _(users).find(user => user.$id === this.Auth.userUID);
                const hasAccessToGroupEntries = user.can_access_all_entries;

                if (hasAccessToGroupEntries) {
                    return Rx.Observable.zip(
                        Rx.Observable.combineLatest(
                            users.map(user => this.Entries.observe(user.$id)), 
                            (...args: Array<IEntry>) => _.flatten(args)
                        ),
                        this.GroupProjects.observe(),
                        this.GroupTasks.observe(),
                        this.GroupTags.observe(), 
                        (s1, s2, s3, s4) => {
                            return <any>{
                                'users': users,
                                'has_access_to_group_entries': hasAccessToGroupEntries,
                                'entries': s1,
                                'projects': s2,
                                'tasks': s3,
                                'tags': s4
                            };
                        }
                    );
                }
                else {
                    return Rx.Observable.zip(
                        this.Entries.observe(this.Auth.userUID),
                        this.UserProjectsList.observe(),
                        this.UserTasksList.observe(),
                        this.UserTagsList.observe(),
                        (s1, s2, s3, s4) => {
                            return <any>{
                                'users': users,
                                'has_access_to_group_entries': hasAccessToGroupEntries,
                                'entries': s1,
                                'projects': s2,
                                'tasks': s3,
                                'tags': s4
                            };
                        }
                    );
                }
            })
            .first()
            .subscribe((data) => {
                this.loaded = true;

                this.ReportDependencies.initiate(
                    data.has_access_to_group_entries, 
                    data.users, 
                    data.projects, 
                    data.tasks, 
                    data.tags, 
                    data.entries
                );

                this.$scope.$evalAsync();
            });

            this.$scope.$on('$destroy', () => {
                this.ReportDependencies.destroy();
                _(this.subscriptions).forEach(subscription => subscription.unsubscribe());
            });
        }
    }

    angular.module('app').directive('tokkReportsPage', tokkReportsPage);
}