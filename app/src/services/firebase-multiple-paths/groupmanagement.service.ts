///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  export class Groupmanagement {
    constructor(private $q: ng.IQService, private $log: ng.ILogService) {}

    removeGroup(groupID: string, userUID: string, email: string, invitations: Array<IGroupInvitation>) {
      return new this.$q<void>((resolve, reject) => {
        const escapedEmail = email.replace(/\./g, ",");

        const data = {};
        data[`emails_users/${escapedEmail}`] = null;
        data[`group/${groupID}/group_meta_data/`] = null;
        data[`group/${groupID}/group_projects/`] = null;
        data[`group/${groupID}/group_tags/`] = null;
        data[`group/${groupID}/group_tasks/`] = null;
        data[`group/${groupID}/user/${userUID}`] = null;
        data[`group/${groupID}/users/`] = null;
        data[`group/${groupID}/billing_information/`] = null;
        data[`group/${groupID}/invoices/`] = null;
        data[`users_groups/${userUID}`] = null;
        data[`subscriptions/${groupID}`] = null;

        _(invitations).forEach((invitation) => {
          const escapedInvitationEmail = invitation.email.replace(/\./g, ",");

          data[`group/${groupID}/invitations/${invitation.$id}`] = null;
          data[`invitation_references/${invitation.token}`] = null;
          data[`emails_invites/${escapedInvitationEmail}`] = null;
        });

        firebase.default
          .database()
          .ref()
          .update(data, (error) => {
            if (error) {
              this.$log.error("Error for removeGroup() of service Groupmanagement", error);
              reject();
            } else {
              resolve();
            }
          });
      });
    }
  }

  angular.module("app").service("Groupmanagement", Groupmanagement);
}
