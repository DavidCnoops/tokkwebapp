///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {

    'use strict';

    const styles = require('tokkUnarchiveUser.css');

    function tokkUnarchiveUser() {
        return {
            scope: {},
            bindToController: {
                userUID: '@useruid'
            },
            restrict: 'E',
            templateUrl: 'tokkUnarchiveUser.template.html',
            controller: ArchiveUserController,
            controllerAs: 'vm'
        };
    }

    class ArchiveUserController {
        public styles: any;
        public userUID: string;
        public user: IUser;
        public opened: boolean;
        public uniqueID: string;
        public subscriptions: Array<Rx.Subscription>;

        constructor(
            private $scope: ng.IScope,
            private Auth: Auth,
            private Users: Users,
            private Usermanagement: Usermanagement,
            private Utilities: Utilities
        ) {}

        $onInit() {
            this.styles = styles;
            this.user = null;
            this.opened = false;
            this.uniqueID = this.Utilities.generateUUID();

            this.subscriptions = [
                this.Users.observe()
                    .filter(items => items !== null)
                    .switchMap(users => Rx.Observable.from(users))
                    .filter(user => user.$id === this.userUID)
                    .distinctUntilChanged()
                    .subscribe((user) => {
                        this.user = user;
                        this.$scope.$evalAsync();
                    })
            ];

            this.$scope.$on('$destroy', () => {
                this.subscriptions.forEach(subscription => subscription.unsubscribe());
            });
        }


        open() {
            this.opened = true;
        }


        close() {
            this.opened = false;
        }


        unarchive(userUID: string) {
           this.Usermanagement.updateUserStatus(this.Auth.userGroup, userUID, 'active');
           this.close();
        }
    }

    angular.module('app').directive('tokkUnarchiveUser', tokkUnarchiveUser);
}