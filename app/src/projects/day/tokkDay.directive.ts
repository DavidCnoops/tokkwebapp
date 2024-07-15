///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  const styles = require("tokkDay.css");

  function tokkDay() {
    return {
      scope: {},
      bindToController: {},
      restrict: "E",
      templateUrl: "tokkDay.template.html",
      controller: DayController,
      controllerAs: "vm",
    };
  }

  class DayController {
    public styles: any;
    public pinnerOpened: boolean;
    public isoDate: string;
    public todayISODate: string;
    public entries: Array<IDayEntry>;
    public humanTotalSeconds: string;
    public humanDay: string;
    public humanDate: string;
    public humanDate2: string;
    public calendarOpened: boolean;
    public noEntries: boolean;
    public isDayFullscreen: boolean;
    public isToday: boolean;
    public isTiming: boolean;
    public loaded: boolean;
    public animationClass: "animationDayNext" | "animationDayPrevious" | "animationAddRemove" | "";
    public noEntriesClass: string;
    public headerElement: HTMLDivElement;
    public entriesContainerElement: HTMLDivElement;
    public dragKey: string;
    public subscriptions: Array<Rx.Subscription>;

    constructor(
      private $scope: ng.IScope,
      private $timeout: ng.ITimeoutService,
      private $element: ng.IRootElementService,
      private Day: Day,
      private Today: Today,
      private Utilities: Utilities,
      private Broadcaster: Broadcaster,
      private ReplayBroadcaster: ReplayBroadcaster,
      private Streams: Streams
    ) {}

    $onInit() {
      this.styles = styles;
      this.pinnerOpened = false;
      this.isoDate = null;
      this.todayISODate = null;
      this.entries = null;
      this.humanTotalSeconds = null;
      this.humanDay = null;
      this.humanDate = null;
      this.humanDate2 = null;
      this.calendarOpened = false;
      this.noEntries = false;
      this.isDayFullscreen = false;
      this.isToday = true;
      this.isTiming = false;
      this.loaded = false;
      this.animationClass = "";
      this.noEntriesClass = "";
      this.dragKey = this.Utilities.generateUUID();
      this.headerElement = null;

      // initialize replaybroadcaster for this.dragKey
      // what this does is create a mock drag event when this component gets loaded
      // so ReplayBroadcaster.observeKey(this.dragKey) receives an output and doesn't block the other
      // observables from sending through their information
      this.ReplayBroadcaster.emit({
        key: this.dragKey,
        message: null,
        value: null,
      });

      this.subscriptions = [
        this.Streams.stream.fullscreen.replay
          .do((value) => {
            this.isDayFullscreen = value;
            this.$scope.$evalAsync();
          })
          .filter((value) => value === false)
          .do(() => {
            const dayElement = this.$element[0].querySelector(`.${this.styles.day}`);
            if (dayElement && !dayElement.classList.contains("fullscreenLeave")) {
              dayElement.classList.add("fullscreenLeave");
            }
          })
          .delay(800)
          .subscribe(() => {
            this.$element[0].querySelector(`.${this.styles.day}`).classList.remove("fullscreenLeave");
          }),

        // observe today init and change
        this.Today.replay
          .filter((isoDate) => _.isString(isoDate) && !_.isEmpty(isoDate))
          .subscribe((isoDate) => {
            const noDaySelected = this.isoDate === null;
            const todaySelected = this.todayISODate === this.isoDate;

            if (noDaySelected || todaySelected) {
              this.gotoDay(isoDate);
            }

            this.todayISODate = isoDate;
          }),

        // observe day selection
        Rx.Observable.combineLatest(
          // entry drag event
          this.ReplayBroadcaster.observeKey(this.dragKey),

          // project loaded
          this.Broadcaster.observeKey("27dd036d-519e-42db-999f-e1df033147f6")
            .filter((data) => data.message === "projectloaded" && data.value === true)
            .do(() => {
              this.animationClass = "";

              const entryElements = this.$element[0].querySelectorAll(`.${this.styles.entry}`);

              entryElements.forEach((entryElement) => {
                entryElement.classList.remove("animationDayPrevious", "animationDayNext", "animationAddRemove");
              });
            }),

          // day change or entry add/remove
          this.Day.replay
            .filter((isoDate) => _.isString(isoDate) && !_.isEmpty(isoDate))
            .distinctUntilChanged()
            .do((isoDate) => {
              // day change
              if (this.isoDate && this.isoDate !== isoDate) {
                const entryElements = this.$element[0].querySelectorAll<HTMLDivElement>(`.${this.styles.entry}`);

                entryElements.forEach((entryElement) => {
                  entryElement.classList.remove("animationDayPrevious", "animationDayNext", "animationAddRemove");
                });

                if (!bowser.safari || (bowser.safari && bowser.version >= 12)) {
                  const offsets: Array<number> = [];

                  this.animationClass = moment(isoDate).isAfter(this.isoDate)
                    ? "animationDayNext"
                    : "animationDayPrevious";

                  entryElements.forEach((entryElement) => {
                    offsets.push(entryElement.offsetTop);
                  });

                  entryElements.forEach((entryElement, index) => {
                    entryElement.classList.remove("animationDayPrevious", "animationDayNext", "animationAddRemove");
                    entryElement.style.position = "absolute";
                    entryElement.style.left = "0px";
                    entryElement.style.top = offsets[index] + "px";

                    if (!entryElement.classList.contains(this.animationClass)) {
                      entryElement.classList.add(this.animationClass);
                    }
                  });
                }
              }
            })
            .switchMap((isoDate) => {
              return this.Day.observe(isoDate)
                .do((entries) => {
                  const oldEntriesCount = _.size(
                    _(this.entries)
                      .filter((entry) => !_.startsWith(entry.$id, "empty"))
                      .value()
                  );
                  const newEntriesCount = _.size(entries);

                  // entry add/remove
                  if (this.isoDate === isoDate && oldEntriesCount !== newEntriesCount && !bowser.safari) {
                    this.animationClass = newEntriesCount > 0 ? "animationAddRemove" : "";

                    if (oldEntriesCount === 0) {
                      const widgetElement = this.$element[0].querySelector<HTMLDivElement>(
                        `.${this.styles.messageContainer}`
                      );

                      if (widgetElement) {
                        widgetElement.style.display = "none";
                      }
                    }

                    const entryElements = this.$element[0].querySelectorAll<HTMLDivElement>(`.${this.styles.entry}`);

                    entryElements.forEach((entryElement) => {
                      entryElement.classList.remove("animationDayPrevious", "animationDayNext", "animationAddRemove");

                      if (!entryElement.classList.contains("animationAddRemove")) {
                        entryElement.classList.add("animationAddRemove");
                      }
                    });
                  }
                })
                .map((entries) => {
                  return {
                    entries: entries,
                    iso_date: isoDate,
                  };
                });
            }),

          (s1, s2, s3) => {
            return {
              broadcast: s1,
              iso_date: s3.iso_date,
              entries: s3.entries,
            };
          }
        ).subscribe((data) => {
          this.isoDate = data.iso_date;
          this.humanDay =
            data.iso_date === this.Today.isoDate ? "Today" : moment(data.iso_date, "YYYY-MM-DD", true).format("dddd");
          this.humanDate = this.getHumanDate(data.iso_date);
          this.humanDate2 =
            data.iso_date === this.Today.isoDate
              ? `today (${moment(data.iso_date, "YYYY-MM-DD", true).format("dddd, MMMM D")})`
              : moment(data.iso_date, "YYYY-MM-DD", true).format("dddd, MMMM D");
          this.isTiming = _(data.entries).some((entry) => entry.active);
          this.isToday = data.iso_date === this.Today.isoDate ? true : false;
          this.noEntries = false;
          this.noEntriesClass = "";
          this.loaded = true;

          if (!(data.broadcast && data.broadcast.message === "sorting" && data.broadcast.value.status === "started")) {
            this.humanTotalSeconds = this.Utilities.humanizeSeconds(
              _.reduce(data.entries, (sum, entry) => sum + entry.seconds, 0)
            );

            if (_.isArray(data.entries) && !_.isEmpty(data.entries)) {
              this.entries = _.orderBy(data.entries, [(entry) => entry.position], ["desc"]);
            } else if (!this.noEntries) {
              this.noEntries = true;
              this.noEntriesClass = `${this.styles.noEntries} nodrag`;
              this.entries = [<any>{ $id: "empty" + Date.now() }];
            }
          }

          if (!this.entriesContainerElement) {
            this.$timeout(() => {
              this.entriesContainerElement = this.$element[0].querySelector(`.${this.styles.entriesContainer}`);
            }, 50);
          }

          this.$scope.$evalAsync();
        }),
      ];
    }

    $onDestroy() {
      this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    }

    scrolling(position: number) {
      const action = () => {
        if (position === 0) {
          this.headerElement.classList.remove("showSeparator");
        } else if (!this.headerElement.classList.contains("showSeparator")) {
          this.headerElement.classList.add("showSeparator");
        }
      };

      if (!this.headerElement) {
        this.headerElement = this.$element[0].querySelector(`.${this.styles.header}`);

        if (this.headerElement) {
          action();
        }
      } else {
        action();
      }
    }

    toggleFullscreen() {
      this.Streams.stream.fullscreen.set(!this.isDayFullscreen);
    }

    scrollToTop() {
      if (this.entriesContainerElement) {
        this.entriesContainerElement.scrollTop = 0;
      }
    }

    gotoDay(isoDate: string) {
      this.scrollToTop();
      this.Day.set(isoDate);
    }

    gotoNextDay() {
      this.scrollToTop();
      const newIsoDate = moment(this.isoDate, "YYYY-MM-DD", true).add(1, "days").format("YYYY-MM-DD");
      this.Day.set(newIsoDate);
    }

    gotoPreviousDay() {
      this.scrollToTop();
      const newIsoDate = moment(this.isoDate, "YYYY-MM-DD", true).subtract(1, "days").format("YYYY-MM-DD");
      this.Day.set(newIsoDate);
    }

    gotoToday() {
      this.scrollToTop();
      this.Day.set(this.Today.isoDate);
    }

    getHumanDate(isoDate: string) {
      const momentDate = moment(isoDate, "YYYY-MM-DD", true);
      const month = momentDate.format("MMM");
      const day = momentDate.format("D");
      return `${month} ${day}`;
    }

    openPinner() {
      this.closeCalendar();
      this.pinnerOpened = true;
    }

    togglePinner() {
      this.closeCalendar();
      this.pinnerOpened = !this.pinnerOpened;
    }

    closePinner() {
      this.pinnerOpened = false;
    }

    toggleCalendar() {
      this.closePinner();
      this.calendarOpened = !this.calendarOpened;
    }

    closeCalendar() {
      this.calendarOpened = false;
    }

    updatePositions(oldIndex: number, newIndex: number, draggedItemID: string) {
      this.Day.updatePositions(this.isoDate, draggedItemID, oldIndex, newIndex);
    }
  }

  angular.module("app").directive("tokkDay", tokkDay);
}
