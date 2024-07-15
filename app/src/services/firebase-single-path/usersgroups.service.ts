///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  export interface IUserGroup {
    group_id: string;
    status: "active" | "archived";
    processed: boolean;
    invitation_id?: string;
    token?: string;
  }

  export class UsersGroups {
    constructor(private $q: ng.IQService, private $log: ng.ILogService, private Utilities: Utilities) {}

    ref(userUID: string) {
      return firebase.default.database().ref(`users_groups/${userUID}/`);
    }

    getGroupForUserOnce(userUID: string): angular.IPromise<string> {
      return new this.$q((resolve, reject) => {
        this.ref(userUID)
          .once("value")
          .then((snapshot) => {
            if (snapshot.exists()) {
              const object: IUserGroup = snapshot.val();
              const groupID = object.group_id;
              const status = object.status;

              if (groupID && status === "active") {
                resolve(groupID);
              } else if (status === "archived") {
                const error = this.Utilities.getError("user-is-archived");
                reject(error);
              } else {
                reject();
              }
            } else {
              const error = this.Utilities.getError("user-not-found");
              reject(error);
            }
          })
          .catch((error) => {
            this.$log.error("Error for getGroupForUserOnce() of service UsersGroups", error);
            reject();
          });
      });
    }

    addEmail(userUID: string, email: string) {
      return new this.$q((resolve, reject) => {
        this.ref(userUID)
          .child(email)
          .set(email)
          .then(resolve)
          .catch((error) => {
            this.$log.error("Error for addEmail() of service UsersGroups", error);
            reject();
          });
      });
    }

    remove(userUID: string) {
      return new this.$q((resolve, reject) => {
        if (userUID) {
          this.ref(userUID)
            .remove()
            .then(resolve)
            .catch((error) => {
              this.$log.error("Error for remove() of service UsersGroups", error);
              reject();
            });
        } else {
          reject();
        }
      });
    }

    removeToken(userUID: string) {
      return new this.$q((resolve, reject) => {
        if (userUID) {
          this.ref(userUID)
            .child("token")
            .remove()
            .then(resolve)
            .catch((error) => {
              this.$log.error("Error for removeToken() of service UsersGroups", error);
              reject();
            });
        } else {
          reject();
        }
      });
    }
  }

  angular.module("app").service("UsersGroups", UsersGroups);
}
