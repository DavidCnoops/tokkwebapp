///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  const styles = require("tokkReportResult.css");

  interface IGroupingOptions {
    name: string;
    value: "list" | "day" | "user";
    selected: boolean;
  }

  function tokkReportResult() {
    return {
      scope: {},
      bindToController: {},
      restrict: "E",
      templateUrl: "tokkReportResult.template.html",
      controller: ReportResultController,
      controllerAs: "vm",
    };
  }

  class ReportResultController {
    public styles: any;
    public loaded: boolean;
    public visible: boolean;
    public processing: boolean;
    public headerElement: HTMLDivElement;
    public isFilterCollectionSelected: boolean;
    public reportName: string;
    public result: Array<IReportResultItem>;
    public resultTotal: string;
    public jsonResult: any;
    public expanded: any;
    public selectedFilterCollection: IFilterCollection;
    public optionsOpened: boolean;
    public groupingOptions1: Array<IGroupingOptions>;
    public groupingOptions2: Array<IGroupingOptions>;
    public hasBusinessSubscription: boolean;
    public subscriptions: Array<Rx.Subscription>;

    constructor(
      private $scope: ng.IScope,
      private $http: ng.IHttpService,
      private $element: ng.IRootElementService,
      private serverUrl: string,
      private ReportDependencies: ReportDependencies,
      private ReportResult: ReportResult,
      private FilterCollections: FilterCollections,
      private Streams: Streams,
      private Users: Users,
      private Auth: Auth,
      private Broadcaster: Broadcaster,
      private ReportsList: ReportsList,
      private GroupSubscription: GroupSubscription
    ) {}

    $onInit() {
      this.styles = styles;
      this.loaded = false;
      this.visible = false;
      this.processing = false;
      this.headerElement = null;
      this.isFilterCollectionSelected = false;
      this.reportName = null;
      this.result = null;
      this.resultTotal = null;
      this.jsonResult = null;
      this.expanded = null;
      this.selectedFilterCollection = null;
      this.optionsOpened = false;
      this.hasBusinessSubscription = false;
      this.groupingOptions1 = [
        {
          name: "List",
          value: "list",
          selected: false,
        },
        {
          name: "Day",
          value: "day",
          selected: false,
        },
      ];

      // set initial value for the resultgrouping filter dopwdown to 'project'
      this.Streams.stream.resultgrouping1.set("list");

      this.subscriptions = [
        Rx.Observable.zip(
          this.Broadcaster.observeKey("dd3412c5-7e8c-47f5-ad86-d1a0023c4227"),
          this.Broadcaster.observeKey("a1217022-9040-465b-997f-2e59ac8c5b1c")
        ).subscribe(() => {
          this.visible = true;
          this.$scope.$evalAsync();
        }),

        Rx.Observable.combineLatest(
          this.GroupSubscription.observe(this.Auth.userGroup),
          this.Streams.stream.resultgrouping1.replay,
          (s1, s2) => {
            return {
              subscription: s1,
              group_by_1: s2,
            };
          }
        )
          .do((data) => {
            this.hasBusinessSubscription = data.subscription.type === "business";

            if (data.subscription.type === "business") {
              if (!_(this.groupingOptions1).some((item) => item.value === "user")) {
                this.groupingOptions1.push({
                  name: "User",
                  value: "user",
                  selected: false,
                });
              }

              if (data.group_by_1 === "list") {
                this.groupingOptions2 = [
                  {
                    name: "Day",
                    value: "day",
                    selected: false,
                  },
                  {
                    name: "User",
                    value: "user",
                    selected: false,
                  },
                ];
              } else if (data.group_by_1 === "day") {
                this.groupingOptions2 = [
                  {
                    name: "List",
                    value: "list",
                    selected: false,
                  },
                  {
                    name: "User",
                    value: "user",
                    selected: false,
                  },
                ];
              } else if (data.group_by_1 === "user") {
                this.groupingOptions2 = [
                  {
                    name: "List",
                    value: "list",
                    selected: false,
                  },
                  {
                    name: "Day",
                    value: "day",
                    selected: false,
                  },
                ];
              }
            } else {
              this.groupingOptions2 = [
                {
                  name: "List",
                  value: "list",
                  selected: false,
                },
                {
                  name: "Day",
                  value: "day",
                  selected: false,
                },
              ];
            }

            this.$scope.$evalAsync();
          })
          .delay(10)
          .subscribe((data) => {
            if (data.subscription.type === "business") {
              this.Streams.stream.resultgrouping2.set(this.groupingOptions2[0].value);
            } else {
              this.Streams.stream.resultgrouping2.set(data.group_by_1 === "list" ? "day" : "list");
            }
          }),

        Rx.Observable.combineLatest(
          this.FilterCollections.observe(),

          this.FilterCollections.replay
            .do(() => {
              this.loaded = false;
              this.visible = false;
              this.headerElement = null;
              this.expanded = null;
              this.Streams.stream.resultgrouping1.set("list");
              this.$scope.$evalAsync();
            })
            .delay(50),

          this.Streams.stream.resultgrouping2.replay.combineLatest(
            this.Streams.stream.resultgrouping1.replay,
            (s1, s2) => {
              return {
                group_by_1: s2,
                group_by_2: s1,
              };
            }
          ),

          this.Users.observe(),

          this.ReportsList.observe(),

          (s1, s2, s3, s4, s5) => {
            return {
              filtercollections: s1,
              selected_filtercollection_id: s2,
              group_by_1: s3.group_by_1,
              group_by_2: s3.group_by_2,
              users: s4,
              reports: s5,
            };
          }
        ).subscribe((data) => {
          this.reportName = null;
          this.result = null;
          this.resultTotal = null;
          this.isFilterCollectionSelected = false;
          this.selectedFilterCollection = null;

          if (data.reports && data.selected_filtercollection_id) {
            const report = _(data.reports).find(
              (report) => report.filtercollection_id === data.selected_filtercollection_id
            );

            if (report) {
              this.reportName = report.name;
              this.selectedFilterCollection = _(data.filtercollections).find(
                (filtercollection) => filtercollection.$id === data.selected_filtercollection_id
              );

              if (this.selectedFilterCollection) {
                const filteredEntries = this.ReportResult.getFilteredEntries(
                  this.ReportDependencies.entries,
                  this.selectedFilterCollection
                );
                this.result = this.ReportResult.getGroupedEntries(
                  filteredEntries,
                  data.users,
                  data.group_by_1,
                  data.group_by_2
                );
                this.resultTotal = this.ReportResult.getTotalTime(filteredEntries);
                this.jsonResult = this.ReportResult.getJSONEntries(
                  filteredEntries,
                  data.users,
                  data.group_by_1,
                  data.group_by_2
                );
                this.expanded = this.getExpanded(this.result, this.expanded);
                this.isFilterCollectionSelected = true;

                if (!this.loaded) {
                  this.loaded = true;

                  this.Broadcaster.emit({
                    key: "dd3412c5-7e8c-47f5-ad86-d1a0023c4227",
                    message: "loaded",
                    value: true,
                  });
                }
              }
            }
          }

          this.$scope.$evalAsync();
        }),
      ];

      this.$scope.$on("$destroy", () => {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
      });
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
        this.headerElement = <HTMLDivElement>this.$element[0].querySelector(`.${this.styles.header}`);

        if (this.headerElement) {
          action();
        }
      } else {
        action();
      }
    }

    getExpanded(result: Array<IReportResultItem>, oldExpanded: any) {
      const expanded = {};

      _(result).forEach((firstLevelItem) => {
        const parentName = firstLevelItem.name;

        expanded[parentName] = {
          children: {},
        };

        if (oldExpanded && oldExpanded[parentName] && _.isBoolean(oldExpanded[parentName]["value"])) {
          expanded[parentName]["value"] = oldExpanded[parentName]["value"];
        } else {
          expanded[parentName]["value"] = true;
        }

        _(firstLevelItem.children).forEach((secondLevelItem) => {
          const childName = secondLevelItem.name;

          expanded[parentName]["children"][childName] = {};

          if (
            oldExpanded &&
            oldExpanded[parentName] &&
            oldExpanded[parentName]["children"] &&
            oldExpanded[parentName]["children"][childName] &&
            _.isBoolean(oldExpanded[parentName]["children"][childName]["value"])
          ) {
            expanded[parentName]["children"][childName]["value"] =
              oldExpanded[parentName]["children"][childName]["value"];
          } else {
            expanded[parentName]["children"][childName]["value"] = true;
          }
        });
      });

      return expanded;
    }

    toggleExpand(itemName: string, parentName: string | boolean = false) {
      if (!_.isString(parentName)) {
        this.expanded[itemName]["value"] = !this.expanded[itemName]["value"];
      } else {
        this.expanded[parentName]["children"][itemName]["value"] =
          !this.expanded[parentName]["children"][itemName]["value"];
      }
    }

    expandAll() {
      _(this.expanded).forOwn((value, parentName) => {
        this.expanded[parentName]["value"] = true;

        _(this.expanded[parentName]["children"]).forOwn((value, childName) => {
          this.expanded[parentName]["children"][childName]["value"] = true;
        });
      });
    }

    collapseAll() {
      _(this.expanded).forOwn((value, parentName) => {
        this.expanded[parentName]["value"] = false;

        _(this.expanded[parentName]["children"]).forOwn((value, childName) => {
          this.expanded[parentName]["children"][childName]["value"] = false;
        });
      });
    }

    downloadPDF() {
      if (!this.processing) {
        this.processing = true;

        let days: any = this.selectedFilterCollection.days;

        if (_.isArray(this.selectedFilterCollection.days)) {
          const startDay = moment(this.selectedFilterCollection.days[0]).format("MMMM D, YYYY");
          const endDay = moment(this.selectedFilterCollection.days[1]).format("MMMM D, YYYY");
          days = [startDay, endDay];
        }

        const selectedFilterCollection = {
          ...this.selectedFilterCollection,
          days: days,
          projects: this.ReportDependencies.getFilterValuesViewNames(this.selectedFilterCollection, "projects"),
          tasks: this.ReportDependencies.getFilterValuesViewNames(this.selectedFilterCollection, "tasks"),
          tags: this.ReportDependencies.getFilterValuesViewNames(this.selectedFilterCollection, "tags"),
          users: this.ReportDependencies.getFilterValuesViewNames(this.selectedFilterCollection, "users"),
        };

        firebase.default
          .auth()
          .currentUser.getIdToken(true)
          .then((firebaseIDToken) => {
            return this.$http({
              url: `${this.serverUrl}/download/report-as-pdf`,
              method: "POST",
              data: {
                firebase_id_token: firebaseIDToken,
                user_id: this.Auth.userUID,
                group_id: this.Auth.userGroup,
                report_name: this.reportName,
                report_result_total: this.resultTotal,
                report_result_object: this.result,
                filtercollection: selectedFilterCollection,
              },
              headers: {
                "Content-Type": "application/json; charset=utf-8",
              },
              responseType: "arraybuffer",
            });
          })
          .then((serverResponse) => {
            this.processing = false;
            const blob = new Blob([serverResponse.data as any], { type: "application/pdf" });
            const filename = `Tokk-Report-${this.reportName}.pdf`;
            saveAs(blob, filename);
            this.$scope.$evalAsync();
          })
          .catch((error) => {
            this.processing = false;
            this.$scope.$evalAsync();
          });
      }
    }

    downloadCSV() {
      let csvString = `, Time, Seconds\n`;

      _(this.result).forEach((firstLevelItem) => {
        csvString += `"${firstLevelItem.viewName}", "${firstLevelItem.time}", ${firstLevelItem.seconds}\n`;

        _(firstLevelItem.children).forEach((secondLevelItem) => {
          csvString += `"${secondLevelItem.viewName}", "${secondLevelItem.time}", ${secondLevelItem.seconds}\n`;

          _(secondLevelItem.children).forEach((thirdLevelItem) => {
            csvString += `"${thirdLevelItem.viewName}", "${thirdLevelItem.time}", ${thirdLevelItem.seconds}\n`;
          });
        });
      });

      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8" });
      const filename = `Tokk-Report-${this.reportName}.csv`;
      saveAs(blob, filename);
    }

    downloadJSON() {
      const blob = new Blob([this.jsonResult], { type: "application/json;charset=utf-8" });
      const filename = `Tokk-Report-${this.reportName}.json`;
      saveAs(blob, filename);
    }

    toggleOptions() {
      this.optionsOpened = !this.optionsOpened;
    }

    openOptions() {
      this.optionsOpened = true;
    }

    closeOptions() {
      this.optionsOpened = false;
    }
  }

  angular.module("app").directive("tokkReportResult", tokkReportResult);
}
