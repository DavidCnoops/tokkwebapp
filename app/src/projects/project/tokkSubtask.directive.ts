

///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {

    'use strict';
    
    const styles = require('tokkSubtask.css');

    function tokkSubtask() {
        return {
            scope: {},
            bindToController: {
                userUID: '@useruid',
                projectID: '@projectid',
                tasksProjectID: '@tasksprojectid',
                taskID: '@taskid',
                subtaskID: '@subtaskid',
                editable: '<editable'
            },
            restrict: 'E',
            templateUrl: 'tokkSubtask.template.html',
            controller: SubtaskController,
            controllerAs: 'vm'
        };
    }

    class SubtaskController {
        public styles: any;
        public userUID: string;
        public projectID: string;
        public tasksProjectID: string;
        public taskID: string;
        public subtaskID: string;
        public editable: boolean;
        public input: HTMLInputElement;
        public subtask: IUserProjectSubtask;
        public subtaskName: string;
        public editing: boolean;
        public subscriptions: Array<Rx.Subscription>;

        constructor(
            private $timeout: ng.ITimeoutService,
            private $scope: ng.IScope,
            private $element: ng.IRootElementService,
            private UserProjectSubtasks: UserProjectSubtasks,
            private Utilities: Utilities
        ) {}

        $onInit() {
            this.styles = styles;
            this.input = <HTMLInputElement>this.$element[0].querySelector('.subtask-input');
            this.subtask = null;
            this.subtaskName = null;
            this.editing = false;

            this.subscriptions = [
                this.UserProjectSubtasks.observe(this.userUID, this.tasksProjectID, this.taskID)
                    .filter(subtasks => _.isArray(subtasks) && !_.isEmpty(subtasks))
                    .switchMap(subtasks => Rx.Observable.from(subtasks))
                    .filter(subtask => subtask.$id === this.subtaskID)
                    .distinctUntilChanged()
                    .subscribe((subtask) => {
                        this.subtask = subtask;
                        this.subtaskName = subtask.subtask_name;
                        this.$scope.$evalAsync();
                    })
            ];

            this.$scope.$on('$destroy', () => {
                this.subscriptions.forEach(subscription => subscription.unsubscribe());
            });
        }


        setSubtaskName(text: string) {
            this.subtaskName = text;
            this.input.textContent = text;
        }


        toggleStatus() {
            this.UserProjectSubtasks.update(this.userUID, this.tasksProjectID, this.taskID, this.subtaskID, {
                'subtask_completed': !this.subtask.subtask_completed
            });
        }


        startEditing() {
            if (this.editable && !this.editing) {
                this.editing = true;

                this.$timeout(() => {
                    this.input.focus();
                    this.Utilities.setCaretAtEnd(this.input);
                }, 50);
            }
        }


        stopEditing() {
            if (this.editing) {
                this.editing = false;
                this.input.blur();
                window.getSelection().removeAllRanges();
                this.$scope.$evalAsync();
            }
        }


        reset() {
            this.input.textContent = this.subtask.subtask_name;
            this.stopEditing();
        }


        save(userUID: string, tasksProjectID: string, taskID: string, subtaskID: string) {
            if (this.editing) {
                const subtaskName = _.trim(this.input.textContent);
                const subtaskSlug = this.Utilities.slugify(subtaskName);

                if (_.isString(subtaskSlug) && !_.isEmpty(subtaskSlug)) {                
                    this.UserProjectSubtasks.update(userUID, tasksProjectID, taskID, subtaskID, {
                        'subtask_name': subtaskName, 
                        'subtask_slug': subtaskSlug
                    });
                }
                else if (this.input && this.subtask) {
                    this.input.textContent = this.subtask.subtask_name;
                }

                this.stopEditing();
            }
        }


        remove(
            userUID: string, 
            tasksProjectID: string, 
            taskID: string, 
            subtask: IUserProjectSubtask, 
            event: MouseEvent
        ) {
            event.preventDefault();

            if (this.editable) {
                this.UserProjectSubtasks.remove(userUID, tasksProjectID, taskID, subtask);
            }
        }
    }

    angular.module('app').directive('tokkSubtask', tokkSubtask);
}