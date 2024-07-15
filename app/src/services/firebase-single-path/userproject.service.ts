///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  export interface IUserProject {
    project_name: string;
    project_slug: string;
    added: number;
    color: string;
    completed: boolean;
  }

  export interface IUpdatedUserProject {
    project_name?: string;
    project_slug?: string;
    added?: number;
    color?: string;
    completed?: boolean;
  }

  export class UserProject {
    private behaviorSubject: Rx.BehaviorSubject<string>;
    public replay: Rx.Observable<string>;

    constructor(
      private $q: ng.IQService,
      private $log: ng.ILogService,
      private Auth: Auth,
      private FirebaseUtils: FirebaseUtils
    ) {
      this.behaviorSubject = new Rx.BehaviorSubject(null);
      this.replay = this.behaviorSubject.distinctUntilChanged().publishReplay(1).refCount();
    }

    ref(projectID: string) {
      return firebase.default
        .database()
        .ref(`group/${this.Auth.userGroup}/user/${this.Auth.userUID}/user_projects/${projectID}/details/`);
    }

    observe(projectID: string) {
      const ref = this.ref(projectID);
      return this.FirebaseUtils.objectStream<IUserProject>("userproject", ref).observable;
    }

    set(projectID: string) {
      this.behaviorSubject.next(projectID);
    }

    getProjectID(userUID: string, projectSlug: string): angular.IPromise<string | boolean> {
      return new this.$q((resolve, reject) => {
        const ref = firebase.default.database().ref(`group/${this.Auth.userGroup}/user/${userUID}/`);

        ref
          .child("user_projects_list")
          .orderByChild("project_slug")
          .equalTo(projectSlug)
          .limitToFirst(1)
          .once("value")
          .then((snapshot) => {
            if (snapshot.exists()) {
              let userProjectListItem: IUserProjectListItem = null;
              snapshot.forEach((childSnapshot) => (userProjectListItem = childSnapshot.val()));

              if (userProjectListItem && _.has(userProjectListItem, "user_project_id")) {
                resolve(userProjectListItem.user_project_id);
              } else {
                resolve(false);
              }
            } else {
              resolve(false);
            }
          })
          .catch((error) => {
            this.$log.error("Error for getProjectID() of service UserProject", error);
            reject();
          });
      });
    }

    update(projectID: string, object: IUpdatedUserProject) {
      return new this.$q((resolve, reject) => {
        this.ref(projectID)
          .update(object)
          .then(resolve)
          .catch((error) => {
            this.$log.error("Error on callback for update() of service UserProject", error);
            reject();
          });
      });
    }

    remove(projectID: string) {
      return new this.$q((resolve, reject) => {
        const ref = firebase.default
          .database()
          .ref(`group/${this.Auth.userGroup}/user/${this.Auth.userUID}/user_projects/${projectID}/`);

        ref.remove().catch((error) => {
          this.$log.error("Error on callback for remove() of service UserProject", error);
          reject();
        });
      });
    }
  }

  angular.module("app").service("UserProject", UserProject);
}
