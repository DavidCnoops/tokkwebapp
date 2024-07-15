///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  const styles = require("tokkPinner.css");

  function tokkPinner() {
    return {
      scope: {},
      bindToController: {
        opened: "<",
        close: "&",
      },
      restrict: "E",
      templateUrl: "tokkPinner.template.html",
      controller: PinnerController,
      controllerAs: "vm",
    };
  }

  class PinnerController {
    public styles: any;
    public opened: boolean;
    public close: () => void;
    public entryCount: number;
    public tasks: Array<PinnerTask>;
    public projects: Array<IUpdatedUserProjectListItem>;
    public noProjects: boolean;
    public tasksLoaded: boolean;
    public isoDate: string;
    public selectedProject: IUserProjectListItem;
    public selectedProjectSubject: Rx.Subject<IUserProjectListItem>;
    public selectedTask: IUserProjectTask;
    public selectedTaskSubject: Rx.Subject<IUserProjectTask>;
    public taskPinned: boolean;
    public subscriptions: Array<Rx.Subscription>;
    public listener: () => void;

    constructor(
      private $scope: ng.IScope,
      private UserProjectsList: UserProjectsList,
      private UserProjectTaskTags: UserProjectTaskTags,
      private PinnerTasks: PinnerTasks,
      private Day: Day,
      private Auth: Auth
    ) {}

    $onInit() {
      this.styles = styles;
      this.entryCount = null;
      this.tasks = null;
      this.projects = null;
      this.noProjects = false;
      this.tasksLoaded = false;
      this.isoDate = null;
      this.selectedProject = null;
      this.selectedProjectSubject = new Rx.Subject<IUserProjectListItem>();
      this.selectedTask = null;
      this.selectedTaskSubject = new Rx.Subject<IUserProjectTask>();
      this.taskPinned = false;
      this.subscriptions = [];
      this.listener = this.$scope.$watch(
        () => this.opened,
        (newValue, oldValue) => {
          if (oldValue !== true && newValue === true) {
            this.unsubscribe();

            this.subscriptions = [
              this.UserProjectsList.observe().subscribe((projects) => {
                this.noProjects = projects && projects.length > 0 ? false : true;

                const processedProjects = _(projects)
                  .map((project) => {
                    return {
                      ...project,
                      status: project.completed ? "Completed lists" : "Active lists",
                    };
                  })
                  .value();

                this.projects = _.orderBy(
                  processedProjects,
                  [(project) => project.status, (project) => project.position],
                  ["asc", "desc"]
                );

                this.$scope.$evalAsync();
              }),

              Rx.Observable.combineLatest(
                this.Day.replay.filter((isoDate) => _.isString(isoDate) && !_.isEmpty(isoDate)).distinctUntilChanged(),

                this.selectedProjectSubject.distinctUntilChanged(),

                this.selectedTaskSubject.distinctUntilChanged(),

                (s1, s2, s3) => {
                  return {
                    iso_date: s1,
                    selected_project: s2,
                    selected_task: s3,
                  };
                }
              )
                .do((data) => {
                  this.isoDate = data.iso_date;
                  this.entryCount = null;
                  this.tasks = null;
                  this.tasksLoaded = false;
                  this.$scope.$evalAsync();
                })
                .filter((data) => data.selected_project !== null)
                .switchMap((data) => {
                  return Rx.Observable.combineLatest(
                    this.Day.observe(data.iso_date),
                    this.PinnerTasks.observe(data.selected_project.user_project_id),
                    (s1, s2) => {
                      return {
                        iso_date: data.iso_date,
                        selected_project: data.selected_project,
                        selected_task: data.selected_task,
                        entries: s1,
                        tasks: s2,
                      };
                    }
                  );
                })
                .subscribe((data) => {
                  this.entryCount = _.size(data.entries);
                  this.tasksLoaded = data.selected_project && data.tasks ? true : false;
                  this.tasks = this.getPinnerTasks(data.selected_project, data.tasks, data.entries);

                  if (
                    !data.selected_project ||
                    !data.selected_task ||
                    this.isTaskPinned(data.selected_project, data.selected_task, data.entries)
                  ) {
                    this.selectedTask = null;
                  }

                  this.$scope.$evalAsync();
                }),
            ];
          }

          if (oldValue !== false && newValue === false) {
            this.selectedProject = null;
            this.selectedTask = null;
            this.tasksLoaded = false;
            this.selectedProjectSubject.next(null);
            this.selectedTaskSubject.next(null);
            this.unsubscribe();
          }
        },
        true
      );
    }

    $onDestroy() {
      this.listener();
      this.unsubscribe();
    }

    unsubscribe() {
      _(this.subscriptions).forEach((subscription) => subscription.unsubscribe());
      this.subscriptions = [];
    }

    getPinnerTasks(project: IUserProjectListItem, tasks: Array<PinnerTask>, entries: Array<IEntry>) {
      const processedTasks = _(tasks)
        .map((task) => {
          return {
            ...task,
            selectable: !this.isTaskPinned(project, task, entries),
            status: task.task_completed ? "Completed tasks" : "Active tasks",
          };
        })
        .value();

      return _.orderBy(processedTasks, [(task) => task.status, (task) => task.position], ["asc", "desc"]);
    }

    isTaskPinned(project: IUserProjectListItem, task: IUserProjectTask, entries: Array<IEntry>) {
      if (project && task && entries) {
        return _(entries).some(
          (entry) => entry.project_slug === project.project_slug && entry.task_slug === task.task_slug
        );
      }

      return false;
    }

    projectSelected(selectedProject: IUserProjectListItem) {
      this.selectedProjectSubject.next(selectedProject);
      this.selectedTaskSubject.next(null);
    }

    taskSelected(selectedTask: IUserProjectTask) {
      this.selectedTaskSubject.next(selectedTask);
    }

    addEntryToDay(project: IUserProjectListItem, task: IUserProjectTask) {
      if (project && task) {
        this.buildEntryObject(project, task).then((entry) => {
          this.selectedTask = null;
          this.Day.add(entry);
        });
      }
    }

    buildEntryObject(project: IUserProjectListItem, task: IUserProjectTask) {
      return this.UserProjectTaskTags.getOnceForUserAndTask(this.Auth.userUID, project.user_project_id, task.$id).then(
        (tags) => {
          const tagSlugs = _(tags)
            .map((tag) => tag.tag_slug)
            .value();

          return <INewEntry>{
            active: false,
            created_at: Date.now(),
            entry_date: this.isoDate,
            last_started: false,
            last_paused: false,
            seconds: 0,
            user_uid: this.Auth.userUID,
            project_name: project.project_name,
            project_slug: project.project_slug,
            task_name: task.task_name,
            task_slug: task.task_slug,
            position: this.entryCount,
            tags: tagSlugs && tagSlugs.length > 0 ? tagSlugs : null,
          };
        }
      );
    }
  }

  angular.module("app").directive("tokkPinner", tokkPinner);
}
