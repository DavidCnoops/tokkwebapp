///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  const styles = require("tokkPaymentDetails.css");

  export interface IUpdateCardBody {
    firebase_id_token: any;
    stripe_token: string;
    group_id: string;
    user_id: string;
  }

  function tokkPaymentDetails() {
    return {
      scope: {},
      bindToController: {},
      restrict: "E",
      templateUrl: "tokkPaymentDetails.template.html",
      controller: PaymentDetailsController,
      controllerAs: "vm",
    };
  }

  class PaymentDetailsController {
    public styles: any;
    public editing: boolean;
    public loaded: boolean;
    public billingInformation: IFirebaseBillingInformation;
    public paymentDetails: IPaymentDetails;
    public cardProvider: string;
    public cardLastDigits: string;
    public cardExpirationDate: string;
    public processing: boolean;
    public errorMessage: string;
    public broadcastKey: string;
    public success: boolean;
    public successMessage: string;
    public subscriptions: Array<Rx.Subscription>;

    constructor(
      private $scope: ng.IScope,
      private $http: ng.IHttpService,
      private $timeout: ng.ITimeoutService,
      private serverUrl: string,
      private Auth: Auth,
      private BillingInformation: BillingInformation,
      private Broadcaster: Broadcaster,
      private Countries: Countries,
      private Utilities: Utilities
    ) {}

    $onInit() {
      this.styles = styles;
      this.editing = false;
      this.loaded = false;
      this.billingInformation = null;
      this.paymentDetails = null;
      this.cardProvider = null;
      this.cardLastDigits = null;
      this.cardExpirationDate = null;
      this.processing = false;
      this.errorMessage = null;
      this.broadcastKey = this.Utilities.generateUUID();
      this.success = false;
      this.successMessage = "Successfully updated payment details";

      const listener = this.$scope.$watch(
        () => this.editing,
        (newValue, oldValue) => {
          this.processing = false;
          this.errorMessage = null;
        },
        true
      );

      this.subscriptions = [
        this.BillingInformation.observe().subscribe((billingInformation) => {
          this.loaded = true;
          this.billingInformation = null;
          this.cardProvider = null;
          this.cardLastDigits = null;
          this.cardExpirationDate = null;
          this.paymentDetails = null;

          if (billingInformation) {
            this.billingInformation = billingInformation;
            this.cardProvider = billingInformation.card_type;
            this.cardLastDigits = billingInformation.card_last_digits;
            this.cardExpirationDate = billingInformation.exp_month + "/" + billingInformation.exp_year;
            this.paymentDetails = {
              card_number: null,
              cvc: null,
              exp_month: billingInformation.exp_month,
              exp_year: billingInformation.exp_year,
              cardholder_name: billingInformation.cardholder_name,
            };
          }

          this.$scope.$evalAsync();
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
                    const body: IUpdateCardBody = {
                      firebase_id_token: firebaseIDToken,
                      stripe_token: response.id,
                      group_id: this.Auth.userGroup,
                      user_id: this.Auth.userUID,
                    };

                    return this.$http({
                      url: `${this.serverUrl}/update/paymentdetails`,
                      method: "POST",
                      data: body,
                      headers: { "Content-Type": "application/json" },
                    });
                  })
                  .then(() => {
                    this.processing = false;
                    this.stopEditing(this.processing);
                    this.success = true;
                    this.$timeout(() => (this.success = false), 6000);
                    this.$scope.$evalAsync();
                  })
                  .catch((error) => {
                    this.processing = false;
                    this.errorMessage = _.isString(error["data"])
                      ? `Your payment details could not be updated.<br /> Reason for failure: ${error["data"]}`
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
        listener();
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
      });
    }

    startEditing() {
      this.editing = true;
    }

    stopEditing(processing: boolean) {
      if (!processing) {
        this.editing = false;
      }
    }

    resetErrorMessage() {
      this.errorMessage = null;
    }

    update(broadcastKey: string, processing: boolean, loaded: boolean) {
      if (loaded && !processing) {
        this.Broadcaster.emit({ key: broadcastKey, message: "validate" });
      }
    }
  }

  angular.module("app").directive("tokkPaymentDetails", tokkPaymentDetails);
}
