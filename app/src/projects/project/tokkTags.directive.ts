///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {

    'use strict';
    
    const styles = require('tokkTags.css');

    function tokkTags() {
        return {
            scope: {},
            bindToController: {
                userUID: '@useruid',
                projectID: '@projectid',
                tasksProjectID: '@tasksprojectid',
                taskID: '@taskid'
            },
            restrict: 'E',
            templateUrl: 'tokkTags.template.html',
            controller: TagsController,
            controllerAs: 'vm'
        };
    }

    class TagsController {
        public styles: any;
        public userUID: string;
        public projectID: string;
        public tasksProjectID: string;
        public taskID: string;
        public inputText: string;
        public project: IUserProject;
        public task: IUserProjectTask;
        public tags: Array<IUserProjectTaskTag>;
        public groupTags: Array<IGroupTag>;
        public nameExtension: string;
        public myFullName: string;
        public editing: boolean;
        public canRemove: boolean;
        public autocompleteKey: string;
        public autocompleteOpened: boolean;
        public subscriptions: Array<Rx.Subscription>;

        constructor(
            private $scope: ng.IScope,
            private $element: ng.IRootElementService,
            private $timeout: ng.ITimeoutService,
            private Auth: Auth,
            private Utilities: Utilities,
            private Tags: Tags,
            private GroupTags: GroupTags,
            private Notifications: Notifications,
            private Users: Users,
            private UserProject: UserProject,
            private UserProjectTasks: UserProjectTasks,
            private UserTagsList: UserTagsList,
            private UserProjectTaskTags: UserProjectTaskTags,
            private Entries: Entries,
            private Streams: Streams
        ) {}

        $onInit() {
            this.styles = styles;
            this.inputText = null;
            this.project = null;
            this.task = null;
            this.tags = null;
            this.nameExtension = null;
            this.myFullName = null;
            this.editing = false;
            this.canRemove = (this.userUID === this.Auth.userUID ? true : false);
            this.autocompleteKey = this.Utilities.generateUUID();
            this.autocompleteOpened = false;

            this.subscriptions = [
                Rx.Observable.combineLatest(
                    this.UserProject.observe(this.projectID),

                    this.UserProjectTasks.observe(this.userUID, this.tasksProjectID)
                        .filter(tasks => tasks !== null)
                        .switchMap(tasks => Rx.Observable.from(tasks))
                        .filter(task => task.$id === this.taskID)
                        .distinctUntilChanged(),

                    this.UserProjectTaskTags.observe(this.userUID, this.tasksProjectID, this.taskID),

                    this.Users.observe()
                        .filter(users => users !== null)
                        .switchMap(users => Rx.Observable.from(users))
                        .filter(user => user.$id === this.Auth.userUID)
                        .map(user => `${user.first_name} ${user.last_name}`)
                        .distinctUntilChanged(),

                    this.Streams.stream.sharing.replay
                        .distinctUntilChanged()
                        .switchMap((userUID) => {
                            return this.Users.observe()
                                .filter(users => users !== null)
                                .switchMap(users => Rx.Observable.from(users))
                                .filter(user => user.$id === userUID)
                                .map(user => (this.Auth.userUID !== user.$id ? ` to ${user.first_name}'s list` : ''))
                                .distinctUntilChanged();
                        }),

                    (s1, s2, s3, s4, s5) => {
                        return {
                            'project': s1,
                            'task': s2,
                            'tags': s3,
                            'my_full_name': s4,
                            'name_extension': s5 
                        };
                    }
                ).subscribe((data) => {
                    this.project = data.project;
                    this.task = data.task;
                    this.tags = _(data.tags).sortBy(tag => tag.tag_added).value();
                    this.myFullName = data.my_full_name;
                    this.nameExtension = data.name_extension;
                    this.$scope.$evalAsync();
                })
            ];

            this.$scope.$on('$destroy', () => {
                this.subscriptions.forEach(subscription => subscription.unsubscribe());
            });
        }


        setInputText(text: string) {
            this.inputText = text;
        }


        startEditing() {
            if (!this.editing) {
                this.editing = true;
                this.focusInput();
            }
        }


        stopEditing() {
            if (this.editing) {
                this.editing = false;
                this.inputText = null;
                this.blurInput();
            }
        }


        toggleEditing() {
            if (this.editing) {
                this.stopEditing();
            }
            else {
                this.startEditing();
            }
        }


        focusInput() {
            this.$timeout(() => {
                const input = <HTMLInputElement>this.$element[0].querySelector('.autocomplete-input');

                if (input) {
                    input.focus();
                }
            });
        }


        blurInput() {
            this.$timeout(() => {
                const input = <HTMLInputElement>this.$element[0].querySelector('.autocomplete-input');

                if (input) {
                    input.blur();
                }
            });
        }


        toggleAutocomplete() {
            if (this.tags && this.tags.length > 0) {
                this.autocompleteOpened = !this.autocompleteOpened;
            }
        }


        removeTag(userUID: string, tasksProjectID: string, project: IUserProject, task: IUserProjectTask, tag: IUserProjectTaskTag) {
            if (userUID === this.Auth.userUID) {
                const projectSlug = project.project_slug;
                const taskID = task.$id;
                const taskSlug = task.task_slug;
                const tagID = tag.$id;
                const tagSlug = tag.tag_slug;
                const groupTag = this.GroupTags.find(tagSlug);

                this.UserProjectTaskTags.remove(userUID, tasksProjectID, taskID, tagID).then(() => {
                    this.UserTagsList.remove(userUID, tagSlug);

                    this.GroupTags.updateCount(groupTag.$id, (groupTag.count - 1));

                    this.UserProjectTaskTags.observe(userUID, tasksProjectID, taskID).first().subscribe((tags) => {
                        this.updateEntries(userUID, projectSlug, taskSlug, tags);
                    });
                });
            }

            this.focusInput();
        }


        addTag(
            userUID: string, 
            tasksProjectID: string, 
            project: IUserProject, 
            task: IUserProjectTask, 
            senderFullName: string,
            inputText: string, 
            tags: Array<IUserProjectTaskTag>
        ) {
            const projectName = project.project_name;
            const projectSlug = project.project_slug;
            const taskID = task.$id;
            const taskName = task.task_name;
            const taskSlug = task.task_slug;
            let tagName = _.trim(inputText);
            let tagSlug = this.Utilities.slugify(tagName);

            if (tagName && tagSlug && tagSlug !== 'untagged' && !_(tags).some(tag => tag.tag_slug === tagSlug)) {
                const existingGroupTag = this.GroupTags.find(tagSlug);
                const groupTagID = (existingGroupTag ? existingGroupTag.$id : null);
                const groupTagCount = (existingGroupTag ? existingGroupTag.count : 0);
                tagName = (existingGroupTag ? existingGroupTag.tag_name : tagName);
                tagSlug = (existingGroupTag ? existingGroupTag.tag_slug : tagSlug);

                this.Tags.add(userUID, tasksProjectID, taskID, tagName, tagSlug, groupTagID, groupTagCount).then(() => {
                    if (userUID !== this.Auth.userUID) {
                        this.Notifications.add(userUID, {
                            'type': 'tagassigned',
                            'sender_uid': this.Auth.userUID,
                            'sender_name': senderFullName,
                            'project_name': projectName,
                            'project_slug': projectSlug,
                            'task_name': taskName,
                            'task_slug': taskSlug,
                            'tag_name': tagName,
                            'tag_slug': tagSlug
                        });
                    }

                    this.UserProjectTaskTags.observe(userUID, tasksProjectID, taskID).first().subscribe((newTags) => {
                        this.updateEntries(userUID, projectSlug, taskSlug, newTags);
                    });

                    this.UserTagsList.add(userUID, {'tag_name': tagName, 'tag_slug': tagSlug});
                });

                this.inputText = null;
            }
        }


        updateEntries(userUID: string, projectSlug: string, taskSlug: string, tags: Array<IUserProjectTaskTag>) {
            this.Entries.queryOnce('project_slug', projectSlug).then((entries) => {
                _(entries)
                    .filter(entry => entry.task_slug === taskSlug)
                    .forEach(entry => this.Entries.update(entry.$id, {'tags': _(tags).map(tag => tag.tag_slug).value()}));
            });
        }
    }

    angular.module('app').directive('tokkTags', tokkTags);
}