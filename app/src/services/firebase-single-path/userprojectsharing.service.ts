///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  export interface IUserProjectSharingItem {
    $id?: string;
    user_uid: string;
    user_project_id: string | false;
    status: "pending" | "sharing";
    added: number;
  }

  export interface IUpdatedUserProjectSharingItem {
    $id: string;
    user_uid?: string;
    user_project_id?: string | false;
    status?: "pending" | "sharing";
    added?: number;
  }

  export class UserProjectSharing {
    constructor(
      private $q: ng.IQService,
      private $log: ng.ILogService,
      private Auth: Auth,
      private FirebaseUtils: FirebaseUtils
    ) {}

    ref(userUID, projectID: string) {
      return firebase.default
        .database()
        .ref(`group/${this.Auth.userGroup}/user/${userUID}/user_projects/${projectID}/sharing/`);
    }

    observe(projectID: string) {
      const ref = this.ref(this.Auth.userUID, projectID);
      return this.FirebaseUtils.arrayStream<IUserProjectSharingItem>("userprojectsharing", ref).observable;
    }

    query(
      userUID: string,
      projectID: string,
      childName: "$id" | "user_uid" | "user_project_id" | "status" | "added",
      childValue: string | number
    ) {
      return new this.$q<IUserProjectSharingItem>((resolve, reject) => {
        this.ref(userUID, projectID)
          .orderByChild(childName)
          .equalTo(childValue)
          .limitToFirst(1)
          .once("value")
          .then((snapshot) => {
            let sharingItem: IUserProjectSharingItem = null;

            snapshot.forEach((childSnapshot) => {
              sharingItem = this.FirebaseUtils.convertToObject<IUserProjectSharingItem>(childSnapshot);
              return true;
            });

            resolve(sharingItem);
          })
          .catch((error) => {
            this.$log.error("Error for query() of service UserProjectSharing", error);
            reject(error);
          });
      });
    }

    getListOnce(userUID: string, projectID: string): angular.IPromise<Array<IUserProjectSharingItem>> {
      return new this.$q((resolve, reject) => {
        this.ref(userUID, projectID)
          .once("value")
          .then((snapshot) => {
            resolve(this.FirebaseUtils.convertToArray<IUserProjectSharingItem>(snapshot));
          })
          .catch((error) => {
            this.$log.error("Error for getListOnce() of service UserProjectSharing", error);
            reject();
          });
      });
    }

    add(userUID: string, projectID: string, object: IUserProjectSharingItem) {
      return new this.$q((resolve, reject) => {
        const { $id, ...newObject } = object;

        this.ref(userUID, projectID)
          .push(newObject)
          .then(resolve, (error) => {
            this.$log.error("Error on callback for add() of service UserProjectSharing", error);
            reject();
          });
      });
    }

    update(userUID: string, projectID: string, object: IUpdatedUserProjectSharingItem) {
      return new this.$q((resolve, reject) => {
        const { $id, ...newObject } = object;

        this.ref(userUID, projectID)
          .child(object.$id)
          .update(newObject)
          .then(resolve)
          .catch((error) => {
            this.$log.error("Error on callback for update() of service UserProjectSharing", error);
            reject();
          });
      });
    }

    removeBySharingItemID(userUID: string, projectID: string, sharingItemID: string) {
      return new this.$q((resolve, reject) => {
        this.ref(userUID, projectID)
          .child(sharingItemID)
          .remove()
          .then(resolve)
          .catch((error) => {
            this.$log.error("Promise failed for removeByID() of service UserProjectSharing", error);
            reject();
          });
      });
    }

    removeByUserUID(userUID: string, projectID: string, sharedUserUID: string) {
      return new this.$q((resolve, reject) => {
        this.query(userUID, projectID, "user_uid", sharedUserUID).then((sharingItem) => {
          if (sharingItem) {
            this.ref(userUID, projectID)
              .child(sharingItem.$id)
              .remove()
              .then(resolve)
              .catch((error) => {
                this.$log.error("Error on callback for removeBySharedUserUID() of service UserProjectSharing", error);
                reject();
              });
          } else {
            resolve();
          }
        });
      });
    }
  }

  angular.module("app").service("UserProjectSharing", UserProjectSharing);
}
