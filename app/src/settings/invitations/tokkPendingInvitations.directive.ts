///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {

    'use strict';

    const styles = require('tokkPendingInvitations.css');

    function tokkPendingInvitations() {
        return {
            scope: {},
            bindToController: {},
            restrict: 'E',
            templateUrl: 'tokkPendingInvitations.template.html',
            controller: PendingInvitationsController,
            controllerAs: 'vm'
        };
    }

    class PendingInvitationsController {
        public styles: any;
        public loaded: boolean;
        public user: IUser;
        public invitations: Array<IGroupInvitation>;
        public subscriptions: Array<Rx.Subscription>;

        constructor(
            private $scope: ng.IScope,
            private Auth: Auth,
            private Users: Users,
            private GroupInvitations: GroupInvitations
        ) {}

        $onInit() {
            this.styles = styles;
            this.loaded = false;
            this.user = null;
            this.invitations = null;

            this.subscriptions = [
                Rx.Observable.combineLatest(
                    this.Users.observe()
                        .filter(items => items !== null)
                        .switchMap(users => Rx.Observable.from(users))
                        .filter(user => user.$id === this.Auth.userUID)
                        .distinctUntilChanged(),

                    this.GroupInvitations.observe(),

                    (s1, s2) => {
                        return {
                            'user': s1,
                            'invitations': s2
                        };
                    }
                ).subscribe((data) => {
                    this.loaded = true;
                    this.user = data.user;
                    this.invitations = _(data.invitations).sortBy(item => item.added).value();
                    this.$scope.$evalAsync();
                })
            ];

            this.$scope.$on('$destroy', () => {
                this.subscriptions.forEach(subscription => subscription.unsubscribe());
            });
        }


        getDate(timestamp: number) {
            return moment(timestamp).format('MMM D, YYYY');
        }
    }

    angular.module('app').directive('tokkPendingInvitations', tokkPendingInvitations);
}