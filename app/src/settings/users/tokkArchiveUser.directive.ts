///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {

    'use strict';
    
    const styles = require('tokkArchiveUser.css');

    function tokkArchiveUser() {
        return {
            scope: {},
            bindToController: {
                userUID: '@useruid'
            },
            restrict: 'E',
            templateUrl: 'tokkArchiveUser.template.html',
            controller: ArchiveUserController,
            controllerAs: 'vm'
        };
    }

    class ArchiveUserController {
        public styles: any;
        public userUID: string;
        public user: IUser;
        public opened: boolean;
        public subscriptions: Array<Rx.Subscription>;

        constructor(
            private $scope: ng.IScope,
            private Auth: Auth,
            private Users: Users,
            private Usermanagement: Usermanagement
        ) {}

        $onInit() {
            this.styles = styles;
            this.user = null;
            this.opened = false;

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


        open(user: IUser) {
            if (!user.admin && user.$id !== this.Auth.userUID) {
                this.opened = true;
            }
        }


        close() {
            this.opened = false;
        }


        archive(user: IUser) {
            if (!user.admin && user.$id !== this.Auth.userUID) {
                this.Usermanagement.updateUserStatus(this.Auth.userGroup, user.$id, 'archived');
                this.close();
            }
        }
    }

    angular.module('app').directive('tokkArchiveUser', tokkArchiveUser);
}