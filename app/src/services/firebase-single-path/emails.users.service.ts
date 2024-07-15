///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  export class EmailsUsers {
    constructor(private $q: ng.IQService, private $log: ng.ILogService) {}

    getSingleOnce(email: string) {
      return new this.$q((resolve, reject) => {
        const escapedEmail = email.replace(/\./g, ",");

        firebase.default
          .database()
          .ref(`emails_users/${escapedEmail}`)
          .once("value")
          .then((snapshot) => {
            if (snapshot.exists()) {
              resolve(snapshot.val());
            } else {
              resolve(null);
            }
          })
          .catch((error) => {
            this.$log.error("Error for getSingleOnce() of service EmailsUsers", error);
            reject(error);
          });
      });
    }

    add(email: string, userUID: string) {
      return new this.$q((resolve, reject) => {
        const escapedEmail = email.replace(/\./g, ",");

        firebase.default
          .database()
          .ref(`emails_users/${escapedEmail}`)
          .set(userUID, (error) => {
            if (error) {
              this.$log.error("Error for add() of service EmailsUsers", error);
              reject();
            } else {
              resolve();
            }
          });
      });
    }

    remove(email: string) {
      return new this.$q((resolve, reject) => {
        const escapedEmail = email.replace(/\./g, ",");

        firebase.default
          .database()
          .ref(`emails_users/${escapedEmail}`)
          .remove((error) => {
            if (error) {
              this.$log.error("Error on callback for remove() of service EmailsUsers", error);
              reject();
            } else {
              resolve();
            }
          });
      });
    }
  }

  angular.module("app").service("EmailsUsers", EmailsUsers);
}
