///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  const styles = require("tokkAddSubtask.css");

  function tokkAddSubtask() {
    return {
      scope: {},
      bindToController: {
        userUID: "@useruid",
        projectID: "@projectid",
        tasksProjectID: "@tasksprojectid",
        taskID: "@taskid",
      },
      restrict: "E",
      templateUrl: "tokkAddSubtask.template.html",
      controller: AddSubtaskController,
      controllerAs: "vm",
    };
  }

  class AddSubtaskController {
    public styles: any;
    public userUID: string;
    public projectID: string;
    public tasksProjectID: string;
    public taskID: string;
    public myFullName: string;
    public nameExtension: string;
    public input: HTMLInputElement;
    public inputText: string;
    public subtaskCount: number;
    public task: IUserProjectTask;
    public project: IUserProject;
    public subscriptions: Array<Rx.Subscription>;

    constructor(
      private $scope: ng.IScope,
      private $timeout: ng.ITimeoutService,
      private $element: ng.IRootElementService,
      private Auth: Auth,
      private Utilities: Utilities,
      private Users: Users,
      private UserProject: UserProject,
      private UserProjectTasks: UserProjectTasks,
      private UserProjectSubtasks: UserProjectSubtasks,
      private Notifications: Notifications,
      private Streams: Streams
    ) {}

    $onInit() {
      this.styles = styles;
      this.myFullName = null;
      this.nameExtension = null;
      this.input = null;
      this.inputText = null;
      this.subtaskCount = null;
      this.task = null;
      this.project = null;

      this.$timeout(() => {
        this.input = this.$element[0].querySelector(`.${this.styles.input}`);
      });

      this.subscriptions = [
        Rx.Observable.combineLatest(
          this.Streams.stream.sharing.replay.distinctUntilChanged(),

          this.Users.observe(),

          (s1, s2) => {
            return {
              useruid: s1,
              users: s2,
            };
          }
        ).subscribe((data) => {
          this.nameExtension = "";
          this.myFullName = this.Utilities.getFullName(this.Auth.userUID, data.users);

          if (this.Auth.userUID !== data.useruid) {
            const user = _(data.users).find((user) => user.$id === data.useruid);
            this.nameExtension = user ? ` to ${user.first_name}'s list` : ``;
          }

          this.$scope.$evalAsync();
        }),

        this.UserProjectTasks.observe(this.userUID, this.tasksProjectID)
          .filter((items) => items !== null)
          .switchMap((tasks) => Rx.Observable.from(tasks))
          .filter((task) => task.$id === this.taskID)
          .distinctUntilChanged()
          .subscribe((task) => {
            this.task = task;
          }),

        this.UserProject.observe(this.projectID).subscribe((project) => {
          this.project = project;
        }),

        this.UserProjectSubtasks.observe(this.userUID, this.tasksProjectID, this.taskID).subscribe((subtasks) => {
          this.subtaskCount = subtasks ? subtasks.length : 0;
        }),
      ];

      this.$scope.$on("$destroy", () => {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
      });
    }

    add(
      userUID: string,
      tasksProjectID: string,
      taskID: string,
      project: IUserProject,
      task: IUserProjectTask,
      subtaskCount: number,
      senderFullName: string,
      inputText: string
    ) {
      const projectName = project.project_name;
      const projectSlug = project.project_slug;
      const taskName = task.task_name;
      const taskSlug = task.task_slug;
      const subtaskName = _.trim(inputText);
      const subtaskSlug = this.Utilities.slugify(subtaskName);

      this.input.focus();

      if (_.isString(subtaskName) && subtaskName.length > 0) {
        this.UserProjectSubtasks.add(userUID, tasksProjectID, taskID, {
          subtask_name: subtaskName,
          subtask_slug: subtaskSlug,
          subtask_added: <number>firebase.default.database.ServerValue.TIMESTAMP,
          subtask_completed: false,
          position: subtaskCount,
        }).then(() => {
          if (userUID !== this.Auth.userUID) {
            this.Notifications.add(userUID, {
              type: "subtaskassigned",
              sender_uid: this.Auth.userUID,
              sender_name: senderFullName,
              project_name: projectName,
              project_slug: projectSlug,
              task_name: taskName,
              task_slug: taskSlug,
              subtask_name: subtaskName,
              subtask_slug: subtaskSlug,
            });
          }
        });

        this.$timeout(() => {
          this.inputText = null;
        }, 50);
      }
    }
  }

  angular.module("app").directive("tokkAddSubtask", tokkAddSubtask);
}
