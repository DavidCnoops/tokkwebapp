///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  export interface IUserTasksListItem {
    $id?: string;
    count?: number;
    task_name: string;
    task_slug: string;
  }

  export class UserTasksList {
    constructor(
      private $q: ng.IQService,
      private $log: ng.ILogService,
      private Auth: Auth,
      private FirebaseUtils: FirebaseUtils
    ) {}

    ref(userUID: string) {
      return firebase.default.database().ref(`group/${this.Auth.userGroup}/user/${userUID}/user_tasks_list/`);
    }

    observe(userUID: string | boolean = false) {
      const refUserUID = !_.isString(userUID) ? this.Auth.userUID : userUID;
      const ref = this.ref(refUserUID);
      return this.FirebaseUtils.arrayStream<IUserTasksListItem>("usertaskslist", ref).observable;
    }

    add(userUID: string, newListItem: IUserTasksListItem) {
      return this.findTask(userUID, newListItem.task_slug).then((existingListItem) => {
        if (existingListItem && _.has(existingListItem, "count")) {
          return this.updateCount(userUID, existingListItem, "increment");
        }

        return this.addToFirebase(userUID, newListItem);
      });
    }

    updateTaskName(userUID: string, oldTaskSlug: string, newTaskName: string, newTaskSlug: string): void {
      this.remove(userUID, oldTaskSlug);
      this.add(userUID, { task_name: newTaskName, task_slug: newTaskSlug });
    }

    remove(userUID: string, taskSlug: string) {
      this.findTask(userUID, taskSlug).then((existingListItem) => {
        if (existingListItem) {
          if (existingListItem.count > 1) {
            this.updateCount(userUID, existingListItem, "decrement");
          } else {
            this.removeFromFirebase(userUID, existingListItem.$id);
          }
        }
      });
    }

    findTask(userUID: string, taskSlug: string): angular.IPromise<IUserTasksListItem> {
      return new this.$q((resolve, reject) => {
        this.ref(userUID)
          .orderByChild("task_slug")
          .equalTo(taskSlug)
          .limitToFirst(1)
          .once("value", (snapshot) => {
            let listItem = null;

            if (snapshot.exists()) {
              snapshot.forEach((childSnapshot) => {
                listItem = childSnapshot.val();
                listItem.$id = childSnapshot.key;
                return false;
              });
            }

            resolve(listItem);
          });
      });
    }

    private removeFromFirebase(userUID: string, listItemID: string) {
      return new this.$q((resolve, reject) => {
        this.ref(userUID)
          .child(listItemID)
          .remove()
          .then(resolve)
          .catch((error) => {
            this.$log.error("Error for removeFromFirebase() of service UserTasksList", error);
            reject();
          });
      });
    }

    private addToFirebase(userUID: string, listItem: IUserTasksListItem) {
      return new this.$q((resolve, reject) => {
        const newListItem: IUserTasksListItem = {
          count: 1,
          task_name: listItem.task_name,
          task_slug: listItem.task_slug,
        };

        this.ref(userUID)
          .push(newListItem)
          .then(resolve, (error) => {
            this.$log.error("Error for addToFirebase() of service UserTasksList", error);
            reject();
          });
      });
    }

    private updateCount(userUID: string, listItem: IUserTasksListItem, action: "increment" | "decrement") {
      return new this.$q((resolve, reject) => {
        const newCount = action === "increment" ? listItem.count + 1 : listItem.count - 1;
        this.ref(userUID)
          .child(listItem.$id)
          .update({ count: newCount })
          .then(resolve)
          .catch((error) => {
            this.$log.error("Error for updateCount() of service UserTasksList", error);
            reject();
          });
      });
    }
  }

  angular.module("app").service("UserTasksList", UserTasksList);
}
