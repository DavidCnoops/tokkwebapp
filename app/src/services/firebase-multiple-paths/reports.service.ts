///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  export class Reports {
    constructor(
      private $q: ng.IQService,
      private $log: ng.ILogService,
      private Auth: Auth,
      private Utilities: Utilities
    ) {}

    add(reportName: string): angular.IPromise<string> {
      return new this.$q((resolve, reject) => {
        const data = {};
        const filterCollectionID = this.Utilities.generateFirebaseUUID();
        const reportID = this.Utilities.generateFirebaseUUID();

        const filterCollection: INewFilterCollection = {
          days: "all",
          projects: "all",
          tasks: "all",
          tags: "all",
          users: "all",
        };

        const report: INewReportListItem = {
          name: reportName,
          filtercollection_id: filterCollectionID,
          added: <number>firebase.default.database.ServerValue.TIMESTAMP,
        };

        data[`group/${this.Auth.userGroup}/user/${this.Auth.userUID}/filtercollections/${filterCollectionID}`] =
          filterCollection;
        data[`group/${this.Auth.userGroup}/user/${this.Auth.userUID}/reports_list/${reportID}`] = report;

        firebase.default
          .database()
          .ref()
          .update(data, (error) => {
            if (error) {
              this.$log.error("Error for add() of service Reports", error);
              reject();
            } else {
              resolve(filterCollectionID);
            }
          });
      });
    }

    remove(filterCollectionID: string, reportID: string) {
      return new this.$q((resolve, reject) => {
        const data = {};

        data[`group/${this.Auth.userGroup}/user/${this.Auth.userUID}/filtercollections/${filterCollectionID}`] = null;
        data[`group/${this.Auth.userGroup}/user/${this.Auth.userUID}/reports_list/${reportID}`] = null;

        firebase.default
          .database()
          .ref()
          .update(data, (error) => {
            if (error) {
              this.$log.error("Error for remove() of service Reports", error);
              reject();
            } else {
              resolve();
            }
          });
      });
    }
  }

  angular.module("app").service("Reports", Reports);
}
