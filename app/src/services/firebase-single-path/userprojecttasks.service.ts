///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  export interface INewUserProjectTask {
    position: number;
    task_added: number;
    task_completed: boolean;
    task_name: string;
    task_slug: string;
  }

  export interface IUpdatedUserProjectTask {
    position?: number;
    task_added?: number;
    task_completed?: boolean;
    task_name?: string;
    task_slug?: string;
  }

  export interface ITaskTemp {
    task_name?: string;
    task_slug?: string;
  }

  export interface IUserProjectTask {
    $id: string;
    position: number;
    task_added: number;
    task_completed: boolean;
    task_name: string;
    task_slug: string;
    expanded: boolean;
    editing: boolean;
    temp: ITaskTemp;
  }

  export interface IProperties {
    $id?: string;
    position?: number;
    task_added?: number;
    task_completed?: boolean;
    task_name?: string;
    task_slug?: string;
    expanded?: boolean;
    editing?: boolean;
    temp?: ITaskTemp;
  }

  interface IExpanded {
    expanded: boolean;
  }

  interface ILocalProperties extends IExpanded {
    editing: boolean;
    temp: ITaskTemp;
  }

  interface IUpdatedLocalProperties {
    expanded?: boolean;
    editing?: boolean;
    temp?: ITaskTemp;
  }

  export class UserProjectTasks {
    private stream: { [key: string]: IFirebaseArrayStream<IUserProjectTask> };

    constructor(
      private $q: ng.IQService,
      private $log: ng.ILogService,
      private Auth: Auth,
      private FirebaseUtils: FirebaseUtils
    ) {
      this.stream = {};
    }

    ref(userUID: string, projectID: string) {
      return firebase.default
        .database()
        .ref(`group/${this.Auth.userGroup}/user/${userUID}/user_projects/${projectID}/tasks/`);
    }

    observe(userUID: string, projectID: string) {
      const ref = this.ref(userUID, projectID);

      const onChildAdded = (list: Array<IUserProjectTask>, firebaseTask: IUserProjectTask) => {
        const newLocalTaskProperties: ILocalProperties = {
          expanded: false,
          editing: false,
          temp: {},
        };
        const newLocalTask: IUserProjectTask = {
          ...firebaseTask,
          ...newLocalTaskProperties,
        };

        return newLocalTask;
      };

      const onChildChanged = (list: Array<IUserProjectTask>, firebaseTask: IUserProjectTask) => {
        const oldLocalTask = _(list).find((item) => item.$id === firebaseTask.$id);
        const newLocalTask: IUserProjectTask = {
          ...oldLocalTask,
          ...firebaseTask,
        };

        return newLocalTask;
      };

      this.stream[projectID] = this.FirebaseUtils.arrayStream<IUserProjectTask>(
        "userprojecttasks",
        ref,
        onChildAdded,
        onChildChanged
      );

      return this.stream[projectID].observable;
    }

    taskExistsInList(projectID: string, taskSlug: string) {
      return _(this.stream[projectID].data).some((task) => task.task_slug === taskSlug);
    }

    getListSize(projectID: string, completed: boolean) {
      return _(this.stream[projectID].data)
        .filter((task) => task.task_completed === completed)
        .size();
    }

    toggleExpanded(projectID: string, taskID: string) {
      this.stream[projectID].observer.next((tasks) => {
        return _(tasks)
          .map((task) => {
            if (task.$id === taskID) {
              const expanded = !task.expanded;
              return { ...task, expanded };
            } else if (task.$id !== taskID && task.expanded) {
              const expanded = false;
              return { ...task, expanded };
            }

            return task;
          })
          .value();
      });
    }

    expand(projectID: string, taskID: string) {
      this.stream[projectID].observer.next((tasks) => {
        return _(tasks)
          .map((task) => {
            if (task.$id === taskID && !task.expanded) {
              const expanded = true;
              return { ...task, expanded };
            } else if (task.$id !== taskID && task.expanded) {
              const expanded = false;
              return { ...task, expanded };
            }

            return task;
          })
          .value();
      });
    }

    startEditing(projectID: string, taskID: string) {
      this.stream[projectID].observer.next((tasks) => {
        return _(tasks)
          .map((task) => {
            if (task.$id === taskID && !task.editing) {
              const updatedProperties: IUpdatedLocalProperties = {
                editing: true,
                temp: {
                  task_name: _.cloneDeep(task.task_name),
                  task_slug: _.cloneDeep(task.task_slug),
                },
              };

              return <IUserProjectTask>{
                ...task,
                ...updatedProperties,
              };
            }

            return task;
          })
          .value();
      });
    }

    cancelEditing(projectID: string) {
      this.stream[projectID].observer.next((tasks) => {
        return _(tasks)
          .map((task) => {
            if (task.editing) {
              let updatedProperties: IProperties = {
                editing: false,
                temp: {},
              };

              if (_.has(task, "temp.task_name") && _.isString(task.temp.task_name) && !_.isEmpty(task.temp.task_name)) {
                updatedProperties = {
                  ...updatedProperties,
                  task_name: _.cloneDeep(task.temp.task_name),
                  task_slug: _.cloneDeep(task.temp.task_slug),
                };
              }

              return <IUserProjectTask>{
                ...task,
                ...updatedProperties,
              };
            }

            return task;
          })
          .value();
      });
    }

    finishEditing(projectID: string, taskID: string, taskName: string, taskSlug: string) {
      this.stream[projectID].observer.next((tasks) => {
        return _(tasks)
          .map((task) => {
            if (taskID === task.$id) {
              const updatedProperties: IProperties = {
                task_name: taskName,
                task_slug: taskSlug,
                editing: false,
                temp: {},
              };

              return <IUserProjectTask>{
                ...task,
                ...updatedProperties,
              };
            }

            return task;
          })
          .value();
      });
    }

    updatePositions(
      userUID: string,
      projectID: string,
      draggedTaskCompleted: boolean,
      draggedTaskOldPosition: number,
      draggedTaskNewPosition: number,
      draggedTaskID: string
    ) {
      const data = {};
      const filteredTasksCount = _(this.stream[projectID].data)
        .filter((task) => task.task_completed === draggedTaskCompleted)
        .size();
      draggedTaskOldPosition = filteredTasksCount - 1 - draggedTaskOldPosition;
      draggedTaskNewPosition = filteredTasksCount - 1 - draggedTaskNewPosition;

      const refString = this.ref(userUID, projectID).child(draggedTaskID).child("position").toString();
      data[refString] = draggedTaskNewPosition;

      _(this.stream[projectID].data)
        .filter((task) => task.$id !== draggedTaskID && task.task_completed === draggedTaskCompleted)
        .forEach((task) => {
          const refString = this.ref(userUID, projectID).child(task.$id).child("position").toString();

          // if dragged task is dragged from above to below selected task
          if (
            draggedTaskNewPosition > draggedTaskOldPosition &&
            task.position > draggedTaskOldPosition &&
            task.position <= draggedTaskNewPosition
          ) {
            data[refString] = task.position - 1;
          }

          // if dragged task is dragged from below to above selected task
          if (
            draggedTaskNewPosition < draggedTaskOldPosition &&
            task.position < draggedTaskOldPosition &&
            task.position >= draggedTaskNewPosition
          ) {
            data[refString] = task.position + 1;
          }
        });

      this.FirebaseUtils.updateBulk(data);
    }

    reorder(userUID: string, projectID: string, status: boolean, removedPosition: number) {
      const data = {};

      _(this.stream[projectID].data)
        .filter((task) => task.task_completed === status && task.position > removedPosition)
        .forEach((task) => {
          const refString = this.ref(userUID, projectID).child(task.$id).child("position").toString();
          data[refString] = task.position - 1;
        });

      this.FirebaseUtils.updateBulk(data);
    }

    updateFirebase(userUID: string, projectID: string, taskID: string, object: IUpdatedUserProjectTask) {
      return new this.$q((resolve, reject) => {
        this.ref(userUID, projectID)
          .child(taskID)
          .update(object)
          .then(resolve)
          .catch((error) => {
            this.$log.error("Error for updateFirebase() of service UserProjectTasks", error);
            reject(error);
          });
      });
    }

    remove(userUID: string, projectID: string, task: IUserProjectTask) {
      return new this.$q((resolve, reject) => {
        this.ref(userUID, projectID)
          .child(task.$id)
          .remove()
          .then(resolve)
          .catch((error) => {
            this.$log.error("Error for remove() of service UserProjectTasks", error);
            reject(error);
          });
      });
    }
  }

  angular.module("app").service("UserProjectTasks", UserProjectTasks);
}
