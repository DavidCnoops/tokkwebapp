///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {
  "use strict";

  const styles = require("tokkReactivate.css");

  function tokkReactivate() {
    return {
      scope: {},
      bindToController: {},
      restrict: "E",
      templateUrl: "tokkReactivate.template.html",
      controller: ReactivateController,
      controllerAs: "vm",
    };
  }

  class ReactivateController {
    public styles: any;
    public loaded: boolean;
    public processing: boolean;
    public metadata: IGroupMetaData;
    public subscription: IGroupSubscription;
    public subscriptionExpiration: string;
    public activeUserCount: number;
    public unitPrice: number;
    public errorMessage: string;
    public success: boolean;
    public subscriptions: Array<Rx.Subscription>;

    constructor(
      private $scope: ng.IScope,
      private $http: ng.IHttpService,
      private serverUrl: string,
      private Auth: Auth,
      private GroupSubscription: GroupSubscription,
      private GroupMetaData: GroupMetaData
    ) {}

    $onInit() {
      this.styles = styles;
      this.loaded = false;
      this.processing = false;
      this.metadata = null;
      this.subscription = null;
      this.subscriptionExpiration = null;
      this.activeUserCount = null;
      this.unitPrice = 5;
      this.errorMessage = null;
      this.success = false;

      this.subscriptions = [
        Rx.Observable.combineLatest(
          this.GroupMetaData.observe(),

          this.GroupSubscription.observe(this.Auth.userGroup),

          (s1, s2) => {
            return {
              meta_data: s1,
              subscription: s2,
            };
          }
        ).subscribe((data) => {
          this.loaded = true;
          this.metadata = data.meta_data;
          this.subscription = data.subscription;
          this.subscriptionExpiration = moment(data.subscription.subscription_ends_on).format("MMMM D, YYYY");
          this.activeUserCount = data.meta_data.active_user_count;
          this.$scope.$evalAsync();
        }),
      ];

      this.$scope.$on("$destroy", () => {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
      });
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
          this.success = true;
          this.$scope.$evalAsync();
        })
        .catch((error) => {
          this.processing = false;
          this.errorMessage = _.isString(error["data"])
            ? `${error["data"]}`
            : `Something went wrong. Please try again.`;
          this.$scope.$evalAsync();
        });
    }
  }

  angular.module("app").directive("tokkReactivate", tokkReactivate);
}
