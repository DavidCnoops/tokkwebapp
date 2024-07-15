///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  export interface IDayEntry extends IEntry {
    timer: number;
    server_seconds: number;
  }

  export interface IUpdatedDayEntry extends IUpdatedEntry {
    timer?: number;
  }

  export class Day {
    private stream: { [key: string]: IFirebaseArrayStream<IDayEntry> };
    private behaviorSubject: Rx.BehaviorSubject<string>;
    public replay: Rx.Observable<string>;

    constructor(
      private $q: ng.IQService,
      private $log: ng.ILogService,
      private Auth: Auth,
      private WorkerTimer: WorkerTimer,
      private FirebaseUtils: FirebaseUtils,
      private firebaseDatabaseURL: string
    ) {
      this.stream = {};
      this.behaviorSubject = new Rx.BehaviorSubject(null);
      this.replay = this.behaviorSubject.distinctUntilChanged().publishReplay(1).refCount();
    }

    ref() {
      return firebase.default.database().ref(`group/${this.Auth.userGroup}/user/${this.Auth.userUID}/time_entries/`);
    }

    observe(isoDate: string) {
      const ref = this.ref().orderByChild("entry_date").equalTo(isoDate);

      const onChildAdded = (list: Array<IDayEntry>, firebaseEntry: IEntry) => {
        const newLocalEntry: IDayEntry = {
          ...firebaseEntry,
          server_seconds: firebaseEntry.seconds,
          timer: firebaseEntry.active ? this.startTimer(isoDate, firebaseEntry.$id, firebaseEntry.seconds) : null,
        };

        return newLocalEntry;
      };

      const onChildChanged = (list: Array<IDayEntry>, firebaseEntry: IEntry) => {
        const oldLocalEntry = _(list).find((listItem) => listItem.$id === firebaseEntry.$id);

        const newLocalEntry: IDayEntry = {
          ...oldLocalEntry,
          ...firebaseEntry,
          server_seconds: firebaseEntry.seconds,
        };

        if (oldLocalEntry.active && firebaseEntry.active && firebaseEntry.seconds < oldLocalEntry.seconds) {
          newLocalEntry.seconds = oldLocalEntry.seconds;
        }

        if (newLocalEntry.active && newLocalEntry.timer === null) {
          if (_.isNumber(newLocalEntry.last_started)) {
            const timeDifference = Math.round((Date.now() - +newLocalEntry.last_started) / 1000);

            if (timeDifference > 1) {
              newLocalEntry.seconds = newLocalEntry.seconds + timeDifference;
            }
          }

          newLocalEntry.timer = this.startTimer(isoDate, newLocalEntry.$id, newLocalEntry.seconds);
        }

        if (!newLocalEntry.active && newLocalEntry.timer !== null) {
          newLocalEntry.timer = this.stopTimer(newLocalEntry.timer);
        }

        return newLocalEntry;
      };

      const onChildRemoved = (list: Array<IDayEntry>, firebaseEntry: IDayEntry) => {
        const removedEntry = _(list).find((listItem) => listItem.$id === firebaseEntry.$id);
        this.stopTimer(removedEntry.timer);
        return firebaseEntry;
      };

      this.stream[isoDate] = this.FirebaseUtils.arrayStream<IDayEntry>(
        "day",
        ref,
        onChildAdded,
        onChildChanged,
        onChildRemoved,
        isoDate
      );

      return this.stream[isoDate].observable;
    }

    set(isoDate: string) {
      this.behaviorSubject.next(isoDate);
    }

    startTimer(isoDate: string, entryID: string, entrySeconds: number) {
      let seconds = _.cloneDeep(entrySeconds);

      return this.WorkerTimer.setInterval(
        () => {
          seconds = seconds + 1;

          this.stream[isoDate].observer.next((entries) => {
            return _(entries)
              .map((entry) => (entry.$id === entryID ? { ...entry, seconds: seconds } : entry))
              .value();
          });
        },
        1000,
        this
      );
    }

    stopTimer(entryTimer: number) {
      this.WorkerTimer.clearInterval(entryTimer);
      return null;
    }

    updateActiveEntrySeconds(isoDate: string) {
      _(this.stream[isoDate].data)
        .filter((entry) => entry.active)
        .forEach((entry) => {
          const elapsedSeconds = Math.floor((Date.now() - <number>entry.last_started) / 1000);
          const totalSeconds = entry.server_seconds + elapsedSeconds;

          if ((entry.active && entry.seconds < totalSeconds - 10) || entry.seconds > totalSeconds + 10) {
            const ref = this.ref().child(entry.$id);
            const object: IUpdatedEntry = {
              seconds: totalSeconds,
              last_paused: Date.now(),
              last_started: Date.now(),
            };

            this.FirebaseUtils.update(ref, object);
          }
        });
    }

    incrementTimeBy15min(isoDate: string, entryID: string, localUpdate = false) {
      const data = {};

      const calculateSeconds = (entry: IDayEntry) => {
        const oldHours = moment.duration(entry.seconds, "seconds").hours();
        const oldMinutes = moment.duration(entry.seconds, "seconds").minutes();
        let newHours = 0;
        let newMinutes = 0;

        if (oldMinutes % 15 === 0) {
          if (oldMinutes === 45) {
            if (oldHours === 23) {
              newHours = 0;
            } else {
              newHours = oldHours + 1;
            }

            newMinutes = 0;
          } else {
            newHours = oldHours;
            newMinutes = oldMinutes + 15;
          }
        } else {
          newHours = oldHours;
          newMinutes = Math.ceil(oldMinutes / 15) * 15;
        }

        const seconds = newHours * 3600 + newMinutes * 60;

        return seconds;
      };

      this.stream[isoDate].observer.next((entries) => {
        if (!localUpdate) {
          _(entries).forEach((entry) => {
            if (entry.$id === entryID) {
              const seconds = calculateSeconds(entry);
              const key = this.ref().child(entryID).child("seconds").toString().replace(this.firebaseDatabaseURL, "");
              data[key] = seconds;
            }
          });

          return entries;
        }

        return _(entries)
          .map((entry) => {
            if (entry.$id === entryID) {
              const seconds = calculateSeconds(entry);
              return { ...entry, seconds };
            }

            return entry;
          })
          .value();
      });

      if (!_.isEmpty(data)) {
        firebase.default
          .database()
          .ref()
          .update(data)
          .catch((error) => {
            this.$log.error("Error for incrementTimeBy15min() of service Day", error);
          });
      }
    }

    decrementTimeBy15min(isoDate: string, entryID: string, localUpdate = false) {
      const data = {};
      const calculateSeconds = (entry: IDayEntry) => {
        const oldHours = moment.duration(entry.seconds, "seconds").hours();
        const oldMinutes = moment.duration(entry.seconds, "seconds").minutes();
        let newHours = 0;
        let newMinutes = 0;

        if (oldMinutes % 15 === 0) {
          if (oldMinutes === 0) {
            if (oldHours === 0) {
              newHours = 23;
            } else {
              newHours = oldHours - 1;
            }

            newMinutes = 45;
          } else {
            newHours = oldHours;
            newMinutes = oldMinutes - 15;
          }
        } else {
          newHours = oldHours;
          newMinutes = 15 * Math.floor(oldMinutes / 15);
        }

        const seconds = newHours * 3600 + newMinutes * 60;

        return seconds;
      };

      this.stream[isoDate].observer.next((entries) => {
        if (!localUpdate) {
          _(entries).forEach((entry) => {
            if (entry.$id === entryID) {
              const seconds = calculateSeconds(entry);
              const key = this.ref().child(entryID).child("seconds").toString().replace(this.firebaseDatabaseURL, "");
              data[key] = seconds;
            }
          });

          return entries;
        }

        return _(entries)
          .map((entry) => {
            if (entry.$id === entryID) {
              const seconds = calculateSeconds(entry);
              return { ...entry, seconds };
            }

            return entry;
          })
          .value();
      });

      if (!_.isEmpty(data)) {
        firebase.default
          .database()
          .ref()
          .update(data)
          .catch((error) => {
            this.$log.error("Error for decrementTimeBy15min() of service Day", error);
          });
      }
    }

    start(isoDate: string, entry: IDayEntry) {
      const ref = this.ref().child(entry.$id);
      const object: IUpdatedDayEntry = {
        active: true,
        last_started: Date.now(),
      };

      // pause previously active entry
      _(this.stream[isoDate].data)
        .filter((entry) => entry.active)
        .forEach((entry) => this.pause(entry));

      // start timer for the selected entry
      this.FirebaseUtils.update(ref, object);
    }

    pause(entry: IDayEntry) {
      const ref = this.ref().child(entry.$id);
      const object: IUpdatedEntry = {
        active: false,
        seconds: entry.seconds,
        last_paused: Date.now(),
      };

      this.FirebaseUtils.update(ref, object);
    }

    updateLocal(isoDate: string, entryID: string, object: IUpdatedDayEntry) {
      this.stream[isoDate].observer.next((entries) => {
        return _(entries)
          .map((entry) => (entry.$id === entryID ? { ...entry, ...object } : entry))
          .value();
      });
    }

    updateFirebase(entryID: string, object: IUpdatedDayEntry) {
      return new this.$q((resolve, reject) => {
        this.ref()
          .child(entryID)
          .update(object)
          .then(resolve)
          .catch((error) => {
            this.$log.error("Error for updateFirebase() of service Day", error);
            reject(error);
          });
      });
    }

    updatePositions(isoDate: string, draggedEntryID: string, oldPosition: number, newPosition: number) {
      const data = {};
      oldPosition = _.size(this.stream[isoDate].data) - 1 - oldPosition;
      newPosition = _.size(this.stream[isoDate].data) - 1 - newPosition;

      const refString = this.ref().child(draggedEntryID).child("position").toString();
      data[refString] = newPosition;

      _(this.stream[isoDate].data)
        .filter((entry) => entry.$id !== draggedEntryID)
        .forEach((entry) => {
          if (newPosition > oldPosition && entry.position > oldPosition && entry.position <= newPosition) {
            const refString = this.ref().child(entry.$id).child("position").toString();
            data[refString] = entry.position - 1;
          }

          if (newPosition < oldPosition && entry.position < oldPosition && entry.position >= newPosition) {
            const refString = this.ref().child(entry.$id).child("position").toString();
            data[refString] = entry.position + 1;
          }
        });

      this.FirebaseUtils.updateBulk(data);
    }

    updateEntryTask(
      isoDate: string,
      projectSlug: string,
      oldTaskSlug: string,
      newTaskName: string,
      newTaskSlug: string
    ) {
      this.ref()
        .orderByChild("project_slug")
        .equalTo(projectSlug)
        .once("value", (snapshot) => {
          snapshot.forEach((entrySnapshot) => {
            const entry: IDayEntry = entrySnapshot.val();
            entry.$id = entrySnapshot.key;

            if (entry.task_slug === oldTaskSlug) {
              // Check if one of the entries that needs to be updated is present and active in the currently selected day.
              // If so, update 'seconds' and 'last_started' together with 'task_name' and 'task_slug' to prevent
              // the timer on that entry from resetting to its last known servertime when the update occurs.
              const ref = this.ref().child(entry.$id);
              const activeEntry = _(this.stream[isoDate].data).find(
                (item) => item.$id === entry.$id && item.active && item.timer !== null
              );
              const object: IUpdatedDayEntry = {
                task_name: newTaskName,
                task_slug: newTaskSlug,
              };

              if (activeEntry) {
                object.seconds = activeEntry.seconds;
                object.last_started = Date.now();
              }

              this.FirebaseUtils.update<IUpdatedDayEntry>(ref, object);
            }

            return false;
          });
        });
    }

    add(entry: INewEntry) {
      return new this.$q((resolve, reject) => {
        const ref = firebase.default
          .database()
          .ref(`group/${this.Auth.userGroup}/user/${this.Auth.userUID}/time_entries/`);
        let newEntry: INewEntry = {
          active: entry.active,
          created_at: Date.now(),
          entry_date: entry.entry_date,
          last_started: Date.now(),
          last_paused: entry.last_paused,
          seconds: entry.seconds,
          user_uid: entry.user_uid,
          project_name: entry.project_name,
          project_slug: entry.project_slug,
          task_name: entry.task_name,
          task_slug: entry.task_slug,
          position: entry.position,
        };

        if (entry.tags) {
          newEntry = {
            ...newEntry,
            tags: entry.tags,
          };
        }

        ref.push(newEntry).then(resolve, (error) => {
          this.$log.error("Promise failed for add() of service Day", error);
          reject();
        });
      });
    }
  }

  angular.module("app").service("Day", Day);
}
