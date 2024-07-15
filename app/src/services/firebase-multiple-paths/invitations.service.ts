///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  export class Invitations {
    constructor(
      private $q: ng.IQService,
      private $log: ng.ILogService,
      private Auth: Auth,
      private Utilities: Utilities
    ) {}

    add(email: string) {
      return new this.$q<string>((resolve, reject) => {
        const data = {};
        const senderUID = this.Auth.userUID;
        const groupID = this.Auth.userGroup;
        const token = this.Utilities.generateUUID();
        const invitationID = this.Utilities.generateFirebaseUUID();

        const groupInvitation: IGroupInvitation = {
          added: <number>firebase.default.database.ServerValue.TIMESTAMP,
          email: email,
          token: token,
          sender_uid: senderUID,
        };

        const invitationReference: IInvitationReference = {
          email: email,
          group_id: groupID,
          invitation_id: invitationID,
          sender_uid: senderUID,
          processed: false,
        };

        data[`group/${groupID}/invitations/${invitationID}`] = groupInvitation;
        data[`invitation_references/${token}`] = invitationReference;

        firebase.default
          .database()
          .ref()
          .update(data)
          .then(() => {
            resolve(invitationID);
          })
          .catch((error) => {
            this.$log.error("Error for add() of service Invitations", error);
            reject();
          });
      });
    }

    remove(invitationID: string, token: string, email: string) {
      return new this.$q<void>((resolve, reject) => {
        const data = {};
        const escapedEmail = email.replace(/\./g, ",");

        data[`group/${this.Auth.userGroup}/invitations/${invitationID}`] = null;
        data[`invitation_references/${token}`] = null;
        data[`emails_invites/${escapedEmail}`] = null;

        firebase.default
          .database()
          .ref()
          .update(data)
          .then(resolve)
          .catch((error) => {
            this.$log.error("Error for remove() of service Invitations", error);
            reject();
          });
      });
    }

    removeMultiple(groupID: string, invitations: Array<IGroupInvitation>) {
      return new this.$q<void>((resolve, reject) => {
        const data = {};

        _(invitations).forEach((invitation) => {
          data[`group/${groupID}/invitations/${invitation.$id}`] = null;
          data[`invitation_references/${invitation.token}`] = null;
          data[`emails_invites/${invitation.email.replace(/\./g, ",")}`] = null;
        });

        firebase.default
          .database()
          .ref()
          .update(data)
          .then(resolve)
          .catch((error) => {
            this.$log.error("Error for removeMultiple() of service Invitations", error);
            reject();
          });
      });
    }
  }

  angular.module("app").service("Invitations", Invitations);
}
