///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  export interface IGroupSubscription {
    $id?: string;
    type: "free" | "business";
    status?: "trial" | "active" | "cancelled" | "error";
    trial_started_on?: number;
    subscription_ends_on?: number;
    stripe_customer_id?: string;
  }

  interface IUpgradedGroupSubscription {
    type: "business";
    status: "trial";
    trial_started_on: number;
  }

  export type IGroupSubscriptionErrorCodes =
    | "TOKK_TRIAL_EXPIRED"
    | "TOKK_SUBSCRIPTION_CANCELLED"
    | "TOKK_SUBSCRIPTION_ERROR";

  export interface IGroupSubscriptionError {
    invalid_subscription: true;
    code: IGroupSubscriptionErrorCodes;
  }

  export class GroupSubscription {
    constructor(private $q: ng.IQService, private $log: ng.ILogService, private FirebaseUtils: FirebaseUtils) {}

    ref(groupID: string) {
      return firebase.default.database().ref(`subscriptions/${groupID}/`);
    }

    observe(groupID: string) {
      const ref = this.ref(groupID);
      return this.FirebaseUtils.objectStream<IGroupSubscription>("groupsubscription", ref).observable;
    }

    getOnce(groupID: string): angular.IPromise<IGroupSubscription> {
      return new this.$q((resolve, reject) => {
        this.ref(groupID)
          .once("value")
          .then((snapshot) => {
            if (snapshot.exists()) {
              const subscription: IGroupSubscription = snapshot.val();
              subscription.$id = snapshot.key;

              if (this.isValid(subscription)) {
                resolve(subscription);
              } else {
                const error = this.getSubscriptionError(subscription);
                reject(error);
              }
            } else {
              const error = `No snapshot exists for /subscriptions/${groupID}/`;
              this.$log.error(error);
              reject(error);
            }
          })
          .catch((error) => {
            this.$log.error("Error for getOnce() of service GroupSubscription", error);
            reject(error);
          });
      });
    }

    isValid(subscription: IGroupSubscription) {
      if (subscription.type === "business") {
        if (
          (subscription.status === "trial" && !this.hasValidTrialPeriod(subscription)) ||
          (subscription.status !== "trial" && !this.hasValidSubscriptionPeriod(subscription))
        ) {
          return false;
        }
      }

      return true;
    }

    upgradeToBusinessTrial(groupID: string) {
      return new this.$q((resolve, reject) => {
        const object: IUpgradedGroupSubscription = {
          type: "business",
          status: "trial",
          trial_started_on: <number>firebase.default.database.ServerValue.TIMESTAMP,
        };

        this.ref(groupID)
          .update(object)
          .then(resolve)
          .catch((error) => {
            this.$log.error("Error for upgradeToBusinessTrial() of service GroupSubscription", error);
            reject();
          });
      });
    }

    private getSubscriptionError(subscription: IGroupSubscription) {
      let error: IGroupSubscriptionError | null = null;

      if (subscription.type === "business") {
        if (subscription.status === "trial" && !this.hasValidTrialPeriod(subscription)) {
          error = {
            invalid_subscription: true,
            code: "TOKK_TRIAL_EXPIRED",
          };
        } else if (!this.hasValidSubscriptionPeriod(subscription)) {
          if (subscription.status === "cancelled") {
            error = {
              invalid_subscription: true,
              code: "TOKK_SUBSCRIPTION_CANCELLED",
            };
          } else if (subscription.status === "active") {
            error = {
              invalid_subscription: true,
              code: "TOKK_SUBSCRIPTION_ERROR",
            };
          } else if (subscription.status === "error") {
            error = {
              invalid_subscription: true,
              code: "TOKK_SUBSCRIPTION_ERROR",
            };
          }
        }
      }

      return error;
    }

    private hasValidTrialPeriod(subscription: IGroupSubscription) {
      if (_.has(subscription, "trial_started_on")) {
        const now = Date.now();
        const trialEnd = subscription.trial_started_on + 2592000000;

        if (now < trialEnd) {
          return true;
        }
      }

      return false;
    }

    private hasValidSubscriptionPeriod(subscription: IGroupSubscription) {
      if (_.has(subscription, "subscription_ends_on")) {
        const now = Date.now();
        const periodEnd = subscription.subscription_ends_on;

        if (now < periodEnd) {
          return true;
        }
      }

      return false;
    }
  }

  angular.module("app").service("GroupSubscription", GroupSubscription);
}
