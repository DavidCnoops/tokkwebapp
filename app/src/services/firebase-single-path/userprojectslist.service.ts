///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  export interface IUserProjectListItem {
    $id?: string;
    project_name: string;
    project_slug: string;
    added: number;
    color: string;
    completed: boolean;
    user_project_id: string;
    position: number;
  }

  export interface IUpdatedUserProjectListItem {
    project_name?: string;
    project_slug?: string;
    added?: number;
    color?: string;
    completed?: boolean;
    user_project_id?: string;
    position?: number;
  }

  export class UserProjectsList {
    private stream: { [key: string]: IFirebaseArrayStream<IUserProjectListItem> };

    constructor(
      private $q: ng.IQService,
      private $log: ng.ILogService,
      private Auth: Auth,
      private FirebaseUtils: FirebaseUtils
    ) {
      this.stream = {};
    }

    ref(userUID: string) {
      return firebase.default.database().ref(`group/${this.Auth.userGroup}/user/${userUID}/user_projects_list/`);
    }

    observe(userUID: string | boolean = false) {
      const refUserUID = !_.isString(userUID) ? this.Auth.userUID : userUID;
      const ref = this.ref(refUserUID);
      this.stream[refUserUID] = this.FirebaseUtils.arrayStream<IUserProjectListItem>("userprojectslist", ref);
      return this.stream[refUserUID].observable;
    }

    getOnceForUser(userUID: string): angular.IPromise<Array<IUserProjectListItem>> {
      return new this.$q((resolve, reject) => {
        this.ref(userUID)
          .once("value")
          .then((snapshot) => {
            resolve(this.FirebaseUtils.convertToArray(snapshot));
          })
          .catch((error) => {
            this.$log.error("Error for getOnceForUser() of service UserProjectsList", error);
            reject(error);
          });
      });
    }

    getListSize(userUID: string, completed: boolean) {
      return _(this.stream[userUID].data)
        .filter((project) => project.completed === completed)
        .size();

      /*
            let listSize: number = null;

            this.stream[userUID].observer.next((projects) => {
                listSize = _(projects).filter(project => project.completed === completed).size();
                return projects;
            });

            return listSize;
            */
    }

    updatePositions(
      userUID: string,
      draggedProjectCompleted: boolean,
      draggedProjectOldPosition: number,
      draggedProjectNewPosition: number,
      draggedProjectID: string
    ) {
      const data = {};
      const filteredProjectsCount = _(this.stream[userUID].data)
        .filter((project) => project.completed === draggedProjectCompleted)
        .size();
      draggedProjectOldPosition = filteredProjectsCount - 1 - draggedProjectOldPosition;
      draggedProjectNewPosition = filteredProjectsCount - 1 - draggedProjectNewPosition;

      const refString = this.ref(userUID).child(draggedProjectID).child("position").toString();
      data[refString] = draggedProjectNewPosition;

      _(this.stream[userUID].data)
        .filter((project) => project.$id !== draggedProjectID && project.completed === draggedProjectCompleted)
        .forEach((project) => {
          const refString = this.ref(userUID).child(project.$id).child("position").toString();

          // if dragged project is dragged from above to below selected project
          if (
            draggedProjectNewPosition > draggedProjectOldPosition &&
            project.position > draggedProjectOldPosition &&
            project.position <= draggedProjectNewPosition
          ) {
            data[refString] = project.position - 1;
          }

          // if dragged project is dragged from below to above selected project
          if (
            draggedProjectNewPosition < draggedProjectOldPosition &&
            project.position < draggedProjectOldPosition &&
            project.position >= draggedProjectNewPosition
          ) {
            data[refString] = project.position + 1;
          }
        });

      this.FirebaseUtils.updateBulk(data);
    }

    reorder(userUID: string, status: boolean, removedPosition: number) {
      const data = {};

      _(this.stream[userUID].data)
        .filter((project) => project.completed === status && project.position > removedPosition)
        .forEach((project) => {
          const refString = this.ref(userUID).child(project.$id).child("position").toString();
          data[refString] = project.position - 1;
        });

      this.FirebaseUtils.updateBulk(data);
    }

    updateFirebase(userUID: string, listItemID: string, object: IUpdatedUserProjectListItem) {
      return new this.$q((resolve, reject) => {
        this.ref(userUID)
          .child(listItemID)
          .update(object)
          .then(resolve)
          .catch((error) => {
            this.$log.error("Error for update() of service UserProjectsList", error);
            reject();
          });
      });
    }

    remove(userUID: string, listItem: IUserProjectListItem) {
      return new this.$q((resolve, reject) => {
        this.ref(userUID)
          .child(listItem.$id)
          .remove()
          .then(resolve)
          .catch((error) => {
            this.$log.error("Error for remove() of service UserProjectsList", error);
            reject();
          });
      });
    }
  }

  angular.module("app").service("UserProjectsList", UserProjectsList);
}
