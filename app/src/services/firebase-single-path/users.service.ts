///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  export interface IUpdatedUser {
    joined?: number;
    email?: string;
    admin?: boolean;
    can_invite?: boolean;
    can_access_all_entries?: boolean;
    status?: string;
    invitation_id?: string;
    token?: string;
    first_name?: string;
    last_name?: string;
  }

  export interface IUser {
    $id?: string;
    joined: number;
    email: string;
    admin: boolean;
    can_invite?: boolean;
    can_access_all_entries?: boolean;
    status: "active" | "archived";
    invitation_id?: string;
    token?: string;
    first_name?: string;
    last_name?: string;
  }

  export class Users {
    constructor(
      private $q: ng.IQService,
      private $log: ng.ILogService,
      private Auth: Auth,
      private FirebaseUtils: FirebaseUtils
    ) {}

    ref() {
      return firebase.default.database().ref(`group/${this.Auth.userGroup}/users/`);
    }

    observe() {
      const ref = this.ref();
      return this.FirebaseUtils.arrayStream<IUser>("users", ref).observable;
    }

    updateAdminRole(groupID: string, userUID: string, adminRole: boolean) {
      return new this.$q((resolve, reject) => {
        this.ref()
          .child(userUID)
          .child("admin")
          .set(adminRole)
          .then(resolve)
          .catch((error) => {
            this.$log.error("Error on callback for updateAdminRole() of service Users", error);
            reject(error);
          });
      });
    }

    updateInvitationPermission(groupID: string, userUID: string, invitationPermission: boolean) {
      return new this.$q((resolve, reject) => {
        this.ref()
          .child(userUID)
          .child("can_invite")
          .set(invitationPermission)
          .then(resolve)
          .catch((error) => {
            this.$log.error("Error on callback for updateInvitationPermission() of service Users", error);
            reject(error);
          });
      });
    }

    updateReportPermission(groupID: string, userUID: string, reportPermission: boolean) {
      return new this.$q((resolve, reject) => {
        this.ref()
          .child(userUID)
          .child("can_access_all_entries")
          .set(reportPermission)
          .then(resolve)
          .catch((error) => {
            this.$log.error("Error on callback for updateReportPermission() of service Users", error);
            reject(error);
          });
      });
    }

    updateFirstName(groupID: string, userUID: string, firstName: string) {
      return new this.$q((resolve, reject) => {
        this.ref()
          .child(userUID)
          .child("first_name")
          .set(firstName)
          .then(resolve)
          .catch((error) => {
            this.$log.error("Promise failed for updateFirstName() of service Users", error);
            reject(error);
          });
      });
    }

    updateLastName(groupID: string, userUID: string, lastName: string) {
      return new this.$q((resolve, reject) => {
        this.ref()
          .child(userUID)
          .child("last_name")
          .set(lastName)
          .then(resolve)
          .catch((error) => {
            this.$log.error("Promise failed for updateLastName() of service Users", error);
            reject(error);
          });
      });
    }

    updateEmail(groupID: string, userUID: string, newEmail: string) {
      return new this.$q((resolve, reject) => {
        firebase.default
          .auth()
          .currentUser.updateEmail(newEmail)
          .then(() => {
            return this.ref().child(userUID).child("email").set(newEmail);
          })
          .then(() => {
            resolve();
          })
          .catch((error) => {
            this.$log.error("Error for updateEmail() of service Users", error);
            reject(error);
          });
      });
    }

    updatePassword(email: string, oldPassword: string, newPassword: string) {
      return new this.$q((resolve, reject) => {
        firebase.default
          .auth()
          .currentUser.updatePassword(newPassword)
          .then(() => {
            resolve();
          })
          .catch((error) => {
            this.$log.error("Error for updatePassword() of service Users", error);
            reject(error);
          });
      });
    }

    remove(groupID: string, userUID: string) {
      return new this.$q((resolve, reject) => {
        if (groupID && userUID) {
          this.ref()
            .child(userUID)
            .remove()
            .then(resolve)
            .catch((error) => {
              this.$log.error("Error for remove() of service Users", error);
              reject();
            });
        } else {
          resolve();
        }
      });
    }
  }

  angular.module("app").service("Users", Users);
}
