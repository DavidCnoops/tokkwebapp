///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  const styles = require("tokkSelectedProject.css");

  interface IPrefetchObject {
    ref: firebase.default.database.Reference;
    function: any;
  }

  function tokkSelectedProject() {
    return {
      scope: {},
      bindToController: {},
      restrict: "E",
      templateUrl: "tokkSelectedProject.template.html",
      controller: SelectedProjectController,
      controllerAs: "vm",
    };
  }

  class SelectedProjectController {
    public styles: any;
    public sharingModalOpened: boolean;
    public showTooltip: boolean;
    public editable: boolean;
    public userUID: string;
    public projectID: string;
    public tasksProjectID: string;
    public color: string;
    public selectedUser: IUser;
    public projectHeader: IUserProject;
    public activeTasks: Array<IUserProjectTask>;
    public completedTasks: Array<IUserProjectTask>;
    public subscriptionType: "free" | "business";
    public projectLoaded: boolean;
    public tasksLoaded: boolean;
    public lineElement: HTMLDivElement;
    public isOnline: boolean;
    public showCompletedTasks: boolean;
    public prefetchRefs: { [key: string]: IPrefetchObject };
    public subscriptions: Array<Rx.Subscription>;

    constructor(
      private $scope: ng.IScope,
      private $timeout: ng.ITimeoutService,
      private $element: ng.IRootElementService,
      private Auth: Auth,
      private Users: Users,
      private UserProject: UserProject,
      private UserProjectSharing: UserProjectSharing,
      private UserProjectTasks: UserProjectTasks,
      private UserProjectSubtasks: UserProjectSubtasks,
      private GroupSubscription: GroupSubscription,
      private Colors: Colors,
      private Streams: Streams,
      private Broadcaster: Broadcaster,
      private Connection: Connection
    ) {}

    $onInit() {
      this.styles = styles;
      this.sharingModalOpened = false;
      this.showTooltip = true;
      this.editable = false;
      this.userUID = null;
      this.projectID = null;
      this.tasksProjectID = null;
      this.color = null;
      this.selectedUser = null;
      this.projectHeader = null;
      this.activeTasks = null;
      this.completedTasks = null;
      this.subscriptionType = null;
      this.projectLoaded = false;
      this.tasksLoaded = false;
      this.lineElement = null;
      this.prefetchRefs = {};
      this.isOnline = true;
      this.showCompletedTasks = false;

      const listener = this.$scope.$watch(
        () => this.projectLoaded,
        (newValue, oldValue) => {
          this.lineElement = null;

          if (oldValue !== true && newValue === true) {
            this.$timeout(
              () => (this.lineElement = <HTMLDivElement>this.$element[0].querySelector(`.${this.styles.line}`))
            );
          }
        },
        true
      );

      this.subscriptions = [
        this.Broadcaster.observeKey("7c5ba180-33f6-481f-a4cb-635d35e331ae").subscribe(() => {
          this.sharingModalOpened = true;
          this.$scope.$evalAsync();
        }),

        this.Broadcaster.observeKey("a3b4f366-cb5a-48d0-94cb-d5d72c0a6799").subscribe(() => {
          this.showCompletedTasks = true;
          this.$scope.$evalAsync();
        }),

        this.UserProject.replay
          .do((projectID) => {
            this.projectID = null;
            this.projectHeader = null;
            this.color = null;
            this.Streams.stream.sharing.set(this.Auth.userUID);
            this.$scope.$evalAsync();
          })
          .filter((projectID) => _.isString(projectID) && !_.isEmpty(projectID))
          .distinctUntilChanged()
          .switchMap((projectID) => {
            return this.UserProject.observe(projectID).map((project) => {
              return {
                project_id: projectID,
                project: project,
              };
            });
          })
          .subscribe((data) => {
            this.projectID = data.project_id;
            this.projectHeader = data.project;
            this.color = data.project ? this.Colors.list[data.project.color] : null;
            this.$scope.$evalAsync();
          }),

        Rx.Observable.combineLatest(
          this.Users.observe(),

          this.GroupSubscription.observe(this.Auth.userGroup),

          Rx.Observable.combineLatest(
            this.UserProject.replay
              .do(() => {
                this.projectLoaded = false;
                this.tasksLoaded = false;
                this.showCompletedTasks = false;
                this.$scope.$evalAsync();
              })
              .filter((projectID) => _.isString(projectID) && !_.isEmpty(projectID))
              .distinctUntilChanged()
              .switchMap((projectID) => {
                return this.UserProjectSharing.observe(projectID).map((sharingItems) => {
                  return {
                    project_id: projectID,
                    sharing_items: sharingItems,
                  };
                });
              }),

            this.Streams.stream.sharing.replay
              .filter((value) => value !== null)
              .distinctUntilChanged()
              .do(() => {
                this.tasksLoaded = false;
                this.showCompletedTasks = false;
                this.$scope.$evalAsync();
              }),

            this.Connection.observe().distinctUntilChanged(),

            (s1, s2, s3) => {
              return {
                project_id: s1.project_id,
                sharing_items: s1.sharing_items,
                user_uid: s2,
                is_online: s3,
              };
            }
          )
            .switchMap((data) => {
              // set default values
              let userUID = this.Auth.userUID;
              let tasksProjectID = data.project_id;

              // check if shared user information is available
              if (data.user_uid !== this.Auth.userUID) {
                const sharingItem = _(data.sharing_items).find((sharingItem) => {
                  return sharingItem.user_uid === data.user_uid && sharingItem.status === "sharing";
                });

                if (sharingItem && _.isString(sharingItem.user_project_id) && !_.isEmpty(sharingItem.user_project_id)) {
                  userUID = data.user_uid;
                  tasksProjectID = sharingItem.user_project_id;
                } else if (this.Streams.stream.sharing.value !== this.Auth.userUID) {
                  // reset to default user
                  this.Streams.stream.sharing.set(this.Auth.userUID);
                }
              }

              if (userUID === this.Auth.userUID || data.is_online) {
                return this.UserProjectTasks.observe(userUID, tasksProjectID).map((tasks) => {
                  return {
                    project_id: data.project_id,
                    sharing_items: data.sharing_items,
                    user_uid: userUID,
                    is_online: data.is_online,
                    tasks_project_id: tasksProjectID,
                    tasks: tasks,
                  };
                });
              }

              return Rx.Observable.of({
                project_id: data.project_id,
                sharing_items: data.sharing_items,
                user_uid: userUID,
                is_online: data.is_online,
                tasks_project_id: tasksProjectID,
                tasks: <Array<IUserProjectTask>>null,
              });
            })
            .switchMap((data) => {
              if (_.isArray(data.tasks) && !_.isEmpty(data.tasks)) {
                return Rx.Observable.combineLatest(
                  data.tasks.map((task) => {
                    return this.UserProjectSubtasks.observe(data.user_uid, data.tasks_project_id, task.$id);
                  })
                ).map(() => data);
              }

              return Rx.Observable.of(data);
            }),

          (s1, s2, s3) => {
            return {
              users: s1,
              subscription: s2,
              project_id: s3.project_id,
              sharing_items: s3.sharing_items,
              user_uid: s3.user_uid,
              is_online: s3.is_online,
              tasks_project_id: s3.tasks_project_id,
              tasks: s3.tasks,
            };
          }
        )
          .debounceTime(10)
          .subscribe((data) => {
            const newPrefetchRefStrings = _(data.sharing_items)
              .map((sharingItem) => {
                return `group/${this.Auth.userGroup}/user/${sharingItem.user_uid}/user_projects/${sharingItem.user_project_id}/`;
              })
              .value();

            this.prefetch(newPrefetchRefStrings);

            this.userUID = data.user_uid;
            this.selectedUser = _(data.users).find((user) => user.$id === data.user_uid);
            this.editable = data.user_uid === this.Auth.userUID ? true : false;
            this.tasksProjectID = data.tasks_project_id;
            this.activeTasks = _.orderBy(
              _(data.tasks)
                .filter((task) => !task.task_completed)
                .value(),
              [(task) => task.position],
              ["desc"]
            );
            this.completedTasks = _.orderBy(
              _(data.tasks)
                .filter((task) => task.task_completed)
                .value(),
              [(task) => task.position],
              ["desc"]
            );
            this.subscriptionType = data.subscription.type;
            this.tasksLoaded = true;
            this.isOnline = data.is_online;

            if (!this.projectLoaded) {
              this.projectLoaded = true;

              this.Broadcaster.emit({
                key: "27dd036d-519e-42db-999f-e1df033147f6",
                message: "projectloaded",
                value: true,
              });
            }

            this.$scope.$evalAsync();
          }),
      ];

      this.$scope.$on("$destroy", () => {
        listener();
        _(this.subscriptions).forEach((subscription) => subscription.unsubscribe());
        _(this.prefetchRefs).forOwn((prefetch, refString) => prefetch.ref.off("value", prefetch.function));
      });
    }

    prefetch(newPrefetchRefStrings: Array<string>) {
      _(this.prefetchRefs).forOwn((value, refString) => {
        if (!_.includes(newPrefetchRefStrings, refString)) {
          this.prefetchRefs[refString].ref.off("value", this.prefetchRefs[refString].function);
          delete this.prefetchRefs[refString];
        }
      });

      _(newPrefetchRefStrings).forEach((refString) => {
        if (!_.has(this.prefetchRefs, refString)) {
          this.prefetchRefs[refString] = {
            ref: firebase.default.database().ref(refString),
            function: () => null as any,
          };

          this.prefetchRefs[refString].ref.on("value", this.prefetchRefs[refString].function);
        }
      });
    }

    scrolling(position: number) {
      if (this.lineElement !== null) {
        if (position === 0) {
          this.lineElement.classList.remove("visible");
        } else if (!this.lineElement.classList.contains("visible")) {
          this.lineElement.classList.add("visible");
        }
      }
    }

    updatePositions(tasks: Array<IUserProjectTask>, oldIndex: number, newIndex: number, draggedItemID: string) {
      const task = _(tasks).find((task) => task.$id === draggedItemID);
      this.UserProjectTasks.updatePositions(
        this.userUID,
        this.tasksProjectID,
        task.task_completed,
        oldIndex,
        newIndex,
        draggedItemID
      );
    }

    toggleCompletedTasks() {
      this.showCompletedTasks = !this.showCompletedTasks;
      const expandedTask = _(this.completedTasks).find((task) => task.expanded);

      if (expandedTask) {
        this.UserProjectTasks.toggleExpanded(this.tasksProjectID, expandedTask.$id);
      }
    }

    openSharingModal() {
      this.showTooltip = false;

      this.$timeout(() => {
        this.showTooltip = true;
      }, 50);

      this.Broadcaster.emit({
        key: "7c5ba180-33f6-481f-a4cb-635d35e331ae",
        message: "opensharingmodal",
        value: true,
      });
    }

    closeSharingModal() {
      this.sharingModalOpened = false;
    }
  }

  angular.module("app").directive("tokkSelectedProject", tokkSelectedProject);
}
