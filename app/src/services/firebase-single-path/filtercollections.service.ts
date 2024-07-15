///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  export interface INewFilterCollection {
    days: "all" | Array<number>;
    projects: "all" | Array<string>;
    users: "all" | Array<string>;
    tasks: "all" | Array<string>;
    tags: "all" | Array<string>;
  }

  export interface IFilterCollection extends INewFilterCollection {
    $id: string;
  }

  export interface IUpdatedFilterCollection {
    days?: "all" | Array<number>;
    projects?: "all" | Array<string>;
    users?: "all" | Array<string>;
    tasks?: "all" | Array<string>;
    tags?: "all" | Array<string>;
  }

  export class FilterCollections {
    private behaviorSubject: Rx.BehaviorSubject<string>;
    public replay: Rx.Observable<string>;

    constructor(
      private $q: ng.IQService,
      private $log: ng.ILogService,
      private Auth: Auth,
      private FirebaseUtils: FirebaseUtils,
      private ReportDependencies: ReportDependencies
    ) {
      this.behaviorSubject = new Rx.BehaviorSubject(null);
      this.replay = this.behaviorSubject.distinctUntilChanged().publishReplay(1).refCount();
    }

    ref() {
      return firebase.default
        .database()
        .ref(`group/${this.Auth.userGroup}/user/${this.Auth.userUID}/filtercollections/`);
    }

    observe() {
      const ref = this.ref();

      return Rx.Observable.combineLatest(
        this.ReportDependencies.replay.filter((items) => items !== null),
        this.FirebaseUtils.arrayStream<IFilterCollection>("filtercollections", ref).observable,
        (s1, s2) => {
          return {
            mapped_list: s1,
            filtercollection: s2,
          };
        }
      ).map((data) => {
        let filterCollection = data.filtercollection;

        if (this.ReportDependencies.mappedList) {
          ["projects", "tasks", "tags", "users"].forEach((key) => {
            if (_.isArray(filterCollection[key])) {
              if (_.difference(filterCollection[key], data.mapped_list[key]).length > 0) {
                const filteredValues = _(filterCollection[key])
                  .filter((item) => {
                    return _.includes(this.ReportDependencies.mappedList[key], item);
                  })
                  .value();

                filterCollection = {
                  ...filterCollection,
                  [key]: !_.isEmpty(filteredValues) ? filteredValues : "all",
                };
              }
            }
          });
        }

        return filterCollection;
      });
    }

    set(filterCollectionID: string) {
      this.behaviorSubject.next(filterCollectionID);
    }

    update(filterCollectionID: string, object: IUpdatedFilterCollection) {
      return new this.$q((resolve, reject) => {
        this.ref()
          .child(filterCollectionID)
          .update(object)
          .then(resolve)
          .catch((error) => {
            this.$log.error("Error for update() of service FilterCollection", error);
            reject(error);
          });
      });
    }
  }

  angular.module("app").service("FilterCollections", FilterCollections);
}
