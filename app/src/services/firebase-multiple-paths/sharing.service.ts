///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  export class Sharing {
    constructor(
      private $q: ng.IQService,
      private Auth: Auth,
      private Notifications: Notifications,
      private Projects: Projects,
      private UserProject: UserProject,
      private UserProjectsList: UserProjectsList,
      private UserProjectSharing: UserProjectSharing,
      private GroupProjects: GroupProjects
    ) {}

    acceptProject(notification: INotification, myFullName: string, projectListItemPosition: number) {
      let _myProjectID = null;
      const myUserUID = this.Auth.userUID;
      const notificationID = notification.$id;
      const senderUID = notification.sender_uid;
      const senderProjectID = notification.sender_project_id;
      const projectSlug = notification.project_slug;
      const projectName = notification.project_name;
      const projectColor = notification.project_color;

      // check if project exists in my list
      return this.UserProject.getProjectID(myUserUID, projectSlug)
        .then((myProjectID) => {
          // if the project already exists in my list
          if (_.isString(myProjectID)) {
            _myProjectID = myProjectID;

            // first check if the project already has a sharingItem for the sender
            return this.UserProjectSharing.query(myUserUID, myProjectID, "user_uid", senderUID).then((sharingItem) => {
              if (sharingItem) {
                // update the sharingItem with status 'sharing' and senderProjectID
                return this.UserProjectSharing.update(myUserUID, myProjectID, {
                  $id: sharingItem.$id,
                  user_project_id: senderProjectID,
                  status: "sharing",
                });
              } else {
                // create a new sharingItem
                return this.UserProjectSharing.add(myUserUID, myProjectID, {
                  user_uid: senderUID,
                  user_project_id: senderProjectID,
                  status: "sharing",
                  added: <number>firebase.default.database.ServerValue.TIMESTAMP,
                });
              }
            });
          }
          // if the project does not already exists in my list
          else {
            // create a new project in my list
            const existingGroupProject = this.GroupProjects.find(projectSlug);
            const groupProjectID = existingGroupProject ? existingGroupProject.$id : null;
            const groupProjectCount = existingGroupProject ? existingGroupProject.count : 0;

            return this.Projects.add(
              this.Auth.userGroup,
              this.Auth.userUID,
              projectName,
              projectSlug,
              projectColor,
              projectListItemPosition,
              groupProjectID,
              groupProjectCount
            ).then((projectID) => {
              _myProjectID = projectID;

              // add sharingItem for the sender of the notification
              return this.UserProjectSharing.add(myUserUID, projectID, {
                user_uid: senderUID,
                user_project_id: senderProjectID,
                status: "sharing",
                added: <number>firebase.default.database.ServerValue.TIMESTAMP,
              });
            });
          }
        })
        .then(() => {
          // update the sharingItem for the sender his sharing list
          this.UserProjectSharing.query(senderUID, senderProjectID, "user_uid", myUserUID).then((senderSharingItem) => {
            if (senderSharingItem) {
              return this.UserProjectSharing.update(senderUID, senderProjectID, {
                $id: senderSharingItem.$id,
                user_project_id: _myProjectID,
                status: "sharing",
              });
            }
          });

          // add a new 'projectaccepted' notification to the sender
          this.Notifications.add(senderUID, {
            type: "projectaccepted",
            sender_name: myFullName,
            project_name: projectName,
            project_slug: projectSlug,
          });

          // update my 'projectrequest' notification
          return this.Notifications.update(myUserUID, notificationID, { status: "accepted" });
        });
    }

    declineProject(notification: INotification, myFullName: string, myProject: IUserProjectListItem) {
      const myUserUID = this.Auth.userUID;
      const senderUID = notification.sender_uid;
      const senderProjectID = notification.sender_project_id;
      const projectName = notification.project_name;
      const projectSlug = notification.project_slug;

      // if the project exists in my list
      if (myProject) {
        const myProjectID = myProject.user_project_id;

        // find the 'pending' sharingItem from the sender in my sharing list and revoke it
        return this.UserProjectSharing.query(myUserUID, myProjectID, "user_uid", senderUID)
          .then((mySharingItem) => {
            return this.revoke(
              myUserUID,
              myFullName,
              myProject.project_name,
              myProject.project_slug,
              myProject.user_project_id,
              mySharingItem,
              true,
              false
            );
          })
          .then(() => {
            // update my notification
            this.Notifications.update(myUserUID, notification.$id, { status: "declined" });
            return true;
          });
      }
      // if the project does not exist in my list
      else {
        // Create a mocked sharingItem for sharing.revoke(),
        // because there is no project yet and therefore no real sharingItem
        const mockedSharingitem: any = {
          user_uid: senderUID,
          status: "pending",
          user_project_id: senderProjectID,
        };

        return this.revoke(myUserUID, myFullName, projectName, projectSlug, false, mockedSharingitem, true, false).then(
          () => {
            return this.Notifications.update(myUserUID, notification.$id, { status: "declined" });
          }
        );
      }
    }

    revokeAll(
      userUID: string,
      fullName: string,
      sendRevokeNotification: boolean,
      removeSharingRequestNotifications: boolean
    ) {
      return this.UserProjectsList.getOnceForUser(userUID)
        .then((projects) => {
          return this.$q.all(
            _(projects)
              .map((project) => {
                return this.UserProjectSharing.getListOnce(userUID, project.user_project_id).then((sharingItems) => {
                  return {
                    project: project,
                    sharing_items: sharingItems,
                  };
                });
              })
              .value()
          );
        })
        .then((data) => {
          const promises: Array<angular.IPromise<{}>> = [];

          _(data).forEach((object) => {
            _(object.sharing_items).forEach((sharingItem) => {
              const projectName = object.project.project_name;
              const projectSlug = object.project.project_slug;
              const projectID = object.project.user_project_id;

              promises.push(
                this.revoke(
                  userUID,
                  fullName,
                  projectName,
                  projectSlug,
                  projectID,
                  sharingItem,
                  sendRevokeNotification,
                  removeSharingRequestNotifications
                )
              );
            });
          });

          return this.$q.all(promises);
        })
        .then((data) => {
          return this.Notifications.query(userUID, "type", "projectrequest");
        })
        .then((notifications) => {
          return this.$q.all(
            _(notifications)
              .map((notification) => {
                const senderUID = notification.sender_uid;
                const senderFullName = notification.sender_name;
                const projectName = notification.project_name;
                const projectSlug = notification.project_slug;
                const projectID = notification.sender_project_id;

                return this.UserProjectSharing.query(senderUID, projectID, "user_uid", userUID).then((sharingItem) => {
                  return {
                    sender_uid: senderUID,
                    sender_fullname: senderFullName,
                    project_name: projectName,
                    project_slug: projectSlug,
                    project_id: projectID,
                    sharing_item: sharingItem,
                  };
                });
              })
              .value()
          );
        })
        .then((data) => {
          return this.$q.all(
            _(data)
              .map((object) => {
                const senderUID = object.sender_uid;
                const senderFullName = object.sender_fullname;
                const projectName = object.project_name;
                const projectSlug = object.project_slug;
                const projectID = object.project_id;
                const sharingItem = object.sharing_item;

                if (sharingItem) {
                  return this.revoke(
                    senderUID,
                    senderFullName,
                    projectName,
                    projectSlug,
                    projectID,
                    sharingItem,
                    false,
                    false
                  );
                }

                return this.$q.resolve(null);
              })
              .value()
          );
        });
    }

    revoke(
      userUID: string,
      fullName: string,
      projectName: string,
      projectSlug: string,
      projectID: string | false,
      sharingItem: IUserProjectSharingItem,
      sendRevokeNotification: boolean,
      removeSharingRequestNotifications: boolean
    ) {
      const sharedUserUID = sharingItem.user_uid;
      const sharedUserStatus = sharingItem.status;
      const sharedUserProjectID = sharingItem.user_project_id;
      const promises: Array<angular.IPromise<any>> = [];

      if (removeSharingRequestNotifications) {
        promises.push(
          this.removeSharingRequestNotification(userUID, sharedUserUID, projectSlug),
          this.removeSharingRequestNotification(sharedUserUID, userUID, projectSlug)
        );
      }

      if (sendRevokeNotification) {
        promises.push(
          this.sendRevokeNotification(sharedUserUID, sharedUserStatus, userUID, fullName, projectName, projectSlug)
        );
      }

      if (_.has(sharingItem, "$id") && _.isString(projectID)) {
        promises.push(this.UserProjectSharing.removeBySharingItemID(userUID, projectID, sharingItem.$id));
      }

      if (_.isString(sharedUserProjectID)) {
        promises.push(this.UserProjectSharing.removeByUserUID(sharedUserUID, sharedUserProjectID, userUID));
      }

      return this.$q.all(promises);
    }

    sendRevokeNotification(
      sharedUserUID: string,
      sharedUserStatus: "pending" | "sharing",
      userUID: string,
      fullName: string,
      projectName: string,
      projectSlug: string
    ) {
      if (sharedUserStatus === "sharing") {
        return this.Notifications.add(sharedUserUID, {
          type: "projectrevoked",
          sender_name: fullName,
          project_name: projectName,
          project_slug: projectSlug,
        });
      } else if (sharedUserStatus === "pending") {
        // Check if the revoker has a sharing request in his notifications list.
        // If not, the revoker is the same user who sent out the sharing request.
        // In this case, no notification of the revoke action needs to be send.

        return this.Notifications.query(userUID, "type", "projectrequest").then((notifications) => {
          const notification = _.find(notifications, (notification) => {
            return notification.sender_uid === sharedUserUID && notification.project_slug === projectSlug;
          });

          if (notification) {
            return this.Notifications.add(sharedUserUID, {
              type: "projectdeclined",
              sender_name: fullName,
              project_name: projectName,
              project_slug: projectSlug,
            });
          }

          return this.$q.resolve(null);
        });
      }
    }

    removeSharingRequestNotification(userUID: string, sharedUserUID: string, projectSlug: string) {
      return this.Notifications.query(userUID, "type", "projectrequest").then((notifications) => {
        return this.$q.all(
          _(notifications)
            .filter((notification) => {
              return (
                notification.status === "pending" &&
                notification.project_slug === projectSlug &&
                notification.sender_uid === sharedUserUID
              );
            })
            .map((notification) => {
              return this.Notifications.remove(userUID, notification);
            })
            .value()
        );
      });
    }
  }

  angular.module("app").service("Sharing", Sharing);
}
