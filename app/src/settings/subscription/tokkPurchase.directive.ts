///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  const styles = require("tokkPurchase.css");

  function tokkPurchase() {
    return {
      scope: {},
      bindToController: {},
      restrict: "E",
      templateUrl: "tokkPurchase.template.html",
      controller: PurchaseController,
      controllerAs: "vm",
    };
  }

  class PurchaseController {
    public styles: any;
    public processing: boolean;
    public errorMessage: string;
    public broadcastKey: string;
    public activeUserCount: number;
    public trialExpirationDate: string;
    public subscriptions: Array<Rx.Subscription>;

    constructor(
      private $scope: ng.IScope,
      private $http: ng.IHttpService,
      private serverUrl: string,
      private Auth: Auth,
      private GroupSubscription: GroupSubscription,
      private GroupMetaData: GroupMetaData,
      private Broadcaster: Broadcaster,
      private Countries: Countries,
      private Utilities: Utilities
    ) {}

    $onInit() {
      this.styles = styles;
      this.processing = false;
      this.errorMessage = null;
      this.broadcastKey = this.Utilities.generateUUID();
      this.activeUserCount = null;
      this.trialExpirationDate = null;

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
          this.activeUserCount = data.meta.active_user_count;
          this.trialExpirationDate =
            data.subscription.status === "trial"
              ? moment(data.subscription.trial_started_on).add(2592000000, "ms").format("MMMM D")
              : null;
          this.$scope.$evalAsync();
        }),

        Rx.Observable.zip(
          this.Broadcaster.observeKey(this.broadcastKey).filter(
            (data: IBroadcastObject) => data.message === "validate"
          ),

          this.Broadcaster.observeKey(this.broadcastKey).filter(
            (data: IBroadcastObject) => data.message === "payment-details"
          ),

          this.Broadcaster.observeKey(this.broadcastKey).filter(
            (data: IBroadcastObject) => data.message === "billing-details"
          ),

          (s1, s2, s3) => {
            return {
              payment_details: <IPaymentDetails>s2["value"],
              billing_details: <IBillingDetails>s3["value"],
            };
          }
        ).subscribe((data) => {
          this.processing = true;
          this.errorMessage = null;
          this.$scope.$evalAsync();

          Stripe.card.createToken(
            {
              number: data.payment_details.card_number,
              exp_month: data.payment_details.exp_month,
              exp_year: data.payment_details.exp_year,
              cvc: data.payment_details.cvc,
              name: data.payment_details.cardholder_name,
              address_line1: data.billing_details.address,
              address_city: data.billing_details.city,
              address_zip: data.billing_details.postal_code,
              address_country: _(this.Countries.list).find((item) => item.code === data.billing_details.country_code)
                .name,
            },
            (status, response) => {
              if (status === 200) {
                firebase.default
                  .auth()
                  .currentUser.getIdToken(true)
                  .then((firebaseIDToken) => {
                    const body: ISubscribeBody = {
                      group_id: this.Auth.userGroup,
                      user_id: this.Auth.userUID,
                      stripe_token: response.id,
                      firebase_id_token: firebaseIDToken,
                      email: data.billing_details.email,
                      address: data.billing_details.address,
                      city: data.billing_details.city,
                      postal_code: data.billing_details.postal_code,
                      country_code: data.billing_details.country_code,
                      is_business: data.billing_details.is_business,
                      company_name: data.billing_details.company_name,
                      company_vat_number: data.billing_details.company_vat_number,
                      quantity: this.activeUserCount,
                    };

                    return this.$http({
                      url: `${this.serverUrl}/subscription/subscribe`,
                      method: "POST",
                      data: body,
                      headers: { "Content-Type": "application/json" },
                    });
                  })
                  .then(() => {
                    this.processing = false;
                    this.$scope.$evalAsync();
                  })
                  .catch((error) => {
                    this.processing = false;
                    this.errorMessage = _.isString(error["data"])
                      ? `${error["data"]}`
                      : `Something went wrong. Please try again.`;
                    this.$scope.$evalAsync();
                  });
              } else {
                this.processing = false;
                this.errorMessage =
                  _.has(response, "error.message") && _.isString(response.error.message)
                    ? response.error.message
                    : "Something went wrong. Please try again.";
                this.$scope.$evalAsync();
              }
            }
          );
        }),
      ];

      this.$scope.$on("$destroy", () => {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
      });
    }

    subscribe(broadcastKey: string, processing: boolean) {
      if (!processing) {
        this.Broadcaster.emit({ key: broadcastKey, message: "validate" });
      }
    }
  }

  angular.module("app").directive("tokkPurchase", tokkPurchase);
}
