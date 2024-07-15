///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  const styles = require("tokkEntry.css");

  function tokkEntry() {
    return {
      scope: {},
      bindToController: {
        isoDate: "@isodate",
        entryID: "@entryid",
        projectSlug: "@projectslug",
        dragKey: "@dragkey",
      },
      restrict: "E",
      templateUrl: "tokkEntry.template.html",
      controller: EntryController,
      controllerAs: "vm",
    };
  }

  class EntryController {
    public styles: any;
    public isoDate: string;
    public entryID: string;
    public projectSlug: string;
    public dragKey: string;
    public entry: IDayEntry;
    public hh: string;
    public mm: string;
    public ss: string;
    public hhmm: string;
    public isSafari: boolean;
    public isToday: boolean;
    public isDayFullscreen: boolean;
    public editing: boolean;
    public clickHold: angular.IPromise<any>;
    public project: IUserProjectListItem;
    public colorHex: string;
    public colorName: string;
    public inputElement: HTMLInputElement;
    public inputSubscriptions: Array<Rx.Subscription>;
    public subscriptions: Array<Rx.Subscription>;

    constructor(
      private $element: ng.IRootElementService,
      private $timeout: ng.ITimeoutService,
      private $scope: ng.IScope,
      private Auth: Auth,
      private Day: Day,
      private Today: Today,
      private UserProjectsList: UserProjectsList,
      private UserProject: UserProject,
      private UserProjectTasks: UserProjectTasks,
      private Streams: Streams,
      private Colors: Colors,
      private Broadcaster: Broadcaster,
      private ReplayBroadcaster: ReplayBroadcaster,
      private Entries: Entries,
      private Utilities: Utilities,
      private keys: IKeys
    ) {}

    $onInit() {
      this.styles = styles;
      this.editing = false;
      this.clickHold = null;
      this.project = null;
      this.colorHex = null;
      this.colorName = null;
      this.entry = null;
      this.hh = null;
      this.mm = null;
      this.ss = null;
      this.hhmm = null;
      this.isSafari = bowser.safari;
      this.isToday = false;
      this.isDayFullscreen = false;
      this.inputElement = null;
      this.inputSubscriptions = [];
      this.subscriptions = [];

      this.subscriptions = [
        this.Streams.stream.fullscreen.replay.subscribe((value) => {
          this.isDayFullscreen = value;
          this.$scope.$evalAsync();
        }),

        Rx.Observable.combineLatest(
          this.Today.replay.filter((isoDate) => _.isString(isoDate) && !_.isEmpty(isoDate)).distinctUntilChanged(),

          this.Day.replay.filter((isoDate) => _.isString(isoDate) && !_.isEmpty(isoDate)).distinctUntilChanged(),

          this.Day.observe(this.isoDate)
            .filter((entries) => _.isArray(entries) && !_.isEmpty(entries))
            .switchMap((entries) => Rx.Observable.from(entries))
            .filter((entry) => entry.$id === this.entryID)
            .distinctUntilChanged(),

          this.UserProjectsList.observe()
            .filter((projects) => _.isArray(projects) && !_.isEmpty(projects))
            .switchMap((projects) => Rx.Observable.from(projects))
            .filter((project) => project.project_slug === this.projectSlug)
            .distinctUntilChanged(),

          this.ReplayBroadcaster.observeKey(this.dragKey),

          (s1, s2, s3, s4, s5) => {
            return {
              today_iso_date: s1,
              iso_date: s2,
              entry: s3,
              project: s4,
              broadcast: s5,
            };
          }
        ).subscribe((data) => {
          this.project = data.project;
          this.colorName = data.project ? data.project.color : null;
          this.colorHex = data.project ? this.Colors.list[data.project.color] : null;
          this.isToday = data.iso_date === data.today_iso_date;

          if (data.broadcast && data.broadcast.message === "sorting" && data.broadcast.value.status === "started") {
            this.$timeout.cancel(this.clickHold);
          } else {
            const splittedTime = this.Utilities.secondsToHHMMSSArray(data.entry.seconds);
            this.entry = data.entry;
            this.hh = splittedTime[0];
            this.mm = splittedTime[1];
            this.ss = splittedTime[2];
            this.hhmm = moment(data.iso_date).startOf("day").seconds(data.entry.seconds).format("HH:mm");

            this.setTimeInput(this.hhmm);

            if (this.editing && this.inputElement) {
              const caretPosition = this.inputElement
                ? this.Utilities.getContentEditableCaretPosition(this.inputElement)
                : null;

              if (_.isNumber(caretPosition) && caretPosition < 6) {
                this.Utilities.setContentEditableCaretPosition(this.inputElement, caretPosition);
              }
            }
          }

          this.$scope.$evalAsync();
        }),
      ];
    }

    $postLink() {
      this.$timeout(() => {
        this.inputElement = this.$element[0].querySelector(`.${this.styles.input}`);
      });
    }

    $onDestroy() {
      _(this.subscriptions).forEach((subscription) => subscription.unsubscribe());
      _(this.inputSubscriptions).forEach((subscription) => subscription.unsubscribe());
    }

    setTimeInput(hhmm: string) {
      if (this.inputElement && this.inputElement.textContent && this.inputElement.textContent !== hhmm) {
        this.inputElement.textContent = hhmm;
      }
    }

    toggleTimer(isoDate: string, entry: IDayEntry, event: MouseEvent) {
      event.stopPropagation();

      if (entry.active) {
        this.Day.pause(entry);
      } else {
        this.Day.start(isoDate, entry);
      }
    }

    mouseDown(action: string) {
      const repeat = () => {
        if (action === "increment") {
          this.incrementTime();
        } else if (action === "decrement") {
          this.decrementTime();
        }

        this.clickHold = this.$timeout(() => repeat(), 180);
      };

      this.clickHold = this.$timeout(() => repeat(), 180);
    }

    mouseUp() {
      this.$timeout.cancel(this.clickHold);
    }

    startEditing() {
      if (!this.editing && !this.entry.active) {
        this.editing = true;

        this.focus();

        _(this.inputSubscriptions).forEach((subscription) => subscription.unsubscribe());

        this.inputSubscriptions = [
          Rx.Observable.fromEvent(window, "wheel")
            .do((event: MouseEvent) => event.preventDefault())
            .throttleTime(50)
            .subscribe((event: WheelEvent) => {
              if (event.deltaY < 0) {
                this.Day.incrementTimeBy15min(this.isoDate, this.entry.$id, true);
              } else if (event.deltaY > 0) {
                this.Day.decrementTimeBy15min(this.isoDate, this.entry.$id, true);
              }
            }),

          Rx.Observable.fromEvent(this.inputElement, "keydown")
            .filter((event: KeyboardEvent) => event.which === this.keys.arrowDown || event.which === this.keys.arrowUp)
            .subscribe((event: KeyboardEvent) => {
              event.preventDefault();

              if (event.which === this.keys.arrowDown) {
                this.Day.decrementTimeBy15min(this.isoDate, this.entry.$id, true);
              } else if (event.which === this.keys.arrowUp) {
                this.Day.incrementTimeBy15min(this.isoDate, this.entry.$id, true);
              }
            }),

          Rx.Observable.fromEvent(this.inputElement, "keyup")
            .filter((event: KeyboardEvent) => event.which !== this.keys.arrowDown && event.which !== this.keys.arrowUp)
            .subscribe((event: KeyboardEvent) => {
              if (this.inputElement.textContent.match(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/)) {
                const seconds = moment.duration(this.inputElement.textContent).asSeconds();

                if (_.isNumber(seconds) && seconds >= 0 && seconds <= 86340) {
                  this.Day.updateLocal(this.isoDate, this.entryID, {
                    seconds: seconds,
                  });
                }
              }
            }),
        ];
      }
    }

    stopEditing() {
      if (this.editing) {
        this.editing = false;

        this.inputElement.blur();
        window.getSelection().removeAllRanges();
        _(this.inputSubscriptions).forEach((subscription) => subscription.unsubscribe());

        if (this.inputElement.textContent.match(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/)) {
          const seconds = moment.duration(this.inputElement.textContent).asSeconds();

          if (_.isNumber(seconds) && seconds >= 0 && seconds <= 86340) {
            this.Day.updateFirebase(this.entry.$id, { seconds: seconds });
          } else {
            this.Day.updateLocal(this.isoDate, this.entryID, {
              seconds: this.entry.seconds,
            });
          }
        } else {
          this.Day.updateLocal(this.isoDate, this.entryID, {
            seconds: this.entry.seconds,
          });
        }
      }
    }

    focus() {
      this.inputElement.focus();
      this.Utilities.setCaretAtEnd(this.inputElement);
    }

    incrementTime() {
      this.stopEditing();
      this.Day.incrementTimeBy15min(this.isoDate, this.entry.$id);
    }

    decrementTime() {
      this.stopEditing();
      this.Day.decrementTimeBy15min(this.isoDate, this.entry.$id);
    }

    remove(entry: IEntry, event: MouseEvent) {
      event.stopPropagation();

      if (entry.seconds === 0) {
        this.Entries.remove(entry);
      } else {
        this.Broadcaster.emit({
          key: "31703e25-7303-4105-9647-7bb3cdc20e29",
          message: "unpin",
          value: entry.$id,
        });
      }
    }

    expandTask(projectID: string, taskSlug: string) {
      if (!this.isDayFullscreen) {
        const selectedProjectElement = <HTMLDivElement>document.querySelector(".selectedProject");

        if (!selectedProjectElement.classList.contains("noTranslateAnimation")) {
          selectedProjectElement.classList.add("noTranslateAnimation");
        }

        Rx.Observable.combineLatest(
          this.UserProjectsList.observe()
            .filter((projects) => projects !== null)
            .switchMap((projects) => Rx.Observable.from(projects))
            .filter((project) => project.user_project_id === projectID),

          this.UserProjectTasks.observe(this.Auth.userUID, projectID)
            .filter((tasks) => tasks !== null)
            .switchMap((tasks) => Rx.Observable.from(tasks))
            .filter((task) => task.task_slug === taskSlug),

          this.UserProject.replay,

          (s1, s2, s3) => {
            return {
              project: s1,
              task: s2,
              selected_project_id: s3,
            };
          }
        )
          .first()
          .subscribe((data) => {
            let retry = 0;
            let queryElement = null;
            let onDomInsertEvent = null;
            const projectStatus = data.project.completed ? "completed" : "active";

            queryElement = (delay: boolean = false) => {
              const taskElement = <HTMLDivElement>document.querySelector(`.task-${data.task.$id}`);
              const cleanup = () => {
                selectedProjectElement.classList.remove("noTranslateAnimation");
                selectedProjectElement.removeEventListener("DOMNodeInserted", onDomInsertEvent, false);
              };

              if (data.task.task_completed) {
                this.Broadcaster.emit({
                  key: "a3b4f366-cb5a-48d0-94cb-d5d72c0a6799",
                  message: "showcompletedtasks",
                  value: true,
                });
              }

              if (taskElement) {
                if (_.isFunction((<any>taskElement).scrollIntoViewIfNeeded)) {
                  (<any>taskElement).scrollIntoViewIfNeeded(true);
                } else {
                  taskElement.scrollIntoView(true);
                }

                if (!data.task.expanded) {
                  if (delay) {
                    setTimeout(() => {
                      this.UserProjectTasks.toggleExpanded(projectID, data.task.$id);
                    }, 200);
                  } else {
                    this.UserProjectTasks.toggleExpanded(projectID, data.task.$id);
                  }
                }

                cleanup();
              } else if (retry < 20) {
                retry++;

                setTimeout(() => {
                  queryElement(delay);
                }, 100);
              } else if (retry === 20) {
                cleanup();
              }
            };

            onDomInsertEvent = (event) => {
              if (event && event.target && event.target.classList && _.isFunction(event.target.classList.contains)) {
                if (event.target.classList.contains(`selectedProjectContent`)) {
                  if (this.Streams.stream.sharing.value !== this.Auth.userUID) {
                    this.Streams.stream.sharing.set(this.Auth.userUID);
                  }

                  queryElement(true);
                }
              }
            };

            if (this.Streams.stream.projects.value !== projectStatus) {
              this.Streams.stream.projects.set(projectStatus);
            }

            if (data.selected_project_id === projectID) {
              if (this.Streams.stream.sharing.value !== this.Auth.userUID) {
                this.Streams.stream.sharing.set(this.Auth.userUID);
              }

              queryElement();
            } else {
              selectedProjectElement.addEventListener("DOMNodeInserted", onDomInsertEvent, false);

              setTimeout(() => {
                this.UserProject.set(projectID);
              }, 10);
            }
          });
      }
    }
  }

  angular.module("app").directive("tokkEntry", tokkEntry);
}
