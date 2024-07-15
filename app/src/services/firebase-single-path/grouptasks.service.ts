///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  export interface IGroupTask {
    $id?: string;
    task_name: string;
    task_slug: string;
    count: number;
  }

  interface IUpdatedGroupTask {
    count: number;
  }

  export class GroupTasks {
    public stream: IFirebaseArrayStream<IGroupTask>;

    constructor(
      private $log: ng.ILogService,
      private $q: ng.IQService,
      private Auth: Auth,
      private FirebaseUtils: FirebaseUtils
    ) {
      this.stream = null;
    }

    ref() {
      return firebase.default.database().ref(`group/${this.Auth.userGroup}/group_tasks/`);
    }

    observe() {
      const ref = this.ref();
      this.stream = this.FirebaseUtils.arrayStream<IGroupTask>("grouptasks", ref);
      return this.stream.observable;
    }

    find(taskSlug: string) {
      return _(this.stream.data).find((task) => task.task_slug === taskSlug);
    }

    updateCount(groupTaskID: string, newCount: number) {
      if (newCount > 0) {
        return this.updateFirebase(groupTaskID, { count: newCount });
      }

      return this.removeFromFirebase(groupTaskID);
    }

    updateFirebase(groupTaskID: string, object: IUpdatedGroupTask) {
      return new this.$q((resolve, reject) => {
        this.ref()
          .child(groupTaskID)
          .update(object)
          .then(resolve)
          .catch((error) => {
            this.$log.error("Error for updateFirebase() of service GroupTasks", error);
            reject();
          });
      });
    }

    removeFromFirebase(groupTaskID: string) {
      return new this.$q((resolve, reject) => {
        this.ref()
          .child(groupTaskID)
          .remove()
          .then(resolve)
          .catch((error) => {
            this.$log.error("Error for removeFromFirebase() of service GroupTasks", error);
            reject();
          });
      });
    }
  }

  angular.module("app").service("GroupTasks", GroupTasks);
}
