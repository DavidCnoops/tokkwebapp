///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';

    const styles = require('tokkNotifications.css');

    function tokkNotifications() {
        return {
            scope: {},
            bindToController: {
                opened: '<',
                close: '&'
            },
            restrict: 'E',
            templateUrl: 'tokkNotifications.template.html',
            controller: NotificationsController,
            controllerAs: 'vm'
        };
    }

    class NotificationsController {
        public styles: any;
        public opened: boolean;
        public close: Function;
        public canRemove: boolean;
        public loading: boolean;
        public notifications: Array<INotification>;
        public subscriptions: Array<Rx.Subscription>;

        constructor(
            private $scope: ng.IScope,
            private Auth: Auth,
            private Notifications: Notifications
        ) {}

        $onInit() {
            this.styles = styles;
            this.canRemove = false;
            this.loading = true;
            this.notifications = null;

            const listener = this.$scope.$watch(() => this.opened, (newValue, oldValue) => {
                // set 'viewed1' of all notifications to true when opening the notifications popover
                if (newValue === true) {
                    _(this.notifications).forEach((notification) => {
                        this.Notifications.update(this.Auth.userUID, notification.$id, {'viewed1': true});
                    });
                }

                // set 'viewed2' of all notifications to true when closing the notifications popover
                if (oldValue === true && newValue === false) {
                    _(this.notifications).forEach((notification) => {
                        this.Notifications.update(this.Auth.userUID, notification.$id, {'viewed2': true});
                    });
                }
            }, true);

            this.subscriptions = [
                this.Notifications.observe().subscribe((notifications) => {
                    this.loading = false;
                    this.notifications = _.orderBy(notifications, [notification => notification.created], ['desc']);
                    this.canRemove = _(notifications).some(notification => !(notification.type === 'projectrequest' && notification.status === 'pending'));

                    this.$scope.$evalAsync();
                })
            ];

            this.$scope.$on('$destroy', () => {
                listener();
                this.subscriptions.forEach(subscription => subscription.unsubscribe()); 
            });
        }


        removeAll(notifications: Array<INotification>) {
            _(notifications).filter((notification) => {
                return !(notification.type === 'projectrequest' && notification.status === 'pending');
            })
            .forEach((notification) => {
                this.Notifications.remove(this.Auth.userUID, notification);
            });
        }
    }

    angular.module('app').directive('tokkNotifications', tokkNotifications);
}