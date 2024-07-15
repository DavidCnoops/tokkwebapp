///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {

    'use strict';

    const styles = require('tokkActiveUsers.css');

    function tokkActiveUsers() {
        return {
            scope: {},
            bindToController: {},
            restrict: 'E',
            templateUrl: 'tokkActiveUsers.template.html',
            controller: ActiveUsersController,
            controllerAs: 'vm'
        };
    }

    class ActiveUsersController {
        public styles: any;
        public loaded: boolean;
        public me: IUser;
        public activeUsers: Array<IUser>;
        public subscriptions: Array<Rx.Subscription>;

        constructor(
            private $scope: ng.IScope,
            private Auth: Auth,
            private Users: Users
        ) {}

        $onInit() {
            this.styles = styles;
            this.loaded = false;
            this.me = null;
            this.activeUsers = null;

            this.subscriptions = [
                this.Users.observe().subscribe((users) => {
                    this.loaded = true;
                    this.me = _(users).find(user => user.$id === this.Auth.userUID);
                    this.activeUsers = _(users).filter(user => user.status === 'active').value();
                    this.$scope.$evalAsync();
                })
            ];

            this.$scope.$on('$destroy', () => {
                this.subscriptions.forEach(subscription => subscription.unsubscribe());
            });
        }
    }

    angular.module('app').directive('tokkActiveUsers', tokkActiveUsers);
}