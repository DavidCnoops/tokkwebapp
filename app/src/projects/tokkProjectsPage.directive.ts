///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';

    const styles = require('tokkProjectsPage.css');

    function tokkProjectsPage() {
        return {
            scope: {},
            bindToController: {},
            restrict: 'E',
            templateUrl: 'tokkProjectsPage.template.html',
            controller: ProjectsPageController,
            controllerAs: 'vm'
        };
    }

    class ProjectsPageController {
        public styles: any;
        public filter: 'active' | 'completed';
        public isProjectSelected: boolean;
        public isDayFullscreen: boolean;
        public unpinModalEntryID: string;
        public unpinModalOpened: boolean;
        public editProjectModalProjectID: string;
        public editProjectModalOpened: boolean;
        public subscriptions: Array<Rx.Subscription>;

        constructor(
            private $scope: ng.IScope,
            private UserProject: UserProject,
            private Streams: Streams,
            private Broadcaster: Broadcaster
        ) {}

        $onInit() {
            this.styles = styles;
            this.filter = null;
            this.isProjectSelected = null;
            this.isDayFullscreen = false;
            this.unpinModalEntryID = null;
            this.unpinModalOpened = false;
            this.editProjectModalProjectID = null;
            this.editProjectModalOpened = false;

            this.subscriptions = [
                this.Broadcaster.observeKey('31703e25-7303-4105-9647-7bb3cdc20e29').subscribe((data) => {
                    this.unpinModalEntryID = data.value;
                    this.unpinModalOpened = true;
                    this.$scope.$evalAsync();
                }),

                this.Broadcaster.observeKey('e816e694-d97d-484b-b801-baf2455f4282').subscribe((data) => {
                    this.editProjectModalProjectID = data.value;
                    this.editProjectModalOpened = true;
                    this.$scope.$evalAsync();
                }),

                Rx.Observable.combineLatest(
                    this.UserProject.replay
                        .filter(projectID => projectID !== 'initializing')
                        .distinctUntilChanged(),

                    this.Streams.stream.projects.replay
                        .filter(value => value !== null)
                        .distinctUntilChanged(),

                    (s1, s2) => {
                        return {
                            'selected_project_id': s1, 
                            'filter': s2
                        };
                    }
                ).subscribe((data) => {
                    this.filter = data.filter;
                    this.isProjectSelected = (_.isString(data.selected_project_id) && !_.isEmpty(data.selected_project_id));
                    this.$scope.$evalAsync();
                }),

                this.Streams.stream.fullscreen.replay.subscribe((value) => {
                    this.isDayFullscreen = value;
                    this.$scope.$evalAsync();
                })
            ];

            this.$scope.$on('$destroy', () => {
                this.subscriptions.forEach(subscription => subscription.unsubscribe());
            });
        }


        closeUnpinModal() {
            this.unpinModalOpened = false;
        }


        closeEditProjectModal() {
            this.editProjectModalOpened = false;
        }
    }

    angular.module('app').directive('tokkProjectsPage', tokkProjectsPage);
}