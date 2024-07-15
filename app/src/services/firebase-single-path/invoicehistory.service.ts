///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  export interface IInvoice {
    $id: string;
    invoice_id: string;
    invoice_timestamp: number;
    invoice_amount: number;
    invoice_quantity: number;
  }

  export class Invoices {
    constructor(private Auth: Auth, private FirebaseUtils: FirebaseUtils) {}

    observe() {
      const ref = firebase.default.database().ref(`group/${this.Auth.userGroup}/invoices/`);
      return this.FirebaseUtils.arrayStream<IInvoice>("invoicehistory", ref).observable;
    }
  }

  angular.module("app").service("Invoices", Invoices);
}
