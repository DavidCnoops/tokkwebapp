///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  export type firebaseObjectEvent<T> = (acc: T, current: T) => T;

  export type firebaseObjectReducer<T> = (acc: T) => T;

  export type firebaseObjectObserver<T> = Rx.Observer<T | firebaseObjectReducer<T>>;

  export interface IFirebaseObjectStream<T> {
    observer: firebaseObjectObserver<T>;
    observable: Rx.Observable<T>;
    subscription: Rx.Subscription;
    data: Readonly<T>;
  }

  export type firebaseArrayEvent<T> = (acc: Array<T>, current: T) => T;

  export type firebaseArrayReducer<T> = (acc: Array<T>, lookup: { [key: string]: boolean }) => Array<T>;

  export type firebaseArrayObserver<T> = Rx.Observer<Array<T> | T | firebaseArrayReducer<T>>;

  export interface IFirebaseArrayStream<T> {
    observer: firebaseArrayObserver<T>;
    observable: Rx.Observable<Array<T>>;
    subscription: Rx.Subscription;
    data: Array<T>;
    lookup: { [key: string]: true };
  }

  export class FirebaseUtils {
    private objectStreamRefs: { [key: string]: IFirebaseObjectStream<any> };
    private arrayStreamRefs: { [key: string]: IFirebaseArrayStream<any> };

    constructor(private $log: ng.ILogService, private Utilities: Utilities, private firebaseDatabaseURL: string) {
      this.objectStreamRefs = {};
      this.arrayStreamRefs = {};
    }

    convertToObject<T>(snapshot): T {
      let object: T = null;

      if (snapshot.exists()) {
        object = snapshot.val();

        if (_.isObject(object)) {
          object["$id"] = snapshot.key;
        }
      }

      return object;
    }

    convertToArray<T>(snapshot): Array<T> {
      let array: Array<T> = null;

      if (snapshot.exists()) {
        array = [];

        snapshot.forEach((childSnapshot) => {
          if (childSnapshot.exists()) {
            const item = this.convertToObject<T>(childSnapshot);

            if (item) {
              array.push(item);
            }
          }

          return false;
        });
      }

      return array;
    }

    objectStream<T>(
      name: string,
      ref: firebase.default.database.Reference,
      onChanged: firebaseObjectEvent<T> | false = false
    ): IFirebaseObjectStream<T> {
      const refString = ref.toString().replace(this.firebaseDatabaseURL, "");
      const streamID = `${name}-${refString}`;

      if (!_.has(this.objectStreamRefs, streamID)) {
        this.objectStreamRefs[streamID] = {
          ...this.objectStreamRefs[streamID],
        };

        const observable = new Rx.Observable<T>((observer) => {
          this.objectStreamRefs[streamID].observer = observer;

          ref.on(
            "value",
            (snapshot) => {
              observer.next(this.convertToObject<T>(snapshot));
            },
            (error) => {
              this.$log.error(`Error for objectStream() for ref ${streamID} of service FirebaseUtils`, error);
            }
          );

          return () => {
            ref.off();
            delete this.objectStreamRefs[streamID];
          };
        })
          .scan((acc: T, current: T | firebaseObjectReducer<T>) => {
            if (!_.isFunction(current) && _.isFunction(onChanged)) {
              acc = onChanged(acc, current);
            } else if (_.isFunction(current)) {
              acc = current(acc);
            } else {
              acc = current;
            }

            acc = this.Utilities.deepFreeze(acc);
            this.objectStreamRefs[streamID].data = acc;

            return acc;
          }, {})
          .distinctUntilChanged()
          .publishReplay(1)
          .refCount();

        const subscription = observable.subscribe();

        this.objectStreamRefs[streamID] = {
          observable,
          subscription,
          ...this.objectStreamRefs[streamID],
        };
      }

      return this.objectStreamRefs[streamID];
    }

    arrayStream<T>(
      name: string,
      ref: firebase.default.database.Reference | firebase.default.database.Query,
      onChildAdded: firebaseArrayEvent<T> | false = false,
      onChildChanged: firebaseArrayEvent<T> | false = false,
      onChildRemoved: firebaseArrayEvent<T> | false = false,
      uniqueQueryKey: string | false = false
    ): IFirebaseArrayStream<T> {
      const refString = ref.toString().replace(this.firebaseDatabaseURL, "");
      const baseStreamID = `${name}-${refString}`;
      const streamID = uniqueQueryKey === false ? baseStreamID : `${baseStreamID}/querykey=${uniqueQueryKey}`;

      if (!_.has(this.arrayStreamRefs, streamID)) {
        this.arrayStreamRefs[streamID] = {
          ...this.arrayStreamRefs[streamID],
        };

        const observable = new Rx.Observable<Array<T>>((observer: Rx.Subscriber<T | Array<T>>) => {
          this.arrayStreamRefs[streamID].observer = observer;

          const logError = (error) => {
            this.$log.error(`Error for arrayStream() for ref ${streamID} of service FirebaseUtils`, error);
          };

          ref
            .once("value")
            .then((snapshot) => {
              observer.next(this.convertToArray<T>(snapshot));

              ref.on(
                "child_added",
                (snapshot) => {
                  observer.next(<T>{
                    ...(<any>this.convertToObject<T>(snapshot)),
                    firebase_event: "child_added",
                  });
                },
                (error) => logError(error)
              );

              ref.on(
                "child_changed",
                (snapshot) => {
                  observer.next(<T>{
                    ...(<any>this.convertToObject<T>(snapshot)),
                    firebase_event: "child_changed",
                  });
                },
                (error) => logError(error)
              );

              ref.on(
                "child_removed",
                (snapshot) => {
                  observer.next(<T>{
                    ...(<any>this.convertToObject<T>(snapshot)),
                    firebase_event: "child_removed",
                  });
                },
                (error) => logError(error)
              );
            })
            .catch((error) => {
              logError(error);
            });

          return () => {
            ref.off("child_added");
            ref.off("child_changed");
            ref.off("child_removed");
            delete this.arrayStreamRefs[streamID];
            console.log(`${streamID} deleted`);
          };
        })
          .scan((acc: Array<T>, current: Array<T> | T | firebaseArrayReducer<T>) => {
            if (!_.isFunction(current)) {
              // initial value from database

              if (!_.has(current, "firebase_event")) {
                if (_.isFunction(onChildAdded)) {
                  current = _(current as Array<T>)
                    .map((child) => {
                      return onChildAdded(acc, child as T);
                    })
                    .value();
                }

                acc = _.isArray(current) ? current : [];

                this.arrayStreamRefs[streamID].lookup = {};

                _(current as any).forEach((item) => (this.arrayStreamRefs[streamID].lookup[item["$id"]] = true));
              } else if (
                current["firebase_event"] === "child_added" &&
                !this.arrayStreamRefs[streamID].lookup[current["$id"]]
              ) {
                current = <T>_.omit(current as any, "firebase_event");

                if (_.isFunction(onChildAdded)) {
                  current = onChildAdded(acc, current);
                }

                acc = [...acc, current];

                this.arrayStreamRefs[streamID].lookup[current["$id"]] = true;
              } else if (
                current["firebase_event"] === "child_changed" &&
                this.arrayStreamRefs[streamID].lookup[current["$id"]]
              ) {
                current = <T>_.omit(current as any, "firebase_event");

                if (_.isFunction(onChildChanged)) {
                  current = onChildChanged(acc, current);
                }

                acc = _(acc)
                  .map((item) => (item["$id"] === <T>current["$id"] ? <T>current : item))
                  .value();
              } else if (
                current["firebase_event"] === "child_removed" &&
                this.arrayStreamRefs[streamID].lookup[current["$id"]]
              ) {
                current = <T>_.omit(current as any, "firebase_event");

                if (_.isFunction(onChildRemoved)) {
                  onChildRemoved(acc, current);
                }

                acc = _(acc)
                  .filter((item) => item["$id"] !== current["$id"])
                  .value();

                delete this.arrayStreamRefs[streamID].lookup[current["$id"]];
              }
            } else {
              // reducer function
              acc = current(acc, this.arrayStreamRefs[streamID].lookup);
            }

            acc = this.Utilities.deepFreeze(acc);
            this.arrayStreamRefs[streamID].data = acc;

            return acc;
          }, [])
          .distinctUntilChanged()
          .publishReplay(1)
          .refCount();

        const subscription = observable.subscribe();

        this.arrayStreamRefs[streamID] = {
          observable,
          subscription,
          ...this.arrayStreamRefs[streamID],
        };
      }

      return this.arrayStreamRefs[streamID];
    }

    update<T>(ref: firebase.default.database.Reference, object: T) {
      ref.update(object).catch((error) => {
        this.$log.error("Error for update() of service FirebaseUtils", error);
      });
    }

    updateBulk(data: { [key: string]: any }) {
      const object = {};

      _(data).forOwn((value, key) => {
        const alteredKey = key.replace(this.firebaseDatabaseURL, "");
        object[alteredKey] = value;
      });

      if (!_.isEmpty(object)) {
        firebase.default
          .database()
          .ref()
          .update(object)
          .catch((error) => {
            this.$log.error("Error for updateBulk() of service FirebaseUtils", error);
          });
      }
    }
  }

  angular.module("app").service("FirebaseUtils", FirebaseUtils);
}
