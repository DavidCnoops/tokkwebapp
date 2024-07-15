///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {

    'use strict';
    
    const styles = require('tokkProjectsSidebar.css');

    interface IProjectsFilterItem {
        name: string;
        value: 'active' | 'completed';
        selected: boolean;
    }

    function tokkProjectsSidebar() {
        return {
            scope: {},
            bindToController: {},
            restrict: 'E',
            templateUrl: 'tokkProjectsSidebar.template.html',
            controller: ProjectsSidebarController,
            controllerAs: 'vm'
        };
    }

    class ProjectsSidebarController {
        public styles: any;
        public modalOpened: boolean;
        public projectsFilters: Array<IProjectsFilterItem>;
        public filterName: 'active' | 'completed';
        public isEmpty: boolean;
        public subscriptions: Array<Rx.Subscription>;

        constructor(
            private $scope: ng.IScope,
            private UserProjectsList: UserProjectsList,
            private Streams: Streams
        ) {}

        $onInit() {
            this.styles = styles;
            this.isEmpty = false;
            this.projectsFilters = [
                {
                    name: 'Active',
                    value: 'active',
                    selected: false
                },
                {
                    name: 'Completed',
                    value: 'completed',
                    selected: false
                }
            ];

            this.subscriptions = [
                Rx.Observable.combineLatest(
                    this.UserProjectsList.observe(),
                    this.Streams.stream.projects.replay.filter(value => value !== null),
                    (s1, s2) => {
                        return {
                            'projects': s1, 
                            'filter': s2
                        };
                    }
                )
                .subscribe((data) => {
                    this.filterName = data.filter;
                    this.isEmpty = _(data.projects).filter(project => project.completed === (data.filter === 'completed')).isEmpty();
                    this.$scope.$evalAsync();
                })
            ];

            this.$scope.$on('$destroy', () => {
                this.subscriptions.forEach(subscription => subscription.unsubscribe());
            });
        }


        openModal() {
            this.modalOpened = true;
        }


        closeModal() {
            this.modalOpened = false;
        }
    }

    angular.module('app').directive('tokkProjectsSidebar', tokkProjectsSidebar);
}