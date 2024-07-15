///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  export interface IInvitationReference {
    $id?: string;
    email: string;
    group_id: string;
    invitation_id: string;
    sender_uid: string;
    processed: boolean;
  }

  export class InvitationReferences {
    constructor(private $q: ng.IQService, private $log: ng.ILogService) {}

    getSingleInvitationOnce(token: string): angular.IPromise<IInvitationReference> {
      return new this.$q((resolve, reject) => {
        firebase.default
          .database()
          .ref(`invitation_references/${token}/`)
          .once("value")
          .then((snapshot) => {
            const invitationReference: IInvitationReference = snapshot.val();

            if (invitationReference) {
              resolve({
                ...invitationReference,
                $id: snapshot.key,
              });
            } else {
              this.$log.error("Invalid snaphot value for getSingleInvitationOnce() of service InvitationReferences");
              reject();
            }
          })
          .catch((error) => {
            this.$log.error("Error for getSingleInvitationOnce() of service InvitationReferences", error);
            reject();
          });
      });
    }
  }

  angular.module("app").service("InvitationReferences", InvitationReferences);
}
