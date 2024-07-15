///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  export class Projects {
    constructor(private $q: ng.IQService, private $log: ng.ILogService, private Utilities: Utilities) {}

    add(
      groupID: string,
      userUID: string,
      projectName: string,
      projectSlug: string,
      projectColor: string,
      projectListItemPosition: number,
      groupProjectID: string,
      groupProjectCount: number
    ): angular.IPromise<string> {
      return new this.$q((resolve, reject) => {
        const data = {};
        const projectID: string = this.Utilities.generateFirebaseUUID();
        const projectListItemID: string = this.Utilities.generateFirebaseUUID();

        const newUserProject: IUserProject = {
          project_name: projectName,
          project_slug: projectSlug,
          added: <number>firebase.default.database.ServerValue.TIMESTAMP,
          color: projectColor,
          completed: false,
        };

        const newUserProjectsListItem: IUserProjectListItem = {
          project_name: projectName,
          project_slug: projectSlug,
          added: <number>firebase.default.database.ServerValue.TIMESTAMP,
          color: projectColor,
          completed: false,
          user_project_id: projectID,
          position: projectListItemPosition,
        };

        data[`group/${groupID}/user/${userUID}/user_projects/${projectID}/details/`] = newUserProject;
        data[`group/${groupID}/user/${userUID}/user_projects_list/${projectListItemID}`] = newUserProjectsListItem;

        if (groupProjectID && groupProjectCount > 0) {
          data[`group/${groupID}/group_projects/${groupProjectID}/count`] = groupProjectCount + 1;
        } else {
          const groupProjectID: string = this.Utilities.generateFirebaseUUID();
          const newGroupProject: IGroupProject = {
            project_name: projectName,
            project_slug: projectSlug,
            count: 1,
          };

          data[`group/${groupID}/group_projects/${groupProjectID}/`] = newGroupProject;
        }

        firebase.default
          .database()
          .ref()
          .update(data, (error) => {
            if (error) {
              this.$log.error("Error on callback for add() of service Projects", error);
              reject();
            } else {
              resolve(projectID);
            }
          });
      });
    }
  }

  angular.module("app").service("Projects", Projects);
}
