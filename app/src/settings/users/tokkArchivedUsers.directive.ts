///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {

    'use strict';

    const styles = require('tokkArchivedUsers.css');

    function tokkArchivedUsers() {
        return {
            scope: {},
            bindToController: {},
            restrict: 'E',
            templateUrl: 'tokkArchivedUsers.template.html',
            controller: ArchivedUsersController,
            controllerAs: 'vm'
        };
    }

    class ArchivedUsersController {
        public styles: any;
        public loaded: boolean;
        public me: IUser;
        public archivedUsers: Array<IUser>;
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
            this.archivedUsers = null;

            this.subscriptions = [
                this.Users.observe().subscribe((users) => {
                    this.loaded = true;
                    this.me = _(users).find(user => user.$id === this.Auth.userUID);
                    this.archivedUsers = _(users).filter(user => user.status === 'archived').value();
                    this.$scope.$evalAsync();
                })
            ];

            this.$scope.$on('$destroy', () => {
                this.subscriptions.forEach(subscription => subscription.unsubscribe());
            });
        }
    }

    angular.module('app').directive('tokkArchivedUsers', tokkArchivedUsers);
}