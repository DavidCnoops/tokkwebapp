///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  export interface IGroupProject {
    $id?: string;
    project_name: string;
    project_slug: string;
    count: number;
  }

  interface IUpdatedGroupProject {
    count: number;
  }

  export class GroupProjects {
    public stream: IFirebaseArrayStream<IGroupProject>;

    constructor(
      private $log: ng.ILogService,
      private $q: ng.IQService,
      private Auth: Auth,
      private FirebaseUtils: FirebaseUtils
    ) {
      this.stream = null;
    }

    ref() {
      return firebase.default.database().ref(`group/${this.Auth.userGroup}/group_projects/`);
    }

    observe() {
      const ref = this.ref();
      this.stream = this.FirebaseUtils.arrayStream<IGroupProject>("groupprojects", ref);
      return this.stream.observable;
    }

    find(projectSlug: string) {
      return _(this.stream.data).find((project) => project.project_slug === projectSlug);
    }

    updateCount(groupProjectID: string, newCount: number) {
      if (newCount > 0) {
        return this.updateFirebase(groupProjectID, { count: newCount });
      }

      return this.removeFromFirebase(groupProjectID);
    }

    updateFirebase(groupProjectID: string, object: IUpdatedGroupProject) {
      return new this.$q((resolve, reject) => {
        this.ref()
          .child(groupProjectID)
          .update(object)
          .then(resolve)
          .catch((error) => {
            this.$log.error("Error for updateFirebase() of service GroupProjects", error);
            reject();
          });
      });
    }

    removeFromFirebase(groupProjectID: string) {
      return new this.$q((resolve, reject) => {
        this.ref()
          .child(groupProjectID)
          .remove()
          .then(resolve)
          .catch((error) => {
            this.$log.error("Error for removeFromFirebase() of service GroupProjects", error);
            reject();
          });
      });
    }
  }

  angular.module("app").service("GroupProjects", GroupProjects);
}
