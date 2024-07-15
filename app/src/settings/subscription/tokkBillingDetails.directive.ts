///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  const styles = require("tokkBillingDetails.css");

  interface IUpdateBillingDetailsBody {
    firebase_id_token: any;
    group_id: string;
    user_id: string;
    address: string;
    city: string;
    postal_code: string;
    email: string;
    country_code: string;
    is_business: boolean;
    company_name: string;
    company_vat_number: string;
  }

  function tokkBillingDetails() {
    return {
      scope: {},
      bindToController: {},
      restrict: "E",
      templateUrl: "tokkBillingDetails.template.html",
      controller: BillingDetailsController,
      controllerAs: "vm",
    };
  }

  class BillingDetailsController {
    public styles: any;
    public hasBillingInformation: boolean;
    public editing: boolean;
    public email: string;
    public address: string;
    public city: string;
    public postalCode: string;
    public countryName: string;
    public isBusiness: boolean;
    public companyName: string;
    public companyVAT: string;
    public billingDetails: IBillingDetails;
    public processing: boolean;
    public errorMessage: string;
    public success: boolean;
    public successMessage: string;
    public broadcastKey: string;
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
      this.hasBillingInformation = false;
      this.editing = false;
      this.email = null;
      this.address = null;
      this.city = null;
      this.postalCode = null;
      this.countryName = null;
      this.isBusiness = null;
      this.companyName = null;
      this.companyVAT = null;
      this.billingDetails = null;
      this.processing = false;
      this.errorMessage = null;
      this.success = false;
      this.successMessage = "Successfully updated billing details";
      this.broadcastKey = this.Utilities.generateUUID();

      this.subscriptions = [
        this.BillingInformation.observe().subscribe((billingInformation) => {
          this.hasBillingInformation = false;
          this.email = null;
          this.address = null;
          this.city = null;
          this.postalCode = null;
          this.countryName = null;
          this.isBusiness = null;
          this.companyName = null;
          this.companyVAT = null;
          this.billingDetails = null;

          if (billingInformation) {
            this.hasBillingInformation = true;
            this.email = billingInformation.email;
            this.address = billingInformation.address;
            this.city = billingInformation.city;
            this.postalCode = billingInformation.postal_code;
            this.countryName = _.find(
              this.Countries.list,
              (item) => item.code === billingInformation.country_code
            ).name;
            this.isBusiness = billingInformation.is_business;
            this.companyName = billingInformation.company_name;
            this.companyVAT = billingInformation.company_vat_number;
            this.billingDetails = {
              email: billingInformation.email,
              address: billingInformation.address,
              city: billingInformation.city,
              postal_code: billingInformation.postal_code,
              country_code: billingInformation.country_code,
              is_business: billingInformation.is_business,
              company_name: billingInformation.company_name,
              company_vat_number: billingInformation.company_vat_number,
            };
          }

          this.$scope.$evalAsync();
        }),

        Rx.Observable.zip(
          this.Broadcaster.observeKey(this.broadcastKey).filter(
            (data: IBroadcastObject) => data.message === "validate"
          ),

          this.Broadcaster.observeKey(this.broadcastKey).filter(
            (data: IBroadcastObject) => data.message === "billing-details"
          ),

          (s1, s2) => {
            return {
              billing_details: <IBillingDetails>s2["value"],
            };
          }
        ).subscribe((data) => {
          firebase.default
            .auth()
            .currentUser.getIdToken(true)
            .then((firebaseIDToken) => {
              this.processing = true;
              this.errorMessage = null;
              this.$scope.$evalAsync();

              const body: IUpdateBillingDetailsBody = {
                firebase_id_token: firebaseIDToken,
                group_id: this.Auth.userGroup,
                user_id: this.Auth.userUID,
                email: data.billing_details.email,
                address: data.billing_details.address,
                city: data.billing_details.city,
                postal_code: data.billing_details.postal_code,
                country_code: data.billing_details.country_code,
                is_business: data.billing_details.is_business,
                company_name: data.billing_details.company_name,
                company_vat_number: data.billing_details.company_vat_number,
              };

              return this.$http({
                url: `${this.serverUrl}/update/billingdetails`,
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
                ? `${error["data"]}`
                : `Something went wrong. Please try again.`;
              this.$scope.$evalAsync();
            });
        }),
      ];

      this.$scope.$on("$destroy", () => {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
      });
    }

    startEditing() {
      this.processing = false;
      this.errorMessage = null;
      this.editing = true;
    }

    stopEditing(processing: boolean) {
      if (!processing) {
        this.editing = false;
      }
    }

    save(broadcastKey: string, processing: boolean) {
      if (!processing) {
        this.Broadcaster.emit({ key: broadcastKey, message: "validate" });
      }
    }
  }

  angular.module("app").directive("tokkBillingDetails", tokkBillingDetails);
}
