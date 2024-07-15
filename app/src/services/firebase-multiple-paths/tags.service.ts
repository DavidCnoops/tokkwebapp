///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  export class Tags {
    constructor(
      private $q: ng.IQService,
      private $log: ng.ILogService,
      private Utilities: Utilities,
      private Auth: Auth
    ) {}

    add(
      userUID: string,
      projectID: string,
      taskID: string,
      tagName: string,
      tagSlug: string,
      groupTagID: string,
      groupTagCount: number
    ) {
      return new this.$q((resolve, reject) => {
        const data = {};
        const groupID = this.Auth.userGroup;
        const tagID = this.Utilities.generateFirebaseUUID();
        const tag: IUserProjectTaskTag = {
          tag_name: tagName,
          tag_slug: tagSlug,
          tag_added: <number>firebase.default.database.ServerValue.TIMESTAMP,
        };

        data[`group/${groupID}/user/${userUID}/user_projects/${projectID}/tags/${taskID}/${tagID}`] = tag;

        if (groupTagID && groupTagCount > 0) {
          data[`group/${groupID}/group_tags/${groupTagID}/count`] = groupTagCount + 1;
        } else {
          const groupTagID = this.Utilities.generateFirebaseUUID();
          const newGroupTag: IGroupTag = {
            tag_name: tagName,
            tag_slug: tagSlug,
            count: 1,
          };

          data[`group/${groupID}/group_tags/${groupTagID}/`] = newGroupTag;
        }

        firebase.default
          .database()
          .ref()
          .update(data, (error) => {
            if (error) {
              this.$log.error("Error for add() of service Tags", error);
              reject();
            } else {
              resolve();
            }
          });
      });
    }
  }

  angular.module("app").service("Tags", Tags);
}
