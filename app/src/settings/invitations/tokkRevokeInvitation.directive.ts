///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {

    'use strict';
    
    const styles = require('tokkRevokeInvitation.css');

    function tokkRevokeInvitation() {
        return {
            scope: {},
            bindToController: {
                invitationID: '@invitationid'
            },
            restrict: 'E',
            templateUrl: 'tokkRevokeInvitation.template.html',
            controller: RevokeInvitationController,
            controllerAs: 'vm'
        };
    }

    class RevokeInvitationController {
        public styles: any;
        public invitationID: string;
        public invitation: IGroupInvitation;
        public opened: boolean;
        public subscriptions: Array<Rx.Subscription>;

        constructor(
            private $scope: ng.IScope,
            private GroupInvitations: GroupInvitations,
            private Invitations: Invitations
        ) {}

        $onInit() {
            this.styles = styles;
            this.invitation = null;
            this.opened = false;

            this.subscriptions = [
                this.GroupInvitations.observe()
                    .filter(items => items !== null)
                    .switchMap(invitations => Rx.Observable.from(invitations))
                    .filter(invitation => invitation.$id === this.invitationID)
                    .distinctUntilChanged()
                    .subscribe((invitation) => {
                        this.invitation = invitation;
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


        revoke(invitation: IGroupInvitation) {
            this.Invitations.remove(invitation.$id, invitation.token, invitation.email);
        }
    }

    angular.module('app').directive('tokkRevokeInvitation', tokkRevokeInvitation);
}