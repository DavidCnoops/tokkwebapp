///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {

    'use strict';

    const styles = require('tokkUserPermissions.css');

    function tokkUserPermissions() {
        return {
            scope: {},
            bindToController: {
                userUID: '@useruid'
            },
            restrict: 'E',
            templateUrl: 'tokkUserPermissions.template.html',
            controller: UserPermissionsController,
            controllerAs: 'vm'
        };
    }

    class UserPermissionsController {
        public styles: any;
        public userUID: string;
        public user: IUser;
        public modalOpened: boolean;
        public subscriptions: Array<Rx.Subscription>;

        constructor(
            private $scope: ng.IScope,
            private $q: ng.IQService,
            private Auth: Auth,
            private Users: Users
        ) {}

        $onInit() {
            this.styles = styles;
            this.modalOpened = false;
            this.user = null;

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


        openModal() {
            this.modalOpened = true;
        }


        closeModal() {
            this.modalOpened = false;
        }


        toggleAdminRole(user: IUser) {
            if (user.$id !== this.Auth.userUID) {
                const newIsUserAdmin = !user.admin;
                const promises = [this.Users.updateAdminRole(this.Auth.userGroup, user.$id, newIsUserAdmin)];

                if (newIsUserAdmin === true) {
                    promises.push(
                        this.Users.updateInvitationPermission(this.Auth.userGroup, user.$id, true),
                        this.Users.updateReportPermission(this.Auth.userGroup, user.$id, true)
                    );
                }

                this.$q.all(promises);
            }
        }


        toggleInvitationPermission(user: IUser) {
            if (!user.admin) {
                this.Users.updateInvitationPermission(this.Auth.userGroup, user.$id, !user.can_invite);
            }
        }


        toggleReportPermission(user: IUser) {
            if (!user.admin) {
                this.Users.updateReportPermission(this.Auth.userGroup, user.$id, !user.can_access_all_entries);
            }
        }
    }

    angular.module('app').directive('tokkUserPermissions', tokkUserPermissions);
}