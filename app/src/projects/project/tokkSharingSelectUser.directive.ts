///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  const styles = require("tokkSharingSelectUser.css");

  interface IUserExtended {
    full_name: string;
    selectable: boolean;
  }

  interface IUsersDropdownListItem extends IUser, IUserExtended {}

  function tokkSharingSelectUser() {
    return {
      scope: {},
      bindToController: {
        projectID: "<projectid",
      },
      restrict: "E",
      templateUrl: "tokkSharingSelectUser.template.html",
      controller: SharingSelectUserController,
      controllerAs: "vm",
    };
  }

  class SharingSelectUserController {
    public styles: any;
    public projectID: string;
    public project: IUserProjectListItem;
    public usersDropdownList: Array<IUsersDropdownListItem>;
    public activeUsersCount: number;
    public selectedUser: IUser;
    public myFullName: string;
    public processing: boolean;
    public subscriptions: Array<Rx.Subscription>;

    constructor(
      private $scope: ng.IScope,
      private Auth: Auth,
      private Users: Users,
      private UserProjectsList: UserProjectsList,
      private UserProjectSharing: UserProjectSharing,
      private Notifications: Notifications,
      private Utilities: Utilities,
      private UserProject: UserProject
    ) {}

    $onInit() {
      this.styles = styles;
      this.project = null;
      this.usersDropdownList = null;
      this.activeUsersCount = null;
      this.selectedUser = null;
      this.myFullName = null;
      this.processing = false;

      this.subscriptions = [
        Rx.Observable.combineLatest(
          this.Users.observe(),

          this.UserProjectSharing.observe(this.projectID),

          this.UserProjectsList.observe()
            .filter((items) => items !== null)
            .switchMap((projects) => Rx.Observable.from(projects))
            .filter((project) => project.user_project_id === this.projectID)
            .distinctUntilChanged(),

          (s1, s2, s3) => {
            return {
              users: s1,
              shared_users: s2,
              project: s3,
            };
          }
        ).subscribe((data) => {
          this.myFullName = this.Utilities.getFullName(this.Auth.userUID, data.users);
          this.usersDropdownList = this.getUsersDropdownList(data.users, data.shared_users);
          this.activeUsersCount = data.users.filter((user) => user.status === "active").length;
          this.project = data.project;
          this.$scope.$evalAsync();
        }),
      ];

      this.$scope.$on("$destroy", () => {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
      });
    }

    getUsersDropdownList(users: Array<IUser>, sharedUsers: Array<IUserProjectSharingItem>) {
      return _(users)
        .filter((user) => user.$id !== this.Auth.userUID)
        .filter((user) => user.status === "active")
        .sortBy((user) => user.first_name)
        .map((user) => {
          return {
            ...user,
            full_name: `${user.first_name} ${user.last_name}`,
            selectable: !_(sharedUsers).some((sharedUser) => sharedUser.user_uid === user.$id),
          };
        })
        .value();
    }

    addPendingUser(otherUserUID: string, projectID: string, project: IUserProjectListItem, myFullName: string) {
      if (_.isString(otherUserUID) && !_.isEmpty(otherUserUID)) {
        const myUID = this.Auth.userUID;
        const myProjectID = projectID;
        const myProjectColor = project.color;
        const projectName = project.project_name;
        const projectSlug = project.project_slug;

        this.processing = true;

        this.Notifications.add(otherUserUID, {
          type: "projectrequest",
          created: <number>firebase.default.database.ServerValue.TIMESTAMP,
          sender_uid: myUID,
          sender_name: myFullName,
          sender_project_id: myProjectID,
          project_name: projectName,
          project_slug: projectSlug,
          project_color: myProjectColor,
          status: "pending",
        });

        this.UserProject.getProjectID(otherUserUID, projectSlug)
          .then((otherUserProjectID) => {
            if (_.isString(otherUserProjectID) && !_.isEmpty(otherUserProjectID)) {
              this.UserProjectSharing.add(otherUserUID, otherUserProjectID, {
                user_uid: myUID,
                user_project_id: myProjectID,
                status: "pending",
                added: <number>firebase.default.database.ServerValue.TIMESTAMP,
              });
            }

            return this.UserProjectSharing.add(this.Auth.userUID, myProjectID, {
              user_uid: otherUserUID,
              user_project_id:
                _.isString(otherUserProjectID) && !_.isEmpty(otherUserProjectID) ? otherUserProjectID : false,
              status: "pending",
              added: <number>firebase.default.database.ServerValue.TIMESTAMP,
            });
          })
          .then(() => {
            this.processing = false;
          })
          .catch((error) => {
            this.processing = false;
          });

        // reset
        this.selectedUser = null;
      }
    }
  }

  angular.module("app").directive("tokkSharingSelectUser", tokkSharingSelectUser);
}
