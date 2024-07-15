///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  export interface IEmailInvite {
    group_id: string;
    invitation_id: string;
  }

  export class EmailsInvites {
    constructor(private $q: ng.IQService, private $log: ng.ILogService) {}

    getSingleOnce(email: string) {
      return new this.$q((resolve, reject) => {
        const escapedEmail = email.replace(/\./g, ",");

        firebase.default
          .database()
          .ref(`emails_invites/${escapedEmail}`)
          .once("value")
          .then((snapshot) => {
            if (snapshot.exists()) {
              resolve(snapshot.val());
            } else {
              resolve(null);
            }
          })
          .catch((error) => {
            this.$log.error("Error for getSingleOnce() of service EmailsInvites", error);
            reject(error);
          });
      });
    }

    add(email: string, object: IEmailInvite) {
      return new this.$q((resolve, reject) => {
        const escapedEmail = email.replace(/\./g, ",");

        firebase.default
          .database()
          .ref(`emails_invites/${escapedEmail}`)
          .set(object, (error) => {
            if (error) {
              this.$log.error("Error for add() of service EmailsInvites", error);
              reject();
            } else {
              resolve();
            }
          });
      });
    }
  }

  angular.module("app").service("EmailsInvites", EmailsInvites);
}
