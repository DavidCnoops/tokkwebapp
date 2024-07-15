///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  export interface INotification {
    $id?: string;
    type:
      | "entry"
      | "projectrequest"
      | "projectdeclined"
      | "projectaccepted"
      | "projectrevoked"
      | "taskassigned"
      | "subtaskassigned"
      | "tagassigned"
      | "invitationaccepted";
    sender_uid?: string;
    sender_name?: string;
    sender_project_id?: string;
    project_name?: string;
    project_slug?: string;
    project_color?: string;
    status?: "pending" | "accepted" | "declined";
    task_name?: string;
    task_slug?: string;
    subtask_name?: string;
    subtask_slug?: string;
    tag_name?: string;
    tag_slug?: string;
    entry_ID?: string;
    entry_date?: string;
    invitation_email?: string;
    created?: number;
    viewed1?: boolean;
    viewed2?: boolean;
  }

  export interface IUpdatedNotification {
    type?:
      | "entry"
      | "projectrequest"
      | "projectdeclined"
      | "projectaccepted"
      | "projectrevoked"
      | "taskassigned"
      | "subtaskassigned"
      | "tagassigned"
      | "invitationaccepted";
    sender_uid?: string;
    sender_name?: string;
    sender_project_id?: string;
    project_name?: string;
    project_slug?: string;
    project_color?: string;
    status?: "pending" | "accepted" | "declined";
    task_name?: string;
    task_slug?: string;
    subtask_name?: string;
    subtask_slug?: string;
    tag_name?: string;
    tag_slug?: string;
    entry_ID?: string;
    entry_date?: string;
    invitation_email?: string;
    created?: number;
    viewed1?: boolean;
    viewed2?: boolean;
  }

  export class Notifications {
    constructor(
      private $q: ng.IQService,
      private $log: ng.ILogService,
      private Auth: Auth,
      private FirebaseUtils: FirebaseUtils
    ) {}

    observe() {
      const ref = firebase.default
        .database()
        .ref(`group/${this.Auth.userGroup}/user/${this.Auth.userUID}/notifications/`);
      return this.FirebaseUtils.arrayStream<INotification>("notifications", ref).observable;
    }

    add(userUID: string, meta: INotification) {
      return new this.$q<void>((resolve, reject) => {
        const ref = firebase.default.database().ref(`group/${this.Auth.userGroup}/user/${userUID}/notifications/`);
        const newNotification: INotification = {
          type: meta.type,
          created: <number>firebase.default.database.ServerValue.TIMESTAMP,
          sender_uid: meta.sender_uid,
          sender_name: meta.sender_name,
          sender_project_id: meta.sender_project_id,
          project_name: meta.project_name,
          project_slug: meta.project_slug,
          project_color: meta.project_color,
          status: meta.status,
          task_name: meta.task_name,
          task_slug: meta.task_slug,
          subtask_name: meta.subtask_name,
          subtask_slug: meta.subtask_slug,
          tag_name: meta.tag_name,
          tag_slug: meta.tag_slug,
          entry_ID: meta.entry_ID,
          entry_date: meta.entry_date,
          invitation_email: meta.invitation_email,
          viewed1: false,
          viewed2: false,
        };

        // removed undefined key-values from object before sending it to firebase
        Object.keys(newNotification).forEach((key) => {
          if (_.isUndefined(newNotification[key])) {
            delete newNotification[key];
          }
        });

        ref.push(newNotification, (error) => {
          if (error) {
            this.$log.error("Error for add() of service Notifications", error);
            reject();
          } else {
            resolve();
          }
        });
      });
    }

    query(userUID: string, childName: string, childValue: string | number | boolean) {
      return new this.$q<Array<INotification>>((resolve, reject) => {
        firebase.default
          .database()
          .ref(`group/${this.Auth.userGroup}/user/${userUID}/notifications/`)
          .orderByChild(childName)
          .equalTo(childValue)
          .once("value")
          .then((snapshot) => {
            resolve(this.FirebaseUtils.convertToArray<INotification>(snapshot));
          })
          .catch((error) => {
            this.$log.error("Error for query() of service Notifications", error);
            reject(error);
          });
      });
    }

    remove(userUID: string, notification: INotification) {
      return new this.$q((resolve, reject) => {
        const ref = firebase.default.database().ref(`group/${this.Auth.userGroup}/user/${userUID}/notifications/`);

        ref.child(notification.$id).remove((error) => {
          if (error) {
            this.$log.error("Error for remove() of service Notifications", error);
            reject();
          } else {
            resolve();
          }
        });
      });
    }

    update(userUID: string, notificationID: string, object: IUpdatedNotification) {
      return new this.$q((resolve, reject) => {
        const ref = firebase.default.database().ref(`group/${this.Auth.userGroup}/user/${userUID}/notifications/`);

        ref.child(notificationID).update(object, (error) => {
          if (error) {
            this.$log.error("Error for update() of service Notifications", error);
            reject();
          } else {
            resolve();
          }
        });
      });
    }
  }

  angular.module("app").service("Notifications", Notifications);
}
