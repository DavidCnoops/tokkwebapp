///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  export interface INewReportListItem {
    name: string;
    filtercollection_id: string;
    added: number;
  }

  export interface IReportListItem extends INewReportListItem {
    $id: string;
  }

  export interface IUpdatedReportListItem {
    name?: string;
    filtercollection_id?: string;
    added?: number;
  }

  export class ReportsList {
    constructor(
      private $q: ng.IQService,
      private $log: ng.ILogService,
      private Auth: Auth,
      private FirebaseUtils: FirebaseUtils
    ) {}

    ref() {
      return firebase.default.database().ref(`group/${this.Auth.userGroup}/user/${this.Auth.userUID}/reports_list/`);
    }

    observe() {
      const ref = this.ref();
      return this.FirebaseUtils.arrayStream<IReportListItem>("reportslist", ref).observable;
    }

    update(reportListItemID: string, object: IUpdatedReportListItem) {
      return new this.$q((resolve, reject) => {
        this.ref()
          .child(reportListItemID)
          .update(object)
          .then(resolve)
          .catch((error) => {
            this.$log.error("Error for update() of service ReportsList", error);
            reject();
          });
      });
    }
  }

  angular.module("app").service("ReportsList", ReportsList);
}
