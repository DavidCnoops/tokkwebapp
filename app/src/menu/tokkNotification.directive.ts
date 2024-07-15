///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';
    
    const styles = require('tokkNotification.css');

    function tokkNotification() {
        return {
            scope: {},
            bindToController: {
                notificationID: '@notificationid'
            },
            restrict: 'E',
            templateUrl: 'tokkNotification.template.html',
            controller: NotificationController,
            controllerAs: 'vm'
        };
    }

    class NotificationController {
        public styles: any;
        public notificationID: string;
        public notification: INotification;
        public timeAgo: string;
        public project: IUserProjectListItem;
        public activeProjectsCount: number;
        public color: string;
        public myFullName: string;
        public processingAccepted: boolean;
        public processingDeclined: boolean;
        public subscriptions: Array<Rx.Subscription>;

        constructor(
            private $scope: ng.IScope,
            private Auth: Auth,
            private Colors: Colors,
            private Today: Today,
            private Users: Users,
            private Sharing: Sharing,
            private Notifications: Notifications,
            private UserProjectsList: UserProjectsList
        ) {}

        $onInit() {
            this.styles = styles;
            this.notification = null;
            this.project = null;
            this.activeProjectsCount = null;
            this.color = null;
            this.timeAgo = null;
            this.myFullName = null;
            this.processingAccepted = false;
            this.processingDeclined = false;
            this.subscriptions = [
                Rx.Observable.combineLatest(
                    this.UserProjectsList.observe(),

                    this.Notifications.observe()
                        .filter(notifications => _.isArray(notifications) && !_.isEmpty(notifications))
                        .switchMap(notifications => Rx.Observable.from(notifications))
                        .filter(notification => notification.$id === this.notificationID)
                        .distinctUntilChanged(),

                    this.Users.observe()
                        .filter(users => _.isArray(users) && !_.isEmpty(users))
                        .switchMap(users => Rx.Observable.from(users))
                        .filter(user => user.$id === this.Auth.userUID)
                        .distinctUntilChanged()
                ).subscribe(([projects, notification, user]) => {
                    this.notification = notification;
                    this.timeAgo = moment(notification.created).tz(this.Today.timezone).fromNow();
                    this.timeAgo = this.timeAgo.charAt(0).toUpperCase() + this.timeAgo.slice(1);
                    this.project = _(projects).find(project => project.project_slug === notification.project_slug);
                    this.activeProjectsCount = _(projects).filter(project => !project.completed).size();
                    this.color = this.getProjectColor(notification, projects);
                    this.myFullName = `${user.first_name} ${user.last_name}`;

                    this.$scope.$evalAsync();
                })
            ];
        }

        $onDestroy() {
            this.subscriptions.forEach(subscription => subscription.unsubscribe());
        }

        getProjectColor(notification: INotification, projects: Array<IUserProjectListItem>) {
            let colorName: string = null;

            if (notification && notification.project_slug) {
                const project = _(projects).find(project => project.project_slug === notification.project_slug);
                colorName = (project ? project.color : null);

                if (!colorName && notification.type === 'projectrequest' && notification.project_color) {
                    colorName = notification.project_color;
                }
            }

            return (colorName ? this.Colors.list[colorName] : '#000');
        }

        acceptProject(notification: INotification, myFullName: string, activeProjectsCount: number) {
            this.processingAccepted = true;

            this.Sharing.acceptProject(notification, myFullName, activeProjectsCount).then(() => {
                this.processingAccepted = false;
            });
        }

        declineProject(notification: INotification, myFullName: string, project: IUserProjectListItem) {
            this.processingDeclined = true;

            this.Sharing.declineProject(notification, myFullName, project).then(() => {
                this.processingDeclined = false;
            });
        }

        removeNotification(notification: INotification) {
            this.Notifications.remove(this.Auth.userUID, notification);
        }
    }

    angular.module('app').directive('tokkNotification', tokkNotification);
}