///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  const styles = require("tokkDownloadInvoice.css");

  function tokkDownloadInvoice() {
    return {
      scope: {},
      bindToController: {
        invoiceID: "@invoiceid",
      },
      restrict: "E",
      template: `
                <div class="{{::vm.styles.container}}">
                    <span class="icon-download {{::vm.styles.icon}}" ng-if="!vm.processing" ng-click="vm.download(vm.invoice)">
                        <tokk-tooltip message="Download" vdistance="40px"></tokk-tooltip>
                    </span>

                    <tokk-spinner ng-if="vm.processing" size="20px" color="#333" thickness="3px" class="{{::vm.styles.spinner}}"></tokk-spinner>
                </div>
            `,
      controller: DownloadInvoiceController,
      controllerAs: "vm",
    };
  }

  class DownloadInvoiceController {
    public styles: any;
    public invoiceID: string;
    public invoice: IInvoice;
    public processing: boolean;
    public subscriptions: Array<Rx.Subscription>;

    constructor(
      private $scope: ng.IScope,
      private $http: ng.IHttpService,
      private serverUrl: string,
      private Auth: Auth,
      private Invoices: Invoices
    ) {}

    $onInit() {
      this.styles = styles;
      this.invoice = null;
      this.processing = false;

      this.subscriptions = [
        this.Invoices.observe()
          .filter((invoices) => invoices !== null)
          .switchMap((invoices) => Rx.Observable.from(invoices))
          .filter((invoice) => invoice.invoice_id === this.invoiceID)
          .distinctUntilChanged()
          .subscribe((invoice) => {
            this.invoice = invoice;
            this.$scope.$evalAsync();
          }),
      ];

      this.$scope.$on("$destroy", () => {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
      });
    }

    download(invoice: IInvoice) {
      if (!this.processing) {
        this.processing = true;

        firebase.default
          .auth()
          .currentUser.getIdToken(true)
          .then((firebaseIDToken) => {
            return this.$http({
              url: `${this.serverUrl}/download/invoice`,
              method: "POST",
              data: {
                firebase_id_token: firebaseIDToken,
                user_id: this.Auth.userUID,
                group_id: this.Auth.userGroup,
                invoice_id: invoice.$id,
              },
              headers: {
                "Content-Type": "application/json",
              },
              responseType: "arraybuffer",
            });
          })
          .then((serverResponse) => {
            this.processing = false;
            const blob = new Blob([serverResponse.data as any], { type: "application/pdf" });
            const invoiceDate = moment(invoice.invoice_timestamp).format("YYY-MM-DD");
            const filename = `Tokk-Invoice-${invoiceDate}.pdf`;
            saveAs(blob, filename);
            this.$scope.$evalAsync();
          })
          .catch((error) => {
            this.processing = false;
            this.$scope.$evalAsync();
          });
      }
    }
  }

  angular.module("app").directive("tokkDownloadInvoice", tokkDownloadInvoice);
}
