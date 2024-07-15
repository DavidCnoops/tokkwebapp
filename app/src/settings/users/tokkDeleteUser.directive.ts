///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  const styles = require("tokkDeleteUser.css");

  function tokkDeleteUser() {
    return {
      scope: {},
      bindToController: {
        userUID: "@useruid",
      },
      restrict: "E",
      templateUrl: "tokkDeleteUser.template.html",
      controller: DeleteUserController,
      controllerAs: "vm",
    };
  }

  class DeleteUserController {
    public styles: any;
    public userUID: string;
    public user: IUser;
    public opened: boolean;
    public subscriptions: Array<Rx.Subscription>;

    constructor(
      private $scope: ng.IScope,
      private $q: ng.IQService,
      private $http: ng.IHttpService,
      private $log: ng.ILogService,
      private serverUrl: string,
      private Auth: Auth,
      private Sharing: Sharing,
      private Users: Users,
      private Usermanagement: Usermanagement,
      private UserProjectsList: UserProjectsList,
      private UserTasksList: UserTasksList,
      private UserTagsList: UserTagsList,
      private GroupProjects: GroupProjects,
      private GroupTasks: GroupTasks,
      private GroupTags: GroupTags
    ) {}

    $onInit() {
      this.styles = styles;
      this.user = null;
      this.opened = false;

      this.subscriptions = [
        this.Users.observe()
          .filter((items) => items !== null)
          .switchMap((users) => Rx.Observable.from(users))
          .filter((user) => user.$id === this.userUID)
          .distinctUntilChanged()
          .subscribe((user) => {
            this.user = user;
            this.$scope.$evalAsync();
          }),
      ];

      this.$scope.$on("$destroy", () => {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
      });
    }

    open() {
      this.opened = true;
    }

    close() {
      this.opened = false;
    }

    delete(user: IUser) {
      const userUID = this.Auth.userUID;
      const groupID = this.Auth.userGroup;
      const userUIDToDelete = user.$id;
      const email = user.email;
      const fullName = `${user.first_name} ${user.last_name}`;

      this.close();

      Rx.Observable.combineLatest(
        Rx.Observable.fromPromise(firebase.default.auth().currentUser.getIdToken(true)),
        this.UserProjectsList.observe(userUIDToDelete),
        this.UserTasksList.observe(userUIDToDelete),
        this.UserTagsList.observe(userUIDToDelete),
        (s1, s2, s3, s4) => {
          return {
            firebase_id_token: s1,
            projects: s2,
            tasks: s3,
            tags: s4,
          };
        }
      )
        .first()
        .subscribe((data) => {
          const promises: Array<angular.IPromise<any>> = [];

          _(data.projects).forEach((project) => {
            const groupProject = this.GroupProjects.find(project.project_slug);
            const newCount = groupProject.count - 1;
            promises.push(this.GroupProjects.updateCount(groupProject.$id, newCount));
          });

          _(data.tasks).forEach((task) => {
            const groupTask = this.GroupTasks.find(task.task_slug);
            const newCount = groupTask.count - task.count;
            promises.push(this.GroupTasks.updateCount(groupTask.$id, newCount));
          });

          _(data.tags).forEach((tag) => {
            const groupTag = this.GroupTags.find(tag.tag_slug);
            const newCount = groupTag.count - tag.count;
            promises.push(this.GroupTags.updateCount(groupTag.$id, newCount));
          });

          this.$q
            .all(promises)
            .then(() => {
              return this.Sharing.revokeAll(userUIDToDelete, fullName, false, true);
            })
            .then(() => {
              return this.Usermanagement.removeUser(groupID, userUIDToDelete, email);
            })
            .then(() => {
              return this.$http({
                url: `${this.serverUrl}/user/remove`,
                method: "POST",
                headers: { "Content-Type": "application/json" },
                data: {
                  user_id: userUID,
                  group_id: groupID,
                  user_id_to_delete: userUIDToDelete,
                  firebase_id_token: data.firebase_id_token,
                },
              });
            })
            .catch((error) => {
              this.$log.error("Error while trying to delete user", error);
            });
        });
    }
  }

  angular.module("app").directive("tokkDeleteUser", tokkDeleteUser);
}
