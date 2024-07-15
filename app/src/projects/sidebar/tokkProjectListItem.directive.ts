///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {

    'use strict';

    const styles = require('tokkProjectListItem.css');

    function tokkProjectListItem() {
        return {
            scope: {},
            bindToController: {
                name: '@name',
                projectID: '@projectid',
                color: '<color'
            },
            restrict: 'E',
            templateUrl: 'tokkProjectListItem.template.html',
            controller: ProjectListItemController,
            controllerAs: 'vm'
        };
    }

    class ProjectListItemController {
        public styles: any;
        public name: string;
        public projectID: string;
        public color: string;
        public showButton: boolean;

        constructor(
            private $timeout: ng.ITimeoutService,
            private UserProject: UserProject,
            private Broadcaster: Broadcaster
        ) {}

        $onInit() {
            this.styles = styles;
            this.showButton = true;
        }


        select(projectID: string) {
            this.UserProject.set(projectID);
        }


        edit(projectID: string, event: Event) {
            event.stopPropagation();

            this.showButton = false;

            this.$timeout(() => {
                this.showButton = true;
            }, 10);

            this.Broadcaster.emit({
                'key': 'e816e694-d97d-484b-b801-baf2455f4282', 
                'message': 'editproject', 
                'value': projectID
            });
        }
    }

    angular.module('app').directive('tokkProjectListItem', tokkProjectListItem);
}