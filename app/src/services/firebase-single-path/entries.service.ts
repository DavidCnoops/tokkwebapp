///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  export interface INewEntry {
    active: boolean;
    created_at: number;
    entry_date: string;
    last_started: number | boolean;
    last_paused: number | boolean;
    seconds: number;
    user_uid: string;
    project_name: string;
    project_slug: string;
    task_name: string;
    task_slug: string;
    tags?: Array<string>;
    position: number;
  }

  export interface IUpdatedEntry {
    active?: boolean;
    created_at?: number;
    entry_date?: string;
    last_started?: number | boolean;
    last_paused?: number | boolean;
    seconds?: number;
    user_uid?: string;
    project_name?: string;
    project_slug?: string;
    task_name?: string;
    task_slug?: string;
    tags?: Array<string>;
    position?: number;
  }

  export interface IEntry extends INewEntry {
    $id?: string;
    entry_date_timestamp?: number;
  }

  interface ILocalProperties {
    entry_date_timestamp: number;
    tags: Array<string>;
  }

  export class Entries {
    constructor(private $log: ng.ILogService, private Auth: Auth, private FirebaseUtils: FirebaseUtils) {}

    ref(userUID: string) {
      return firebase.default.database().ref(`group/${this.Auth.userGroup}/user/${userUID}/time_entries`);
    }

    observe(userUID: string) {
      const ref = this.ref(userUID);

      const onChildAddedOrChanged = (list: Array<IEntry>, firebaseEntry: IEntry) => {
        const newLocalEntryProperties: ILocalProperties = {
          entry_date_timestamp: moment(firebaseEntry.entry_date, "YYYY-MM-DD", true).valueOf(),
          tags: !firebaseEntry.tags ? ["untagged"] : firebaseEntry.tags,
        };
        const newLocalEntry: IEntry = {
          ...firebaseEntry,
          ...newLocalEntryProperties,
        };

        return newLocalEntry;
      };

      return this.FirebaseUtils.arrayStream<IEntry>("entries", ref, onChildAddedOrChanged, onChildAddedOrChanged)
        .observable;
    }

    queryOnce(childName: string, childValue: string | number | boolean) {
      return this.ref(this.Auth.userUID)
        .orderByChild(childName)
        .equalTo(childValue)
        .once("value")
        .then((snapshot) => {
          return this.FirebaseUtils.convertToArray<IEntry>(snapshot);
        })
        .catch((error) => {
          this.$log.error("Error for queryOnce() of service Entries", error);
          return error;
        });
    }

    update(entryID: string, object: IUpdatedEntry) {
      this.ref(this.Auth.userUID)
        .child(entryID)
        .update(object)
        .catch((error) => this.$log.error("Error for update() of service Entries", error));
    }

    remove(removedEntry: IEntry) {
      this.ref(this.Auth.userUID)
        .child(removedEntry.$id)
        .remove()
        .then(() => {
          return this.queryOnce("entry_date", removedEntry.entry_date);
        })
        .then((entries) => {
          // reorder
          const data = {};

          _(entries)
            .filter((entry) => entry.position > removedEntry.position)
            .forEach((entry) => {
              const refString = this.ref(this.Auth.userUID).child(entry.$id).child("position").toString();
              data[refString] = entry.position - 1;
            });

          this.FirebaseUtils.updateBulk(data);
        })
        .catch((error) => {
          this.$log.error("Error for remove() of service Entries", error);
        });
    }
  }

  angular.module("app").service("Entries", Entries);
}
