///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {
  "use strict";

  const styles = require("tokkSubscriptionError.css");

  function tokkSubscriptionError() {
    return {
      scope: {},
      bindToController: {},
      restrict: "E",
      templateUrl: "tokkSubscriptionError.template.html",
      controller: SubscriptionErrorController,
      controllerAs: "vm",
    };
  }

  class SubscriptionErrorController {
    public styles: any;
    public loaded: boolean;
    public activeUserCount: number;
    public billingInformation: IFirebaseBillingInformation;
    public processing: boolean;
    public errorMessage: string;
    public broadcastKey: string;
    public success: boolean;
    public subscriptions: Array<Rx.Subscription>;

    constructor(
      private $scope: ng.IScope,
      private $http: ng.IHttpService,
      private serverUrl: string,
      private Auth: Auth,
      private BillingInformation: BillingInformation,
      private GroupMetaData: GroupMetaData,
      private Broadcaster: Broadcaster,
      private Countries: Countries,
      private Utilities: Utilities
    ) {}

    $onInit() {
      this.styles = styles;
      this.loaded = false;
      this.activeUserCount = null;
      this.billingInformation = null;
      this.processing = false;
      this.errorMessage = null;
      this.broadcastKey = this.Utilities.generateUUID();
      this.success = false;

      this.subscriptions = [
        Rx.Observable.combineLatest(this.GroupMetaData.observe(), this.BillingInformation.observe(), (s1, s2) => {
          return {
            meta_data: s1,
            billing_information: s2,
          };
        }).subscribe((data) => {
          if (_.isNumber(data.meta_data.active_user_count) && !_.isNull(data.billing_information)) {
            this.loaded = true;
            this.activeUserCount = data.meta_data.active_user_count;
            this.billingInformation = data.billing_information;
            this.$scope.$evalAsync();
          }
        }),

        Rx.Observable.zip(
          this.Broadcaster.observeKey(this.broadcastKey).filter(
            (data: IBroadcastObject) => data.message === "validate"
          ),

          this.Broadcaster.observeKey(this.broadcastKey).filter(
            (data: IBroadcastObject) => data.message === "payment-details"
          ),

          (s1, s2) => {
            return {
              payment_details: <IPaymentDetails>s2["value"],
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
              address_line1: this.billingInformation.address,
              address_city: this.billingInformation.city,
              address_zip: this.billingInformation.postal_code,
              address_country: _(this.Countries.list).find((item) => item.code === this.billingInformation.country_code)
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
                      email: this.billingInformation.email,
                      address: this.billingInformation.address,
                      city: this.billingInformation.city,
                      postal_code: this.billingInformation.postal_code,
                      country_code: this.billingInformation.country_code,
                      is_business: this.billingInformation.is_business,
                      company_name: this.billingInformation.company_name,
                      company_vat_number: this.billingInformation.company_vat_number,
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

    subscribe(broadcastKey: string, processing: boolean, loaded: boolean) {
      if (loaded && !processing) {
        this.Broadcaster.emit({ key: broadcastKey, message: "validate" });
      }
    }
  }

  angular.module("app").directive("tokkSubscriptionError", tokkSubscriptionError);
}
