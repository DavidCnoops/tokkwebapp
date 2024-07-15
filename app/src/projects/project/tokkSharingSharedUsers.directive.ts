///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {

    'use strict';

    const styles = require('tokkSharingSharedUsers.css');

    function tokkSharingSharedUsers() {
        return {
            scope: {},
            bindToController: {
                projectID: '<projectid'
            },
            restrict: 'E',
            templateUrl: 'tokkSharingSharedUsers.template.html',
            controller: SharingSharedUsersController,
            controllerAs: 'vm'
        };
    }

    export class SharingSharedUsersController {
        public styles: any;
        public projectID: string;
        public project: IUserProjectListItem;
        public activeUsersCount: number;
        public canInvite: boolean;
        public sharedUsers: Array<{'user': IUser, 'sharing_item': IUserProjectSharingItem}>;
        public notifications: Array<INotification>;
        public myFullName: string;
        public activeProjectsCount: number;
        public subscriptions: Array<Rx.Subscription>;

        constructor(
            private $scope: ng.IScope,
            private $state: ng.ui.IStateService,
            private Auth: Auth,
            private Sharing: Sharing,
            private Users: Users,
            private Notifications: Notifications,
            private UserProjectsList: UserProjectsList,
            private UserProjectSharing: UserProjectSharing
        ) {}

        $onInit() {
            this.styles = styles;
            this.project = null;
            this.activeUsersCount = null;
            this.canInvite = false;
            this.sharedUsers = null;
            this.notifications = null;
            this.myFullName = null;
            this.activeProjectsCount = null;

            this.subscriptions = [
                Rx.Observable.combineLatest(
                    this.UserProjectSharing.observe(this.projectID),

                    this.UserProjectsList.observe()
                        .do(projects => this.activeProjectsCount = (projects ? projects.filter(project => !project.completed).length : 0))
                        .filter(items => items !== null)
                        .switchMap(projects => Rx.Observable.from(projects))
                        .filter(project => project.user_project_id === this.projectID)
                        .distinctUntilChanged(),

                    this.Users.observe()
                        .filter(items => items !== null),

                    this.Notifications.observe(),

                    (s1, s2, s3, s4) => {
                        return {
                            'sharing_items': s1, 
                            'project': s2, 
                            'users': s3,
                            'notifications': s4
                        };
                    }
                ).subscribe((data) => {
                    const me = _(data.users).find(user => user.$id === this.Auth.userUID);

                    this.myFullName = `${me.first_name} ${me.last_name}`;
                    this.project = data.project;
                    this.notifications = data.notifications;
                    this.canInvite = me.can_invite;
                    this.activeUsersCount = data.users.filter(user => user.status === 'active').length;
                    this.sharedUsers = _(data.sharing_items).map((sharingItem) => {
                        return {
                            'user': _(data.users).find(user => user.$id === sharingItem.user_uid), 
                            'sharing_item': sharingItem,
                            'is_pending_receiver': _(data.notifications).some((notification: INotification) => {
                                // check if the user is the receiver of the sharing request
                                // if so, show 'accept' and 'decline' buttons when the request is pending
                                // otherwise, show 'revoke' button
                                return notification.sender_uid === sharingItem.user_uid && 
                                       notification.project_slug === data.project.project_slug &&
                                       notification.type === 'projectrequest' &&
                                       notification.status === 'pending';
                            })
                        };
                    })
                    .sortBy(item => item.user.first_name)
                    .value();

                    this.$scope.$evalAsync();
                })
            ];

            this.$scope.$on('$destroy', () => {
                this.subscriptions.forEach(subscription => subscription.unsubscribe());
            });
        }


        goToInvitationsPage() {
            this.$state.go('loggedin.settings.invitations');
        }


        acceptProject(myFullName: string, project: IUserProjectListItem, activeProjectsCount: number, notifications: Array<INotification>) {
            const notification = _(notifications).find((notification) => {
                return notification.project_slug === project.project_slug &&
                       notification.type === 'projectrequest' &&
                       notification.status === 'pending';
            });

            this.Sharing.acceptProject(notification, myFullName, activeProjectsCount);
        }


        declineProject(myFullName: string, project: IUserProjectListItem, notifications: Array<INotification>) {
            const notification = _(notifications).find((notification) => {
                return notification.project_slug === project.project_slug &&
                       notification.type === 'projectrequest' &&
                       notification.status === 'pending';
            });

            this.Sharing.declineProject(notification, myFullName, project);
        }


        revoke(myFullName: string, project: IUserProjectListItem, sharingItem: IUserProjectSharingItem) {
            const userUID = this.Auth.userUID;
            const fullName = myFullName;
            const projectName = project.project_name;
            const projectSlug = project.project_slug;
            const projectID = project.user_project_id;

            this.Sharing.revoke(userUID, fullName, projectName, projectSlug, projectID, sharingItem, true, true);
        }
    }

    angular.module('app').directive('tokkSharingSharedUsers', tokkSharingSharedUsers);
}