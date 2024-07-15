///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  export interface IUserProjectSubtask {
    $id?: string;
    position: number;
    subtask_added: number;
    subtask_completed: boolean;
    subtask_name: string;
    subtask_slug: string;
  }

  export interface IUpdatedUserProjectSubtask {
    position?: number;
    subtask_added?: number;
    subtask_completed?: boolean;
    subtask_name?: string;
    subtask_slug?: string;
  }

  export class UserProjectSubtasks {
    private stream: { [key: string]: IFirebaseArrayStream<IUserProjectSubtask> };

    constructor(
      private $q: ng.IQService,
      private $log: ng.ILogService,
      private Auth: Auth,
      private FirebaseUtils: FirebaseUtils
    ) {
      this.stream = {};
    }

    ref(userUID: string, projectID: string, taskID: string) {
      return firebase.default
        .database()
        .ref(`group/${this.Auth.userGroup}/user/${userUID}/user_projects/${projectID}/subtasks/${taskID}`);
    }

    observe(userUID: string, projectID: string, taskID: string) {
      const ref = this.ref(userUID, projectID, taskID);
      this.stream[taskID] = this.FirebaseUtils.arrayStream<IUserProjectSubtask>("userprojectsubtasks", ref);
      return this.stream[taskID].observable;
    }

    add(userUID: string, projectID: string, taskID: string, subtask: IUserProjectSubtask) {
      return new this.$q((resolve, reject) => {
        const newSubtask: IUserProjectSubtask = {
          subtask_name: subtask.subtask_name,
          subtask_slug: subtask.subtask_slug,
          subtask_added: subtask.subtask_added,
          subtask_completed: subtask.subtask_completed,
          position: subtask.position,
        };

        this.ref(userUID, projectID, taskID)
          .push(newSubtask)
          .then(resolve, (error) => {
            this.$log.error("Error for add() of service UserProjectSubtasks", error);
            reject();
          });
      });
    }

    update(userUID: string, projectID: string, taskID: string, subtaskID: string, object: IUpdatedUserProjectSubtask) {
      return new this.$q((resolve, reject) => {
        this.ref(userUID, projectID, taskID)
          .child(subtaskID)
          .update(object)
          .then(resolve)
          .catch((error) => {
            this.$log.error("Error for update() of service UserProjectSubtasks", error);
            reject();
          });
      });
    }

    updatePositions(
      userUID: string,
      projectID: string,
      taskID: string,
      oldPosition: number,
      newPosition: number,
      draggedItemID: string
    ) {
      const data = {};
      oldPosition = _.size(this.stream[taskID].data) - 1 - oldPosition;
      newPosition = _.size(this.stream[taskID].data) - 1 - newPosition;

      const refString = this.ref(userUID, projectID, taskID).child(draggedItemID).child("position").toString();
      data[refString] = newPosition;

      _(this.stream[taskID].data)
        .filter((subtask) => subtask.$id !== draggedItemID)
        .forEach((subtask) => {
          const refString = this.ref(userUID, projectID, taskID).child(subtask.$id).child("position").toString();

          // if dragged task is dragged from above to below selected task
          if (newPosition > oldPosition && subtask.position > oldPosition && subtask.position <= newPosition) {
            data[refString] = subtask.position - 1;
          }

          // if dragged task is dragged from below to above selected task
          if (newPosition < oldPosition && subtask.position < oldPosition && subtask.position >= newPosition) {
            data[refString] = subtask.position + 1;
          }
        });

      this.FirebaseUtils.updateBulk(data);
    }

    reorder(userUID: string, projectID: string, taskID: string, removedPosition: number) {
      const data = {};

      _(this.stream[taskID].data)
        .filter((subtask) => subtask.position > removedPosition)
        .forEach((subtask) => {
          const refString = this.ref(userUID, projectID, taskID).child(subtask.$id).child("position").toString();
          data[refString] = subtask.position - 1;
        });

      this.FirebaseUtils.updateBulk(data);
    }

    remove(userUID: string, projectID: string, taskID: string, subtask: IUserProjectSubtask) {
      return new this.$q((resolve, reject) => {
        this.ref(userUID, projectID, taskID)
          .child(subtask.$id)
          .remove()
          .then(resolve)
          .catch((error) => {
            this.$log.error("Error for remove() of service UserProjectSubtasks", error);
            reject();
          });
      });
    }

    removeAll(userUID: string, projectID: string, taskID: string) {
      return new this.$q((resolve, reject) => {
        this.ref(userUID, projectID, taskID)
          .remove()
          .then(resolve)
          .catch((error) => {
            this.$log.error("Error for removeAll() of service UserProjectSubtasks", error);
            reject();
          });
      });
    }
  }

  angular.module("app").service("UserProjectSubtasks", UserProjectSubtasks);
}
