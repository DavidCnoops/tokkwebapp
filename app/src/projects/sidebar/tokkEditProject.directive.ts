///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {

    'use strict';

    const styles = require('tokkEditProject.css');

    function tokkEditProject() {
        return {
            scope: {},
            bindToController: {
                opened: '<',
                projectID: '<projectid',
                close: '&'
            },
            restrict: 'E',
            templateUrl: 'tokkEditProject.template.html',
            controller: EditProjectController,
            controllerAs: 'vm'
        };
    }

    class EditProjectController {
        public styles: any;
        public opened: boolean;
        public projectID: string;
        public close: Function;
        public project: IUserProjectListItem;
        public colors: IColors;
        public currentColor: string;
        public currentStatus: boolean;
        public myFullName: string;
        public confirmationModalOpened: boolean;
        public subscriptions: Array<Rx.Subscription>;

        constructor(
            private $scope: ng.IScope,
            private $q: ng.IQService,
            private Auth: Auth,
            private Sharing: Sharing,
            private Colors: Colors,
            private Users: Users,
            private UserProject: UserProject,
            private UserProjectsList: UserProjectsList,
            private UserProjectTasks: UserProjectTasks,
            private UserProjectTaskTags: UserProjectTaskTags,
            private UserProjectSharing: UserProjectSharing,
            private UserTasksList: UserTasksList,
            private UserTagsList: UserTagsList,
            private Entries: Entries,
            private GroupProjects: GroupProjects,
            private GroupTasks: GroupTasks,
            private GroupTags: GroupTags
        ) {}

        $onInit() {
            this.styles = styles;
            this.colors = this.Colors.list;
            this.currentColor = null;
            this.currentStatus = null;
            this.myFullName = null;
            this.confirmationModalOpened = false;
            this.subscriptions = [];

            const listener = this.$scope.$watch(() => this.opened, (newValue, oldValue) => {
                this.reset();
                this.subscriptions.forEach(subscription => subscription.unsubscribe());

                if (oldValue !== true && newValue === true) {
                    this.subscriptions = [
                        this.Users.observe()
                            .filter(items => items !== null)
                            .switchMap(users => Rx.Observable.from(users))
                            .filter(user => user.$id === this.Auth.userUID)
                            .distinctUntilChanged()
                            .subscribe((user) => {
                                this.myFullName = `${user.first_name} ${user.last_name}`;
                            }),

                        this.UserProjectsList.observe()
                            .filter(projects => projects !== null)
                            .switchMap(project => Rx.Observable.from(project))
                            .filter(project => project.user_project_id === this.projectID)
                            .distinctUntilChanged()
                            .subscribe((project) => {
                                this.project = project;
                                this.currentColor = _.cloneDeep(project.color);
                                this.currentStatus = _.cloneDeep(project.completed);
                                this.$scope.$evalAsync();
                            })
                    ];
                }
            }, true);


            this.$scope.$on('$destroy', () => {
                listener();
                this.subscriptions.forEach(subscription => subscription.unsubscribe());
            });
        }


        reset() {
            this.currentColor = null;
            this.currentStatus = null;
            this.myFullName = null;
            this.confirmationModalOpened = false;
        }


        selectColor(colorName: string) {
            this.currentColor = colorName;
        }


        boolToString(argument: boolean) {
            return (argument === true ? 'Completed' : 'Active');
        }


        openConfirmationModal() {
            this.confirmationModalOpened = true;
        }


        closeConfirmationModal() {
            this.confirmationModalOpened = false;
        }


        toggleConfirmationModal() {
            this.confirmationModalOpened = !this.confirmationModalOpened;
        }


        update(project: IUserProjectListItem, selectedStatus: boolean, selectedColor: string) {
            const projectID = project.user_project_id;
            const projectListItemID = project.$id;

            if (project.completed !== selectedStatus) {
                const oldStatus = _.cloneDeep(project.completed);
                const newStatus = !oldStatus;
                const oldPosition = _.cloneDeep(project.position);
                const newPosition = this.UserProjectsList.getListSize(this.Auth.userUID, newStatus);

                this.UserProject.update(projectID, {'completed': newStatus});

                this.UserProjectsList.updateFirebase(this.Auth.userUID, projectListItemID, {
                    'completed': newStatus,
                    'position': newPosition
                }).then(() => {
                    this.UserProjectsList.reorder(this.Auth.userUID, oldStatus, oldPosition);
                });
            }

            if (project.color !== selectedColor) {
                this.UserProject.update(projectID, {'color': selectedColor});
                this.UserProjectsList.updateFirebase(this.Auth.userUID, projectListItemID, {'color': selectedColor});
            }

            this.close();
        }


        removeProject(project: IUserProjectListItem, myFullName: string) {
            const projectID = _.cloneDeep(project.user_project_id);
            const projectSlug = _.cloneDeep(project.project_slug);

            if (_.isString(myFullName) && !_.isEmpty(myFullName)) {
                this.UserProjectsList.remove(this.Auth.userUID, project);

                Rx.Observable.combineLatest(
                    this.UserProjectTasks.observe(this.Auth.userUID, projectID),
                    this.UserProjectSharing.observe(projectID),
                    this.UserTagsList.observe(),
                    (s1, s2, s3) => {
                        return {
                            'tasks': s1, 
                            'sharing_items': s2,
                            'user_tags': s3
                        };
                    }
                )
                .switchMap((data) => {
                    return Rx.Observable.fromPromise(this.getAllTagsForProject(projectID, data.tasks)).map((tagArrays) => {
                        return {
                            'tasks': data.tasks, 
                            'sharing_items': data.sharing_items,
                            'user_tags': data.user_tags,
                            'tag_arrays': tagArrays
                        };
                    });
                })
                .first()
                .subscribe((data) => {
                    // remove entire UserProject tree
                    this.UserProject.remove(projectID);

                    // remove GroupProject for this project
                    const groupProject = this.GroupProjects.find(projectSlug);
                    const newGroupProjectCount = groupProject.count - 1;
                    this.GroupProjects.updateCount(groupProject.$id, newGroupProjectCount);

                    // remove all entries for this project
                    this.Entries.queryOnce('project_slug', projectSlug).then((entries) => {
                        _(entries).forEach(entry => this.Entries.remove(entry));
                    });

                    // remove all GroupTasks and UserTasksListings for this project
                    _(data.tasks)
                        .map(task => task.task_slug)
                        .forEach((taskSlug) => {
                            const groupTask = this.GroupTasks.find(taskSlug);
                            this.GroupTasks.updateCount(groupTask.$id, (groupTask.count - 1));
                            this.UserTasksList.remove(this.Auth.userUID, taskSlug);
                        });

                    // remove all shared users for this project
                    _(data.sharing_items)
                        .forEach((sharingItem) => {
                            this.Sharing.revoke(
                                this.Auth.userUID, 
                                myFullName, 
                                project.project_name, 
                                project.project_slug, 
                                project.user_project_id, 
                                sharingItem, 
                                false, 
                                true
                            );
                        });

                    // remove all GroupTags and UserTagsListings for this project
                    const tagInstances: {[key: string]: number} = {};
                    const tags = _.flatten(data.tag_arrays);

                    tags.filter(tag => tag).map(tag => tag.tag_slug).forEach((tagSlug) => {
                        tagInstances[tagSlug] = (tagInstances[tagSlug] ? tagInstances[tagSlug] + 1 : 1);
                    });

                    _(tagInstances).forOwn((count: number, tagSlug) => {
                        const groupTag = this.GroupTags.find(tagSlug);
                        this.GroupTags.updateCount(groupTag.$id, (groupTag.count - count));

                        const userTag = _(data.user_tags).find(item => item.tag_slug === tagSlug);
                        this.UserTagsList.updateCount(this.Auth.userUID, userTag.$id, (userTag.count - count));
                    });
                });
            }

            this.close();
        }


        private getAllTagsForProject(projectID: string, tasks: Array<IUserProjectTask>) {
            if (tasks) {
                return this.$q.all(tasks.map(task => this.UserProjectTaskTags.getOnceForUserAndTask(this.Auth.userUID, projectID, task.$id)));
            }

            return this.$q.resolve([] as Array<Array<IUserProjectTaskTag>>);
        }
    }

    angular.module('app').directive('tokkEditProject', tokkEditProject);
}