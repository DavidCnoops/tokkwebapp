///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {

    'use strict';
    
    const styles = require('tokkAddTask.css');

    function tokkAddTask() {
        return {
            scope: {},
            bindToController: {
                userUID: '<useruid',
                projectID: '<projectid',
                tasksProjectID: '<tasksprojectid'
            },
            restrict: 'E',
            templateUrl: 'tokkAddTask.template.html',
            controller: AddTaskController,
            controllerAs: 'vm'
        };
    }

    class AddTaskController {
        public styles: any;
        public userUID: string;
        public projectID: string;
        public tasksProjectID: string;
        public input: HTMLInputElement;
        public project: IUserProject;
        public groupTasks: Array<IGroupTask>;
        public tasks: Array<IUserProjectTask>;
        public tasksLoaded: boolean;
        public inputText: string;
        public taskExists: boolean;
        public taskExistsMessage: string;
        public nameExtension: string;
        public myFullName: string;
        public autocompleteKey: string;
        public autocompleteOpened: boolean;
        public subscriptions: Array<Rx.Subscription>;
        public projectSubscription: Rx.Subscription;
        public tasksSubscription: Rx.Subscription;

        constructor(
            private $scope: ng.IScope,
            private $element: ng.IRootElementService,
            private $timeout: ng.ITimeoutService,
            private Auth: Auth,
            private Utilities: Utilities,
            private Users: Users,
            private UserProject: UserProject,
            private UserProjectTasks: UserProjectTasks,
            private UserTasksList: UserTasksList,
            private GroupTasks: GroupTasks,
            private Notifications: Notifications,
            private Tasks: Tasks,
            private Streams: Streams
        ) {}

        $onInit() {
            this.styles = styles;
            this.input = null;
            this.project = null;
            this.groupTasks = null;
            this.tasks = null;
            this.tasksLoaded = false;
            this.inputText = null;
            this.taskExists = false;
            this.taskExistsMessage = null;
            this.nameExtension = null;
            this.myFullName = null;
            this.autocompleteKey = this.Utilities.generateUUID();
            this.autocompleteOpened = false;
            this.projectSubscription = null;
            this.tasksSubscription = null;

            const listener1 = this.$scope.$watch(() => this.projectID, (newValue, oldValue) => {
                this.Utilities.unsubscribe(this.projectSubscription);
                this.projectSubscription = this.UserProject.observe(newValue).subscribe((project) => {
                    this.project = project;
                });
            }, true);

            const listener2 = this.$scope.$watchGroup([() => this.userUID, () => this.tasksProjectID], (newValue, oldValue) => {
                this.tasksLoaded = false;
                this.Utilities.unsubscribe(this.tasksSubscription);
                this.tasksSubscription = this.UserProjectTasks.observe(newValue[0], newValue[1]).subscribe((tasks) => {
                    this.tasks = tasks;
                    this.tasksLoaded = true;
                });
            });

            const listener3 = this.$scope.$watch(() => this.inputText, (newValue, oldValue) => {
                this.taskExists = false;
            }, true);

            this.$timeout(() => {
                this.input = <HTMLInputElement>this.$element[0].querySelector(`.${this.styles.input}`);
            });

            this.subscriptions = [
                Rx.Observable.combineLatest(
                    this.Streams.stream.sharing.replay.distinctUntilChanged(),

                    this.Users.observe(),

                    (s1, s2) => {
                        return {
                            'useruid': s1, 
                            'users': s2
                        };
                    }
                ).subscribe((data) => {
                    this.nameExtension = '';
                    this.myFullName = this.Utilities.getFullName(this.Auth.userUID, data.users);

                    if (this.Auth.userUID !== data.useruid) {
                        const user = _(data.users).find(user => user.$id === data.useruid);
                        this.nameExtension = (user ? ` to ${user.first_name}'s list` : ``);
                    }

                    this.$scope.$evalAsync();
                }),

                this.GroupTasks.observe().subscribe((groupTasks) => {
                    this.groupTasks = groupTasks;
                })
            ];

            this.$scope.$on('$destroy', () => {
                listener1();
                listener2();
                listener3();
                this.Utilities.unsubscribe(this.projectSubscription);
                this.Utilities.unsubscribe(this.tasksSubscription);
                this.subscriptions.forEach(subscription => subscription.unsubscribe());
            });
        }


        setInputText(text: string) {
            this.inputText = text;
        }


        toggleAutocomplete() {
            this.autocompleteOpened = !this.autocompleteOpened;
        }


        add(
            userUID: string,
            tasksProjectID: string,
            project: IUserProject,
            tasks: Array<IUserProjectTask>,
            tasksLoaded: boolean,
            groupTasks: Array<IGroupTask>,
            senderFullName: string,
            inputText: string
        ) {
            const projectName = project.project_name;
            const projectSlug = project.project_slug;
            let taskName = _.trim(inputText);
            let taskSlug = this.Utilities.slugify(taskName);
            const taskExists = _(tasks).some(task => task.task_slug === taskSlug);

            if (!taskExists && tasksLoaded && _.isString(taskSlug) && taskSlug.length > 0) {                
                const existingGroupTask = _(groupTasks).find(task => task.task_slug === taskSlug);
                const position = (tasks ? tasks.filter(task => !task.task_completed).length : 0);
                const groupTaskID = (existingGroupTask ? existingGroupTask.$id : null);
                const groupTaskCount = (existingGroupTask ? existingGroupTask.count : 0);
                taskName = (existingGroupTask ? existingGroupTask.task_name : taskName);
                taskSlug = (existingGroupTask ? existingGroupTask.task_slug : taskSlug);

                this.Tasks.add(userUID, tasksProjectID, taskName, taskSlug, position, groupTaskID, groupTaskCount).then(() => {
                    this.UserTasksList.add(userUID, {
                        'task_name': taskName,
                        'task_slug': taskSlug
                    });

                    if (userUID !== this.Auth.userUID) {
                        this.Notifications.add(userUID, {
                            'type': 'taskassigned',
                            'sender_uid': this.Auth.userUID,
                            'sender_name': senderFullName,
                            'project_name': projectName,
                            'project_slug': projectSlug,
                            'task_name': taskName,
                            'task_slug': taskSlug
                        });
                    }
                });

                // reset and focus input
                this.inputText = null;
                this.input.focus();
            }
            else if (taskExists) {
                this.taskExistsMessage = `A task with the name '${taskName}' already exists in this list`;
                this.taskExists = true;
            }
        }
    }

    angular.module('app').directive('tokkAddTask', tokkAddTask);
}