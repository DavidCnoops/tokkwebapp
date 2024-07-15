///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  export class Data {
    constructor(private $q: ng.IQService, private $log: ng.ILogService) {}

    pauseActiveEntriesBeforeToday(userUID: string, groupID: string, todayISODate: string) {
      return new this.$q((resolve, reject) => {
        const ref = firebase.default.database().ref(`group/${groupID}/user/${userUID}/time_entries/`);

        ref
          .orderByChild("active")
          .equalTo(true)
          .once("value")
          .then((snapshot) => {
            if (snapshot.exists()) {
              snapshot.forEach((childSnapshot) => {
                const entry: IEntry = childSnapshot.val();
                const entryID = childSnapshot.key;
                const todayDate = moment(todayISODate, "YYYY-MM-DD", true);
                const entryDate = moment(entry.entry_date, "YYYY-MM-DD", true);
                const difference = todayDate.diff(entryDate);

                if (difference > 0 && entry.active === true) {
                  const updatedEntryValues: IUpdatedEntry = {
                    active: false,
                    last_paused: <number>firebase.default.database.ServerValue.TIMESTAMP,
                  };

                  ref
                    .child(entryID)
                    .update(updatedEntryValues)
                    .then(resolve)
                    .catch((error) => {
                      this.$log.error("Inner error for pauseActiveEntriesBeforeToday() of service Data", error);
                      reject();
                    });
                } else {
                  resolve();
                }

                return false;
              });
            } else {
              resolve();
            }
          })
          .catch((error) => {
            this.$log.error("Outer error for pauseActiveEntriesBeforeToday() of service Data", error);
            reject();
          });
      });
    }
  }

  angular.module("app").service("Data", Data);
}
