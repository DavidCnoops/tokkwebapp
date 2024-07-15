///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  export interface IFirebaseBillingInformation {
    card_type: string;
    card_last_digits: string;
    exp_month: number;
    exp_year: number;
    cardholder_name: string;
    email: string;
    address: string;
    city: string;
    postal_code: string;
    country_code: string;
    is_business: boolean;
    company_name?: string;
    company_vat_number?: string;
  }

  export class BillingInformation {
    constructor(private Auth: Auth, private FirebaseUtils: FirebaseUtils) {}

    observe() {
      const ref = firebase.default.database().ref(`group/${this.Auth.userGroup}/billing_information/`);
      return this.FirebaseUtils.objectStream<IFirebaseBillingInformation>("billinginformation", ref).observable;
    }
  }

  angular.module("app").service("BillingInformation", BillingInformation);
}
