///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  export class Tasks {
    constructor(
      private $q: ng.IQService,
      private $log: ng.ILogService,
      private Utilities: Utilities,
      private Auth: Auth
    ) {}

    add(
      userUID: string,
      projectID: string,
      taskName: string,
      taskSlug: string,
      position: number,
      groupTaskID: string,
      groupTaskCount: number
    ) {
      return new this.$q((resolve, reject) => {
        const data = {};
        const groupID = this.Auth.userGroup;
        const userprojectTaskID = this.Utilities.generateFirebaseUUID();
        const newUserProjectTask: INewUserProjectTask = {
          task_name: taskName,
          task_slug: taskSlug,
          task_added: <number>firebase.default.database.ServerValue.TIMESTAMP,
          position: position,
          task_completed: false,
        };

        data[`group/${groupID}/user/${userUID}/user_projects/${projectID}/tasks/${userprojectTaskID}`] =
          newUserProjectTask;

        if (groupTaskID && groupTaskCount > 0) {
          data[`group/${groupID}/group_tasks/${groupTaskID}/count`] = groupTaskCount + 1;
        } else {
          const groupTaskID: string = this.Utilities.generateFirebaseUUID();
          const newGroupTask: IGroupTask = {
            task_name: taskName,
            task_slug: taskSlug,
            count: 1,
          };

          data[`group/${groupID}/group_tasks/${groupTaskID}`] = newGroupTask;
        }

        firebase.default
          .database()
          .ref()
          .update(data, (error) => {
            if (error) {
              this.$log.error("Error for add() of service Tasks", error);
              reject();
            } else {
              resolve();
            }
          });
      });
    }

    update(
      userUID: string,
      projectID: string,
      userprojectTaskID: string,
      newTaskName: string,
      newTaskSlug: string,
      oldGroupTaskID: string,
      oldGroupTaskCount: number,
      newGroupTaskID: string,
      newGroupTaskCount: number
    ) {
      return new this.$q((resolve, reject) => {
        const data = {};
        const groupID = this.Auth.userGroup;

        data[`group/${groupID}/user/${userUID}/user_projects/${projectID}/tasks/${userprojectTaskID}/task_name`] =
          newTaskName;
        data[`group/${groupID}/user/${userUID}/user_projects/${projectID}/tasks/${userprojectTaskID}/task_slug`] =
          newTaskSlug;

        if (oldGroupTaskCount > 1) {
          data[`group/${groupID}/group_tasks/${oldGroupTaskID}/count`] = oldGroupTaskCount - 1;
        } else {
          data[`group/${groupID}/group_tasks/${oldGroupTaskID}`] = null;
        }

        if (newGroupTaskID && newGroupTaskCount > 0) {
          data[`group/${groupID}/group_tasks/${newGroupTaskID}/count`] = newGroupTaskCount + 1;
        } else {
          const groupTaskID: string = this.Utilities.generateFirebaseUUID();
          const newGroupTask: IGroupTask = {
            task_name: newTaskName,
            task_slug: newTaskSlug,
            count: 1,
          };

          data[`group/${groupID}/group_tasks/${groupTaskID}`] = newGroupTask;
        }

        firebase.default
          .database()
          .ref()
          .update(data, (error) => {
            if (error) {
              this.$log.error("Error for update() of service Tasks", error);
              reject();
            } else {
              resolve();
            }
          });
      });
    }

    updateName(
      userUID: string,
      projectID: string,
      userprojectTaskID: string,
      newTaskName: string,
      userTasksListItemID: string,
      groupTaskID: string
    ) {
      return new this.$q((resolve, reject) => {
        const data = {};
        const groupID = this.Auth.userGroup;

        data[`group/${groupID}/user/${userUID}/user_projects/${projectID}/tasks/${userprojectTaskID}/task_name`] =
          newTaskName;
        data[`group/${groupID}/user/${userUID}/user_tasks_list/${userTasksListItemID}/task_name`] = newTaskName;
        data[`group/${groupID}/group_tasks/${groupTaskID}/task_name`] = newTaskName;

        firebase.default
          .database()
          .ref()
          .update(data, (error) => {
            if (error) {
              this.$log.error("Error for updateName() of service Tasks", error);
              reject();
            } else {
              resolve();
            }
          });
      });
    }
  }

  angular.module("app").service("Tasks", Tasks);
}
