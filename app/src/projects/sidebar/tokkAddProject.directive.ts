///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  const styles = require("tokkAddProject.css");

  function tokkAddProject() {
    return {
      scope: {},
      bindToController: {
        opened: "<",
        close: "&",
      },
      restrict: "E",
      templateUrl: "tokkAddProject.template.html",
      controller: AddProjectController,
      controllerAs: "vm",
    };
  }

  class AddProjectController {
    public styles: any;
    public opened: boolean;
    public close: Function;
    public projects: Array<IUserProjectListItem>;
    public notifications: Array<INotification>;
    public inputText: string;
    public projectExists: boolean;
    public colors: IColors;
    public projectColor: string;
    public groupProjects: Array<IGroupProject>;
    public subscriptionType: "free" | "business";
    public selectedProjectsFilter: "active" | "completed";
    public loaded: boolean;
    public autocompleteKey: string;
    public autocompleteOpened: boolean;
    public errorMessage: string;
    public subscriptions: Array<Rx.Subscription>;

    constructor(
      private $scope: ng.IScope,
      private $timeout: ng.ITimeoutService,
      private $element: ng.IRootElementService,
      private Utilities: Utilities,
      private Auth: Auth,
      private Streams: Streams,
      private Colors: Colors,
      private Projects: Projects,
      private UserProject: UserProject,
      private UserProjectSharing: UserProjectSharing,
      private UserProjectsList: UserProjectsList,
      private GroupProjects: GroupProjects,
      private Notifications: Notifications,
      private GroupSubscription: GroupSubscription
    ) {}

    $onInit() {
      this.styles = styles;
      this.projects = null;
      this.notifications = null;
      this.inputText = null;
      this.projectExists = false;
      this.colors = this.Colors.list;
      this.projectColor = null;
      this.groupProjects = null;
      this.subscriptionType = null;
      this.selectedProjectsFilter = null;
      this.loaded = false;
      this.autocompleteKey = this.Utilities.generateUUID();
      this.autocompleteOpened = false;
      this.errorMessage = null;

      const listener = this.$scope.$watch(
        () => this.opened,
        (newValue, oldValue) => {
          this.inputText = null;
          this.projectExists = false;
          this.projectColor = null;
          this.autocompleteOpened = false;

          if (oldValue !== true && newValue === true) {
            this.$timeout(() => {
              const input = <HTMLInputElement>this.$element[0].querySelector(".autocomplete-input");
              input.focus();
            });
          }
        },
        true
      );

      this.subscriptions = [
        Rx.Observable.combineLatest(
          this.GroupProjects.observe(),
          this.UserProjectsList.observe(),
          this.Notifications.observe(),
          this.GroupSubscription.observe(this.Auth.userGroup),
          this.Streams.stream.projects.replay.filter((value) => value !== null),
          (s1, s2, s3, s4, s5) => {
            return {
              group_projects: s1,
              projects: s2,
              notifications: s3,
              subscription: s4,
              selected_projects_filter: s5,
            };
          }
        ).subscribe((data) => {
          this.groupProjects = data.group_projects;
          this.projects = data.projects;
          this.notifications = data.notifications;
          this.subscriptionType = data.subscription.type;
          this.selectedProjectsFilter = data.selected_projects_filter;
          this.loaded = true;
          this.$scope.$evalAsync();
        }),
      ];

      this.$scope.$on("$destroy", () => {
        listener();
        _(this.subscriptions).forEach((subscription) => subscription.unsubscribe());
      });
    }

    resetError() {
      this.projectExists = false;
    }

    toggleAutocomplete() {
      this.autocompleteOpened = !this.autocompleteOpened;
    }

    setInputText(text: string) {
      this.inputText = text;
    }

    selectColor(colorName: string) {
      this.projectColor = colorName;
    }

    addProject(
      inputText: string,
      projectColor: string,
      projects: Array<IUserProjectListItem>,
      groupProjects: Array<IGroupProject>,
      notifications: Array<INotification>,
      loaded: boolean
    ) {
      const groupID = this.Auth.userGroup;
      const userUID = this.Auth.userUID;
      let projectName = _.trim(inputText);
      let projectSlug = this.Utilities.slugify(projectName);
      const validProjectSlug = _.isString(projectSlug) && projectSlug.length > 0;

      if (loaded && projectColor && validProjectSlug) {
        this.projectExists = _(projects).some((project) => project.project_slug === projectSlug);
        this.errorMessage = `You already have a list called '${projectName}'`;

        if (this.projectExists) {
          const existingProject = _(projects).find((project) => project.project_slug === projectSlug);
          const existingProjectStatus = existingProject.completed ? "completed" : "active";
          if (existingProjectStatus !== this.selectedProjectsFilter) {
            this.errorMessage += `<br />(see ${existingProjectStatus} lists)`;
          }
        }

        const projectListItemPosition = projects ? projects.filter((project) => !project.completed).length : 0;

        if (!this.projectExists) {
          const existingGroupProject = _.find(
            groupProjects,
            (groupProject) => groupProject.project_slug === projectSlug
          );
          const groupProjectID = existingGroupProject ? existingGroupProject.$id : null;
          const groupProjectCount = existingGroupProject ? existingGroupProject.count : 0;
          projectName = existingGroupProject ? existingGroupProject.project_name : projectName;
          projectSlug = existingGroupProject ? existingGroupProject.project_slug : projectSlug;

          this.Projects.add(
            groupID,
            userUID,
            projectName,
            projectSlug,
            projectColor,
            projectListItemPosition,
            groupProjectID,
            groupProjectCount
          ).then((projectID) => {
            // add pending sharing requests to the project
            this.addPendingSharingItems(projectSlug, projectID, notifications);

            // set projects list filter to active if it's not already the case
            if (this.Streams.stream.projects.value !== "active") {
              this.Streams.stream.projects.set("active");
            }

            // select the newly added project
            this.UserProject.set(projectID);
          });

          this.close();
        }
      }
    }

    private addPendingSharingItems(projectSlug: string, projectID: string, notifications: Array<INotification>) {
      _(notifications)
        .filter((notification) => {
          return (
            notification.type === "projectrequest" &&
            notification.project_slug === projectSlug &&
            notification.status === "pending"
          );
        })
        .forEach((notification) => {
          // add shared users to my UserProjectSharing list
          this.UserProjectSharing.add(this.Auth.userUID, projectID, {
            user_uid: notification.sender_uid,
            user_project_id: notification.sender_project_id,
            status: "pending",
            added: <number>firebase.default.database.ServerValue.TIMESTAMP,
          });
        });
    }
  }

  angular.module("app").directive("tokkAddProject", tokkAddProject);
}
