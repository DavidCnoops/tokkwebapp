///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  const styles = require("tokkProjectsList.css");

  function tokkProjectsList() {
    return {
      scope: {},
      bindToController: {},
      restrict: "E",
      templateUrl: "tokkProjectsList.template.html",
      controller: ProjectsListController,
      controllerAs: "vm",
    };
  }

  class ProjectsListController {
    public styles: any;
    public colors: IColors;
    public filteredProjects: Array<IUserProjectListItem>;
    public selectedProjectID: string;
    public subscriptions: Array<Rx.Subscription>;

    constructor(
      private $scope: ng.IScope,
      private UserProjectsList: UserProjectsList,
      private UserProject: UserProject,
      private Streams: Streams,
      private Auth: Auth,
      private Colors: Colors,
      private Broadcaster: Broadcaster
    ) {}

    $onInit() {
      this.styles = styles;
      this.colors = this.Colors.list;
      this.filteredProjects = null;
      this.selectedProjectID = null;

      // set initial values for streams
      this.UserProject.set("initializing");
      this.Streams.stream.projects.set("active");

      this.subscriptions = [
        Rx.Observable.combineLatest(
          this.UserProjectsList.observe(),

          this.Streams.stream.projects.replay.filter((value) => value !== null),

          this.UserProject.replay,

          (s1, s2, s3) => {
            return {
              projects: s1,
              filter: s2,
              selected_project_id: s3,
            };
          }
        ).subscribe((data) => {
          const filterStatus = data.filter === "active" ? false : true;

          this.selectedProjectID = null;

          this.filteredProjects = _.orderBy(
            _(data.projects)
              .filter((project) => project.completed === filterStatus)
              .value(),
            [(project) => project.position],
            ["desc"]
          );

          if (_.isArray(this.filteredProjects) && !_.isEmpty(this.filteredProjects)) {
            const isSelectedProjectInFilteredProjects = _(this.filteredProjects).some(
              (listItem) => listItem.user_project_id === data.selected_project_id
            );
            this.selectedProjectID = isSelectedProjectInFilteredProjects
              ? data.selected_project_id
              : this.filteredProjects[0].user_project_id;
          }

          if (this.selectedProjectID !== data.selected_project_id) {
            this.UserProject.set(this.selectedProjectID);

            // if there is no project to load
            if (this.selectedProjectID === null) {
              // manually send out a 'projectloaded' broadcast to make sure any subscribers of
              // this broadcast key do not keep waiting for a project to finish loading
              this.Broadcaster.emit({
                key: "27dd036d-519e-42db-999f-e1df033147f6",
                message: "projectloaded",
                value: true,
              });
            }
          }

          this.$scope.$evalAsync();
        }),
      ];

      this.$scope.$on("$destroy", () => {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
      });
    }

    getBackgroundColor(colorHex: string) {
      const r = parseInt(colorHex.substring(1, 3), 16);
      const g = parseInt(colorHex.substring(3, 5), 16);
      const b = parseInt(colorHex.substring(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, 0.1)`;
    }

    select(projectID: string) {
      this.UserProject.set(projectID);
    }

    updatePositions(oldIndex: number, newIndex: number, draggedItemID: string) {
      const project = _(this.filteredProjects).find((project) => project.$id === draggedItemID);
      this.UserProjectsList.updatePositions(this.Auth.userUID, project.completed, oldIndex, newIndex, draggedItemID);
    }
  }

  angular.module("app").directive("tokkProjectsList", tokkProjectsList);
}
