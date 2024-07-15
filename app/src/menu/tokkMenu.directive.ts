///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';
    
    const styles = require('tokkMenu.css');

    function tokkMenu() {
        return {
            scope: {},
            bindToController: {},
            restrict: 'E',
            templateUrl: 'tokkMenu.template.html',
            controller: MenuController,
            controllerAs: 'vm'
        };
    }

    class MenuController {
        public styles: any;
        public loaded: boolean;
        public notificationsOpened: boolean;
        public unviewedNotificationsCount: number;
        public subscriptionType: 'free' | 'business';
        public subscriptions: Array<Rx.Subscription>;

        constructor(
            private $scope: ng.IScope,
            private Auth: Auth,
            private Notifications: Notifications,
            private GroupSubscription: GroupSubscription
        ) {}

        $onInit() {
            this.styles = styles;
            this.loaded = false;
            this.notificationsOpened = false;
            this.unviewedNotificationsCount = null;
            this.subscriptionType = null;
            this.subscriptions = [
                Rx.Observable.combineLatest(
                    this.Notifications.observe(),
                    this.GroupSubscription.observe(this.Auth.userGroup)
                ).subscribe(([notifications, subscription]) => {    
                    this.loaded = true;              
                    this.unviewedNotificationsCount = (notifications ? notifications.filter(notification => !notification.viewed1).length : 0);
                    this.subscriptionType = subscription.type;
                    this.$scope.$evalAsync();
                })
            ];
        }

        $onDestroy() {
            this.subscriptions.forEach(subscription => subscription.unsubscribe());
        }

        toggleNotifications() {
            this.notificationsOpened = !this.notificationsOpened;
        }

        closeNotifications() {
            this.notificationsOpened = false;
        }
    }

    angular.module('app').directive('tokkMenu', tokkMenu);
}