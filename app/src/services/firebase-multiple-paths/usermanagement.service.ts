///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  export class Usermanagement {
    constructor(private $q: ng.IQService, private $log: ng.ILogService) {}

    createGroupAndUser(
      groupID: string,
      userUID: string,
      email: string,
      subscriptionType: "free" | "business",
      firstName: string | boolean = false,
      lastName: string | boolean = false
    ) {
      return new this.$q<void>((resolve, reject) => {
        const data = {};
        const user: IUser = {
          joined: <number>firebase.default.database.ServerValue.TIMESTAMP,
          email: email,
          admin: true,
          can_invite: true,
          can_access_all_entries: true,
          status: "active",
        };

        if (typeof firstName === "string" && firstName.length > 0) {
          user.first_name = firstName;
        }

        if (typeof lastName === "string" && lastName.length > 0) {
          user.last_name = lastName;
        }

        const userGroup: IUserGroup = {
          group_id: groupID,
          status: "active",
          processed: false,
        };

        const subscription: IGroupSubscription = {
          type: subscriptionType,
          status: subscriptionType === "free" ? "active" : "trial",
        };

        if (subscriptionType === "business") {
          subscription.trial_started_on = <number>firebase.default.database.ServerValue.TIMESTAMP;
        }

        data["users_groups/" + userUID] = userGroup;
        data["subscriptions/" + groupID] = subscription;
        data["group/" + groupID + "/users/" + userUID] = user;

        firebase.default
          .database()
          .ref()
          .update(data, (error) => {
            if (error) {
              this.$log.error("Error on callback for createGroupAndUser() of service Usermanagement", error);
              reject();
            } else {
              resolve();
            }
          });
      });
    }

    addInvitedUserToExistingGroup(
      groupID: string,
      userUID: string,
      email: string,
      firstName: string,
      lastName: string,
      invitationID: string,
      token: string
    ) {
      return new this.$q<void>((resolve, reject) => {
        const data = {};
        const user: IUser = {
          joined: <number>firebase.default.database.ServerValue.TIMESTAMP,
          email: email,
          admin: false,
          can_invite: true,
          can_access_all_entries: false,
          status: "active",
          first_name: firstName,
          last_name: lastName,
          invitation_id: invitationID,
          token: token,
        };

        const userGroup: IUserGroup = {
          group_id: groupID,
          status: "active",
          processed: false,
          invitation_id: invitationID,
          token: token,
        };

        data["users_groups/" + userUID] = userGroup;
        data["group/" + groupID + "/users/" + userUID] = user;

        firebase.default
          .database()
          .ref()
          .update(data, (error) => {
            if (error) {
              this.$log.error("Error on callback for addInvitedUserToExistingGroup() of service Usermanagement", error);
              reject();
            } else {
              resolve();
            }
          });
      });
    }

    updateUserStatus(groupID: string, userUID: string, status: "active" | "archived") {
      return new this.$q<void>((resolve, reject) => {
        const data = {};
        const updatedUsergroup: IUserGroup = {
          group_id: groupID,
          status: status,
          processed: false,
        };

        data["group/" + groupID + "/users/" + userUID + "/status/"] = status;
        data["users_groups/" + userUID] = updatedUsergroup;

        firebase.default
          .database()
          .ref()
          .update(data, (error) => {
            if (error) {
              this.$log.error("Error on callback for updateUserStatus() of service Usermanagement", error);
              reject();
            } else {
              resolve();
            }
          });
      });
    }

    removeUser(groupID: string, userUID: string, email: string) {
      return new this.$q<void>((resolve, reject) => {
        const data = {};
        const escapedEmail = email.replace(/\./g, ",");

        data["group/" + groupID + "/user/" + userUID] = null;
        data["group/" + groupID + "/users/" + userUID] = null;
        data["emails_users/" + escapedEmail] = null;
        data["users_groups/" + userUID] = null;

        firebase.default
          .database()
          .ref()
          .update(data, (error) => {
            if (error) {
              this.$log.error("Error for removeUserFromTokk() of service Usermanagement", error);
              reject();
            } else {
              resolve();
            }
          });
      });
    }
  }

  angular.module("app").service("Usermanagement", Usermanagement);
}
