///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {
  "use strict";

  const styles = require("tokkInvitationRedeemer.css");

  function tokkInvitationRedeemer() {
    return {
      scope: {},
      bindToController: {
        invitation: "<",
      },
      restrict: "E",
      templateUrl: "tokkInvitationRedeemer.template.html",
      controller: InvitationRedeemerController,
      controllerAs: "vm",
    };
  }

  class InvitationRedeemerController {
    public styles: any;
    public invitation: IInvitationReference;
    public firstName: string;
    public lastName: string;
    public email: string;
    public password: string;
    public error: IErrorObject;
    public processing: boolean;

    constructor(
      private $element: ng.IRootElementService,
      private $timeout: ng.ITimeoutService,
      private $state: ng.ui.IStateService,
      private Auth: Auth,
      private Invitations: Invitations,
      private Notifications: Notifications,
      private Utilities: Utilities,
      private UsersGroups: UsersGroups
    ) {}

    $onInit() {
      this.styles = styles;
      this.firstName = null;
      this.lastName = null;
      this.email = _.cloneDeep(this.invitation.email);
      this.password = null;
      this.error = null;
      this.processing = false;

      let attempts = 1;
      const removeAutoFill = () => {
        this.$timeout(() => {
          attempts += 1;

          this.firstName = null;
          this.lastName = null;
          this.email = _.cloneDeep(this.invitation.email);
          this.password = null;

          if (attempts < 35) {
            removeAutoFill();
          } else {
            const firstNameInputElement = <HTMLInputElement>(
              this.$element[0].querySelector(`.${this.styles.firstNameInput}`)
            );

            if (firstNameInputElement) {
              firstNameInputElement.focus();
            }
          }
        }, 10);
      };

      removeAutoFill();
    }

    resetError() {
      this.error = null;
    }

    signup(
      firstName: string,
      lastName: string,
      email: string,
      password: string,
      invitation: IInvitationReference
    ) {
      firstName = _.trim(firstName);
      lastName = _.trim(lastName);
      email = _.trim(email);

      this.resetError();

      if (!email) {
        this.error = this.Utilities.getError("no-email");
      } else if (!firstName) {
        this.error = this.Utilities.getError("no-firstname");
      } else if (!lastName) {
        this.error = this.Utilities.getError("no-lastname");
      } else if (!password) {
        this.error = this.Utilities.getError("no-password");
      } else {
        this.processing = true;

        const groupID = invitation.group_id;
        const invitationEmail = invitation.email;
        const invitationID = invitation.invitation_id;
        const token = invitation.$id;
        const senderUID = invitation.sender_uid;

        this.Auth.registerInvitedUser(
          email,
          password,
          firstName,
          lastName,
          groupID,
          invitationID,
          token
        )
          .then((userUID) => {
            this.Notifications.add(senderUID, {
              type: "invitationaccepted",
              sender_name: `${firstName} ${lastName}`,
            });
            this.Invitations.remove(invitationID, token, invitationEmail);
            this.UsersGroups.removeToken(userUID);
            this.$state.go("loggedin.projects");
          })
          .catch((error) => {
            this.processing = false;
            this.error = this.Utilities.getError(error);
          });
      }
    }
  }

  angular
    .module("app")
    .directive("tokkInvitationRedeemer", tokkInvitationRedeemer);
}
