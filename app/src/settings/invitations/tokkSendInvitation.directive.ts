///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {

    'use strict';

    const styles = require('tokkSendInvitation.css');

    function tokkSendInvitation() {
        return {
            scope: {},
            bindToController: {},
            restrict: 'E',
            templateUrl: 'tokkSendInvitation.template.html',
            controller: SendInvitationController,
            controllerAs: 'vm'
        };
    }

    class SendInvitationController {
        public styles: any;
        public email: string;
        public success: boolean;
        public successMessage: string;
        public error: IErrorObject;
        public processing: boolean;
        public canInvite: boolean;
        public loaded: boolean;
        public users: Array<IUser>;
        public invitations: Array<IGroupInvitation>;
        public subscriptions: Array<Rx.Subscription>;

        constructor(
            private $scope: ng.IScope,
            private $timeout: ng.ITimeoutService,
            private Auth: Auth,
            private Users: Users,
            private EmailsUsers: EmailsUsers,
            private EmailsInvites: EmailsInvites,
            private GroupInvitations: GroupInvitations,
            private Invitations: Invitations,
            private Utilities: Utilities
        ) {}

        $onInit() {
            this.styles = styles;
            this.email = null;
            this.success = false;
            this.successMessage = null;
            this.error = null;
            this.processing = false;
            this.canInvite = null;
            this.loaded = false;
            this.invitations = null;

            this.subscriptions = [
                Rx.Observable.combineLatest(
                    this.GroupInvitations.observe(),

                    this.Users.observe()
                        .do(users => this.users = users)
                        .filter(items => items !== null)
                        .switchMap(users => Rx.Observable.from(users))
                        .filter(user => user.$id === this.Auth.userUID)
                        .distinctUntilChanged(),

                    (s1, s2) => {
                        return {
                            'invitations': s1, 
                            'user': s2
                        };
                    }
                ).subscribe((data) => {
                    this.loaded = true;
                    this.invitations = data.invitations;
                    this.canInvite = data.user.can_invite;
                    this.$scope.$evalAsync();
                })
            ];

            this.$scope.$on('$destroy', () => {
                this.subscriptions.forEach(subscription => subscription.unsubscribe());
            });
        }


        resetEmail() {
            this.email = null;
        }


        resetError() {
            this.error = null;
        }


        resetSuccess() {
            this.success = null;
        }


        sendInvitation(invitations: Array<IGroupInvitation>, users: Array<IUser>, email: string, canInvite: boolean, processing) {
            if (!processing) {
                email = _.trim(email);
                const invitationCount = (_.isArray(invitations) ? invitations.length : 0);

                this.resetError();
                this.resetSuccess();

                if (!canInvite) {
                    this.error = this.Utilities.getError('no-invite-permission');
                }
                else if (!email) {
                    this.error = this.Utilities.getError('no-email');
                }
                else if (!this.Utilities.isValidEmail(email)) {
                    this.error = this.Utilities.getError('invalid-email');
                }
                else if (invitationCount >= 100) {
                    this.error = this.Utilities.getError('invitation-limit-reached');
                }
                else {
                    this.processing = true;

                    this.Utilities.checkAllEmails(this.EmailsUsers, this.EmailsInvites, this.email).then(() => {
                        return this.Invitations.add(email);
                    })
                    .then((invitationID) => {
                        this.processing = false;
                        this.success = true;
                        this.successMessage = `Successfully sent invitation to ${email}`;
                        this.$timeout(() => this.success = false, 6000);

                        this.resetEmail();

                        this.EmailsInvites.add(email, {
                            'group_id': this.Auth.userGroup,
                            'invitation_id': invitationID
                        });

                        this.$scope.$evalAsync();
                    })
                    .catch((error) => {
                        this.processing = false;
                        this.error = this.Utilities.getError(error);
                        this.$scope.$evalAsync();
                    });
                }
            }
        }
    }

    angular.module('app').directive('tokkSendInvitation', tokkSendInvitation);
}