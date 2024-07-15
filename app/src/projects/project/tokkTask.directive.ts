///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {

    'use strict';

    const styles = require('tokkTask.css');

    function tokkTask() {
        return {
            scope: {},
            bindToController: {
                userUID: '@useruid',
                projectID: '@projectid',
                tasksProjectID: '@tasksprojectid',
                taskID: '@taskid',
                editable: '<editable'
            },
            restrict: 'E',
            templateUrl: 'tokkTask.template.html',
            controller: TaskController,
            controllerAs: 'vm'
        };
    }

    class TaskController {
        public styles: any;
        public userUID: string;
        public projectID: string;
        public tasksProjectID: string;
        public taskID: string;
        public editable: boolean;
        public project: IUserProject;
        public task: IUserProjectTask;
        public taskCompleted: boolean;
        public entry: IDayEntry;
        public subscriptionType: 'free' | 'business';
        public input: HTMLInputElement;
        public editing: boolean;
        public colorHex: string;
        public isoDate: string;
        public subtasks: Array<IUserProjectSubtask>;
        public subtasksCount: number;
        public entryCount: number;
        public isPinned: boolean;
        public autocompleteKey: string;
        public taskExists: boolean;
        public taskExistsMessage: string;
        public toggling: angular.IPromise<void>;
        public subscriptions: Array<Rx.Subscription>;

        constructor(
            private $scope: ng.IScope,
            private $element: ng.IRootElementService,
            private $timeout: ng.ITimeoutService,
            private keys: IKeys,
            private Auth: Auth,
            private Utilities: Utilities,
            private GroupTasks: GroupTasks,
            private GroupTags: GroupTags,
            private UserProject: UserProject,
            private UserProjectTasks: UserProjectTasks,
            private UserProjectSubtasks: UserProjectSubtasks,
            private UserProjectTaskTags: UserProjectTaskTags,
            private UserTasksList: UserTasksList,
            private UserTagsList: UserTagsList,
            private GroupSubscription: GroupSubscription,
            private Tasks: Tasks,
            private Day: Day,
            private Colors: Colors,
            private Entries: Entries,
            private Broadcaster: Broadcaster
        ) {}

        $onInit() {
            this.styles = styles;
            this.project = null;
            this.task = null;
            this.taskCompleted = null;
            this.entry = null;
            this.subscriptionType = null;
            this.input = null;
            this.editing = false;
            this.entryCount = null;
            this.isPinned = false;
            this.colorHex = null;
            this.isoDate = null;
            this.subtasks = null;
            this.subtasksCount = null;
            this.autocompleteKey = this.Utilities.generateUUID();
            this.taskExists = false;
            this.taskExistsMessage = null;
            this.toggling = null;

            this.$timeout(() => {
                this.input = <HTMLInputElement>this.$element[0].querySelector('.autocomplete-input');
            });

            this.subscriptions = [
                // observe subtasks
                this.UserProjectSubtasks.observe(this.userUID, this.tasksProjectID, this.taskID).subscribe((subtasks) => {
                    this.subtasks = _.orderBy(subtasks, [subtask => subtask.position], ['desc']);                      
                    this.subtasksCount = _(subtasks).filter(subtask => !subtask.subtask_completed).size();
                    this.$scope.$evalAsync();
                }),

                // observe project, task and entries
                Rx.Observable.combineLatest(
                    this.UserProject.observe(this.projectID),

                    this.GroupSubscription.observe(this.Auth.userGroup),

                    this.UserProjectTasks.observe(this.userUID, this.tasksProjectID)
                        .filter(items => items !== null)
                        .switchMap(tasks => Rx.Observable.from(tasks))
                        .filter(task => task.$id === this.taskID)
                        .distinctUntilChanged()
                        .do((task) => {
                            if (this.task && task) {
                                if (this.task.editing && !task.editing) {
                                    this.editing = false;
                                    this.taskExists = false;

                                    this.input.blur();

                                    this.Broadcaster.emit({
                                        'key': this.autocompleteKey, 
                                        'message': 'close', 
                                        'value': true
                                    });
                                }

                                if (this.task.expanded && !task.expanded) {
                                    const contentElement = <HTMLDivElement>this.$element[0].querySelector(`.${this.styles.content}`);
                                    const height = contentElement.offsetHeight + 'px';
                                    contentElement.style.height = height;
                                }
                            }
                        }),

                    this.Day.replay
                        .filter(isoDate => _.isString(isoDate) && !_.isEmpty(isoDate))
                        .distinctUntilChanged()
                        .do(isoDate => this.isoDate = isoDate)
                        .switchMap((isoDate) => {
                            return this.Day.observe(isoDate).do(entries => this.entryCount = _.size(entries));
                        }),

                    (s1, s2, s3, s4) => {
                        return {
                            'project': s1, 
                            'subscription': s2,
                            'task': s3, 
                            'entries': s4
                        };
                    }
                )
                .map((data) => {
                    return {
                        'project': data.project, 
                        'subscription': data.subscription,
                        'task': data.task, 
                        'entry': _(data.entries).find(entry => entry.project_slug === data.project.project_slug && entry.task_slug === data.task.task_slug)
                    };
                })
                .subscribe((data) => {
                    this.project = data.project;
                    this.colorHex = (data.project ? this.Colors.list[data.project.color] : null);
                    this.task = data.task;
                    this.taskCompleted = data.task.task_completed;
                    this.subscriptionType = data.subscription.type;
                    this.entry = data.entry;
                    this.isPinned = (_.isObject(data.entry) && !_.isEmpty(data.entry));

                    if (data.task && !this.editing) {
                        this.setTaskName(data.task.task_name);
                    }

                    this.$scope.$evalAsync();
                })
            ];

            this.$scope.$on('$destroy', () => {
                this.subscriptions.forEach(subscription => subscription.unsubscribe());
            });
        }


        setTaskName(text: string) {
            if (this.input && this.input.textContent !== text) {
                this.input.textContent = text;
            }
        }


        toggleExpanded(tasksProjectID: string, taskID: string, editing: boolean, event: JQueryEventObject) {
            if (!editing) {
                this.UserProjectTasks.toggleExpanded(tasksProjectID, taskID);
            }
        }


        resetTaskExists(event: KeyboardEvent) {
            if (event.which !== this.keys.enter) {
                this.taskExists = false;
            }
        }


        toggleStatus(userUID: string, tasksProjectID: string, task: IUserProjectTask) {
            const taskID = task.$id;
            const oldStatus = _.cloneDeep(task.task_completed);
            const newStatus = !oldStatus;
            const oldPosition = _.cloneDeep(task.position);
            const newPosition = this.UserProjectTasks.getListSize(tasksProjectID, newStatus);

            if (this.toggling === null) {
                this.taskCompleted = newStatus;

                this.toggling = this.$timeout(() => {
                    // update firebase status + position
                    this.UserProjectTasks.updateFirebase(userUID, tasksProjectID, taskID, {
                        'task_completed': newStatus,
                        'position': newPosition
                    }).then(() => {
                        // reorder the remaining tasks from the filtered list in which the toggled task was located
                        this.UserProjectTasks.reorder(this.Auth.userUID, tasksProjectID, oldStatus, oldPosition);
                    });

                    this.toggling = null;
                }, 100);
            }
        }


        startEditing(tasksProjectID: string, task: IUserProjectTask, event: Event) {
            if (!this.editing) {
                this.editing = true;
                event.stopPropagation();
                this.UserProjectTasks.cancelEditing(tasksProjectID);
                this.UserProjectTasks.startEditing(tasksProjectID, task.$id);
                this.$timeout(() => {
                    this.Utilities.setCaretAtEnd(this.input);
                }, 50);
            }
        }


        finishEditing(tasksProjectID: string, taskID: string, newTaskName: string, newTaskSlug: string) {
            this.editing = false;
            this.input.blur();
            this.UserProjectTasks.finishEditing(tasksProjectID, taskID, newTaskName, newTaskSlug);
        }


        cancelEditing(tasksProjectID: string, task: IUserProjectTask, event: Event) {
            if (this.editing) {
                if (event) {
                    event.stopPropagation();
                    event.preventDefault();
                    event.stopImmediatePropagation();
                }

                this.editing = false;
                this.taskExists = false;
                this.input.blur();
                window.getSelection().removeAllRanges();
                this.UserProjectTasks.cancelEditing(tasksProjectID);
            }
        }


        updateTaskName(
            isoDate: string, 
            userUID: string, 
            tasksProjectID: string, 
            projectSlug: string, 
            task: IUserProjectTask, 
            event: MouseEvent|KeyboardEvent
        ) {
            event.stopPropagation();
            window.getSelection().removeAllRanges();

            const taskID = task.$id;
            const oldTaskName = task.temp.task_name;
            const oldTaskSlug = task.temp.task_slug;
            const newTaskName = _.trim(this.input.textContent);
            const newTaskSlug = this.Utilities.slugify(newTaskName);
            const taskExists = this.UserProjectTasks.taskExistsInList(tasksProjectID, newTaskSlug);
            const existingOldGroupTask = this.GroupTasks.find(oldTaskSlug);

            this.taskExists = false;

            if (newTaskSlug === oldTaskSlug && newTaskName !== oldTaskName && existingOldGroupTask.count === 1) {
                this.finishEditing(tasksProjectID, taskID, newTaskName, newTaskSlug);

                this.UserTasksList.findTask(userUID, newTaskSlug).then((userTasksListItem) => {
                    return this.Tasks.updateName(userUID, tasksProjectID, task.$id, newTaskName, userTasksListItem.$id, existingOldGroupTask.$id);
                })
                .then(() => {
                    this.Day.updateEntryTask(isoDate, projectSlug, oldTaskSlug, newTaskName, newTaskSlug);
                });
            }
            else if (newTaskSlug !== oldTaskSlug && _.isString(newTaskSlug) && !_.isEmpty(newTaskSlug) && !taskExists) {
                const existingNewGroupTask = this.GroupTasks.find(newTaskSlug);
                const newGroupTaskID = (existingNewGroupTask ? existingNewGroupTask.$id : null);
                const newGroupTaskCount = (existingNewGroupTask ? existingNewGroupTask.count : 0);

                this.finishEditing(tasksProjectID, taskID, newTaskName, newTaskSlug);

                this.Tasks.update(userUID, tasksProjectID, task.$id, newTaskName, newTaskSlug, existingOldGroupTask.$id, existingOldGroupTask.count, newGroupTaskID, newGroupTaskCount).then(() => {
                    this.UserTasksList.updateTaskName(userUID, oldTaskSlug, newTaskName, newTaskSlug);
                    this.Day.updateEntryTask(isoDate, projectSlug, oldTaskSlug, newTaskName, newTaskSlug);
                });
            }
            else if (newTaskSlug === oldTaskSlug) {
                this.finishEditing(tasksProjectID, taskID, oldTaskName, oldTaskSlug);
            }
            else if (taskExists) {
                event.preventDefault();
                this.taskExistsMessage = `A task with the name '${newTaskName}' already exists in this list`;
                this.taskExists = true;
            }
            else {
                event.preventDefault();
            }
        }


        remove(userUID: string, tasksProjectID: string, projectSlug: string, task: IUserProjectTask, event: MouseEvent) {
            const taskID = task.$id;
            const taskSlug = task.task_slug;

            event.stopPropagation();

            this.UserProjectTasks.remove(userUID, tasksProjectID, task).then(() => {
                this.UserProjectSubtasks.removeAll(userUID, tasksProjectID, taskID);

                this.Entries.queryOnce('project_slug', projectSlug).then((entries) => {
                    _(entries).filter(entry => entry.task_slug === taskSlug).forEach(entry => this.Entries.remove(entry));
                });

                this.UserTasksList.remove(userUID, taskSlug);

                const groupTask = this.GroupTasks.find(taskSlug);
                const newGroupTaskCount = groupTask.count - 1;
                this.GroupTasks.updateCount(groupTask.$id, newGroupTaskCount);

                this.UserProjectTaskTags.observe(userUID, tasksProjectID, taskID).first().subscribe((tags) => {
                    _(tags).forEach((tag) => {
                        const groupTag = this.GroupTags.find(tag.tag_slug);
                        this.GroupTags.updateCount(groupTag.$id, (groupTag.count - 1));
                        this.UserProjectTaskTags.remove(userUID, tasksProjectID, taskID, tag.$id);
                        this.UserTagsList.remove(userUID, tag.tag_slug);
                    });
                });
            });
        }


        updateSubtaskPositions(oldIndex: number, newIndex: number, draggedItemID: string) {
            this.UserProjectSubtasks.updatePositions(this.userUID, this.tasksProjectID, this.taskID, oldIndex, newIndex, draggedItemID);
        }


        togglePin(
            isPinned: boolean, 
            entry: IDayEntry, 
            isoDate: string,
            project: IUserProject, 
            tasksProjectID: string, 
            task: IUserProjectTask, 
            entryCount: number
        ) {
            if (!isPinned) {
                this.buildEntryObject(isoDate, project, tasksProjectID, task, entryCount).then((newEntry) => {
                    this.Day.add(newEntry);
                });
            }
            else if (entry) {
                if (entry.seconds === 0) {
                    this.Entries.remove(entry);
                }
                else {
                    this.Broadcaster.emit({
                        'key': '31703e25-7303-4105-9647-7bb3cdc20e29', 
                        'message': 'unpin', 
                        'value': entry.$id
                    });
                }
            }
        }


        private buildEntryObject(
            isoDate: string, 
            project: IUserProject, 
            tasksProjectID: string, 
            task: IUserProjectTask, 
            entryCount: number
        ) {
            return this.UserProjectTaskTags.getOnceForUserAndTask(this.Auth.userUID, tasksProjectID, task.$id).then((tags) => {
                const tagSlugs = _(tags).map(tag => tag.tag_slug).value();

                return <INewEntry>{
                    'active': false,
                    'created_at': Date.now(),
                    'entry_date': isoDate,
                    'last_started': false,
                    'last_paused': false,
                    'seconds': 0,
                    'user_uid': this.Auth.userUID,
                    'project_name': project.project_name,
                    'project_slug': project.project_slug,
                    'task_name': task.task_name,
                    'task_slug': task.task_slug,
                    'position': entryCount,
                    'tags': (tagSlugs && tagSlugs.length > 0 ? tagSlugs : null)
                };
            });
        }
    }

    angular.module('app').directive('tokkTask', tokkTask);
}