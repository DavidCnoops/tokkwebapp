///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  const styles = require("tokkSubscriptionDetails.css");

  function tokkSubscriptionDetails() {
    return {
      scope: {},
      bindToController: {},
      restrict: "E",
      templateUrl: "tokkSubscriptionDetails.template.html",
      controller: SubscriptionDetailsController,
      controllerAs: "vm",
    };
  }

  class SubscriptionDetailsController {
    public styles: any;
    public cancellationModalOpened: boolean;
    public reactivationModalOpened: boolean;
    public cancellationSuccessful: boolean;
    public cancellationSuccessfulMessage: string;
    public reactivationSuccessful: boolean;
    public reactivationSuccessfulMessage: string;
    public subscriptionType: "free" | "business";
    public subscriptionStatus: "trial" | "active" | "cancelled" | "error";
    public trialExpirationDate: string;
    public daysLeft: string;
    public nextBillingDate: string;
    public processing: boolean;
    public subscriptions: Array<Rx.Subscription>;

    constructor(
      private $scope: ng.IScope,
      private $http: ng.IHttpService,
      private $timeout: ng.ITimeoutService,
      private serverUrl: string,
      private Auth: Auth,
      private GroupSubscription: GroupSubscription,
      private GroupMetaData: GroupMetaData
    ) {}

    $onInit() {
      this.styles = styles;
      this.cancellationModalOpened = false;
      this.reactivationModalOpened = false;
      this.cancellationSuccessful = false;
      this.cancellationSuccessfulMessage = "Successfully cancelled subscription";
      this.reactivationSuccessful = false;
      this.reactivationSuccessfulMessage = "Successfully reactivated subscription";
      this.subscriptionType = null;
      this.subscriptionStatus = null;
      this.trialExpirationDate = null;
      this.daysLeft = null;
      this.nextBillingDate = null;
      this.processing = false;

      this.subscriptions = [
        Rx.Observable.combineLatest(
          this.GroupSubscription.observe(this.Auth.userGroup),
          this.GroupMetaData.observe(),
          (s1, s2) => {
            return {
              subscription: s1,
              meta: s2,
            };
          }
        ).subscribe((data) => {
          this.subscriptionType = data.subscription.type;

          if (data.subscription.type === "business") {
            this.subscriptionStatus = data.subscription.status;

            if (data.subscription.status === "trial") {
              this.trialExpirationDate = moment(data.subscription.trial_started_on)
                .add(2592000000, "ms")
                .format("MMMM D, YYYY");
              this.daysLeft = this.getDaysLeft(data.subscription.trial_started_on);
            } else {
              this.nextBillingDate = moment(data.subscription.subscription_ends_on).format("MMMM D, YYYY");
            }
          }

          this.$scope.$evalAsync();
        }),
      ];

      this.$scope.$on("$destroy", () => {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
      });
    }

    getDaysLeft(trialStartedTimestamp: number): string {
      const a = moment(trialStartedTimestamp + 2592000000);
      const b = moment(Date.now());
      const days = a.diff(b, "days");
      return days === 1 ? `${days} day left` : `${days} days left`;
    }

    openCancellationModal() {
      this.cancellationModalOpened = true;
    }

    closeCancellationModal() {
      if (!this.processing) {
        this.cancellationModalOpened = false;
      }
    }

    cancelSubscription() {
      this.processing = true;

      firebase.default
        .auth()
        .currentUser.getIdToken(true)
        .then((firebaseIDToken) => {
          return this.$http({
            url: `${this.serverUrl}/subscription/cancel`,
            method: "POST",
            data: {
              user_id: this.Auth.userUID,
              group_id: this.Auth.userGroup,
              firebase_id_token: firebaseIDToken,
            },
            headers: { "Content-Type": "application/json" },
          });
        })
        .then(() => {
          this.processing = false;
          this.closeCancellationModal();
          this.cancellationSuccessful = true;
          this.$timeout(() => (this.cancellationSuccessful = false), 6000);
          this.$scope.$evalAsync();
        })
        .catch(() => {
          this.processing = false;
          this.$scope.$evalAsync();
        });
    }

    openReactivationModal() {
      this.reactivationModalOpened = true;
    }

    closeReactivationModal() {
      if (!this.processing) {
        this.reactivationModalOpened = false;
      }
    }

    reactivateSubscription() {
      this.processing = true;

      firebase.default
        .auth()
        .currentUser.getIdToken(true)
        .then((firebaseIDToken) => {
          return this.$http({
            url: `${this.serverUrl}/subscription/reactivate`,
            method: "POST",
            data: {
              user_id: this.Auth.userUID,
              group_id: this.Auth.userGroup,
              firebase_id_token: firebaseIDToken,
            },
            headers: { "Content-Type": "application/json" },
          });
        })
        .then(() => {
          this.processing = false;
          this.closeReactivationModal();
          this.reactivationSuccessful = true;
          this.$timeout(() => (this.reactivationSuccessful = false), 6000);
          this.$scope.$evalAsync();
        })
        .catch(() => {
          this.processing = false;
          this.$scope.$evalAsync();
        });
    }
  }

  angular.module("app").directive("tokkSubscriptionDetails", tokkSubscriptionDetails);
}
