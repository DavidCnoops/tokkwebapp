///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  export class Today {
    private countdown: any;
    public timezone: string;
    public isoDate: string;
    private behaviorSubject: Rx.BehaviorSubject<string>;
    public replay: Rx.Observable<string>;

    // DEBUG
    // private devMillisecondsUntilTomorrow: number;

    constructor(
      private $q: ng.IQService,
      private $log: ng.ILogService,
      private Auth: Auth,
      private WorkerTimer: WorkerTimer,
      private FirebaseUtils: FirebaseUtils
    ) {
      this.countdown = null;
      this.timezone = null;
      this.isoDate = null;
      this.behaviorSubject = new Rx.BehaviorSubject(null);
      this.replay = this.behaviorSubject.distinctUntilChanged().publishReplay(1).refCount();

      // DEBUG
      // this.devMillisecondsUntilTomorrow = 2000;
    }

    set(isoDate: string, timezone: string) {
      this.timezone = timezone;
      this.isoDate = isoDate;
      moment.tz.setDefault(timezone);
      this.behaviorSubject.next(isoDate);
      this.countdownToNextDay(isoDate);
    }

    private countdownToNextDay(currentISODate: string) {
      const nextDay = moment(currentISODate, "YYYY-MM-DD", true).add(1, "days").startOf("day");
      const nextISODate = nextDay.format("YYYY-MM-DD");
      const millisecondsUntilNextDay = nextDay.diff(moment().tz(this.timezone), "milliseconds");

      /*
            // DEBUG
            console.log('timezone: ' + this.timezone);
            console.log('today: ' + currentISODate);
            console.log('tomorrow: ' + nextDay.format('YYYY-MM-DD'));
            console.log('milliseconds until tomorrow: ' + millisecondsUntilNextDay);
            const d = moment.duration(millisecondsUntilNextDay, 'milliseconds');
            const hours = Math.floor(d.asHours());
            const mins = Math.floor(d.asMinutes()) - hours * 60;
            console.log('time until tomorrow: ' + hours + ' hours ' + mins + ' minutes');
            */

      if (this.countdown !== null) {
        this.WorkerTimer.clearTimeout(this.countdown);
        this.countdown = null;
      }

      this.countdown = this.WorkerTimer.setTimeout(
        () => {
          this.dayChange(currentISODate, nextISODate);
          this.countdownToNextDay(nextISODate);
        },
        millisecondsUntilNextDay,
        this
      );

      // DEBUG
      // }, this.devMillisecondsUntilTomorrow, this);
      // this.devMillisecondsUntilTomorrow = 50000000;
    }

    private dayChange(oldISODate: string, newISODate: string) {
      Rx.Observable.combineLatest(this.observe(oldISODate), this.observe(newISODate), (s1, s2) => {
        return {
          old_entries: s1,
          new_entries: s2,
        };
      })
        .first()
        .subscribe((data) => {
          const oldActiveEntry = _(data.old_entries).find((entry) => entry.active === true);

          if (oldActiveEntry) {
            this.pauseEntry(oldActiveEntry);
            this.transferEntryToNewDay(data.new_entries, oldActiveEntry, newISODate);
          }

          this.set(newISODate, this.timezone);
        });
    }

    private observe(isoDate: string) {
      const ref = firebase.default
        .database()
        .ref(`group/${this.Auth.userGroup}/user/${this.Auth.userUID}/time_entries/`)
        .orderByChild("entry_date")
        .equalTo(isoDate);
      return this.FirebaseUtils.arrayStream<IEntry>("today", ref, false, false, false, isoDate).observable;
    }

    private pauseEntry(entry: IEntry) {
      return new this.$q((resolve, reject) => {
        const ref = firebase.default
          .database()
          .ref(`group/${this.Auth.userGroup}/user/${this.Auth.userUID}/time_entries/${entry.$id}`);
        const object: IUpdatedEntry = {
          seconds: entry.seconds,
          active: false,
          last_paused: Date.now(),
        };

        // deactive entry and add seconds since last started
        ref.update(object, (error) => {
          if (error) {
            this.$log.error("Error for pauseEntry() of service Today", error);
            reject(error);
          } else {
            resolve();
          }
        });
      });
    }

    private transferEntryToNewDay(newEntries: Array<IEntry>, oldActiveEntry: IEntry, isoDate: string) {
      const existingEntry = _(newEntries).find((entry) => {
        return entry.project_slug === oldActiveEntry.project_slug && entry.task_slug === oldActiveEntry.task_slug;
      });

      if (existingEntry) {
        return this.startExistingEntry(existingEntry);
      } else {
        return this.createAndStartEntry(newEntries, oldActiveEntry, isoDate);
      }
    }

    private startExistingEntry(entry: IEntry) {
      return new this.$q((resolve, reject) => {
        const ref = firebase.default
          .database()
          .ref(`group/${this.Auth.userGroup}/user/${this.Auth.userUID}/time_entries/${entry.$id}`);
        const object: IUpdatedEntry = {
          active: true,
          last_started: Date.now(),
        };

        ref.update(object, (error) => {
          if (error) {
            this.$log.error("Error for startExistingEntry() of service Today", error);
            reject();
          } else {
            resolve();
          }
        });
      });
    }

    private createAndStartEntry(entries: Array<IEntry>, entry: IEntry, isoDate: string) {
      return new this.$q((resolve, reject) => {
        const ref = firebase.default
          .database()
          .ref(`group/${this.Auth.userGroup}/user/${this.Auth.userUID}/time_entries/`);
        let newEntry: INewEntry = {
          active: true,
          created_at: Date.now(),
          entry_date: isoDate,
          last_started: Date.now(),
          last_paused: false,
          project_name: entry.project_name,
          project_slug: entry.project_slug,
          seconds: 0,
          task_name: entry.task_name,
          task_slug: entry.task_slug,
          user_uid: entry.user_uid,
          position: _.isArray(entries) ? entries.length : 0,
        };

        if (entry.tags) {
          newEntry = { ...newEntry, tags: entry.tags };
        }

        ref.push(newEntry, (error) => {
          if (error) {
            this.$log.error("Error for createAndStartEntry() of service Today", error);
            reject();
          } else {
            resolve();
          }
        });
      });
    }
  }

  angular.module("app").service("Today", Today);
}
