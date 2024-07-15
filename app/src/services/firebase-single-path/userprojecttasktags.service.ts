///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  export interface IUserProjectTaskTag {
    $id?: string;
    tag_name: string;
    tag_slug: string;
    tag_added?: number;
  }

  export class UserProjectTaskTags {
    constructor(
      private $q: ng.IQService,
      private $log: ng.ILogService,
      private Auth: Auth,
      private FirebaseUtils: FirebaseUtils
    ) {}

    ref(userUID: string, projectID: string, taskID: string) {
      return firebase.default
        .database()
        .ref(`group/${this.Auth.userGroup}/user/${userUID}/user_projects/${projectID}/tags/${taskID}/`);
    }

    observe(userUID: string, projectID: string, taskID: string) {
      const ref = this.ref(userUID, projectID, taskID);
      return this.FirebaseUtils.arrayStream<IUserProjectTaskTag>("userprojecttasktags", ref).observable;
    }

    getOnceForUserAndTask(
      userUID: string,
      projectID: string,
      taskID: string
    ): angular.IPromise<Array<IUserProjectTaskTag>> {
      return new this.$q((resolve, reject) => {
        this.ref(this.Auth.userGroup, projectID, taskID)
          .once("value")
          .then((snapshot) => {
            resolve(this.FirebaseUtils.convertToArray(snapshot));
          })
          .catch((error) => {
            this.$log.error("Error for getOnceForUserAndTask() of service UserProjectTaskTags", error);
            reject(error);
          });
      });
    }

    remove(userUID: string, projectID: string, taskID: string, tagID: string) {
      return new this.$q((resolve, reject) => {
        this.ref(this.Auth.userGroup, projectID, taskID)
          .child(tagID)
          .remove()
          .then(resolve)
          .catch((error) => {
            this.$log.error("Error on callback for remove() of service UserProjectTaskTags", error);
            reject();
          });
      });
    }
  }

  angular.module("app").service("UserProjectTaskTags", UserProjectTaskTags);
}
