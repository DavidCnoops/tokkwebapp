///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {

    'use strict';

    const styles = require('tokkInvoiceHistory.css');

    function tokkInvoiceHistory() {
        return {
            scope: {},
            bindToController: {},
            restrict: 'E',
            templateUrl: 'tokkInvoiceHistory.template.html',
            controller: InvoiceHistoryController,
            controllerAs: 'vm'
        };
    }

    class InvoiceHistoryController {
        public styles: any;
        public loaded: boolean;
        public invoices: Array<IInvoice>;
        public subscriptions: Array<Rx.Subscription>;

        constructor(
            private $scope: ng.IScope,
            private Invoices: Invoices
        ) {}

        $onInit() {
            this.styles = styles;
            this.loaded = false;
            this.invoices = null;

            this.subscriptions = [
                this.Invoices.observe().subscribe((invoices) => {
                    this.loaded = true;
                    this.invoices  = _(invoices).sortBy(invoice => invoice.invoice_timestamp).value();
                    this.$scope.$evalAsync();
                })
            ];

            this.$scope.$on('$destroy', () => {
                this.subscriptions.forEach(subscription => subscription.unsubscribe());
            });
        }


        getDate(timestamp: number) {
            return moment(timestamp).format('MMM D, YYYY');
        }
    }

    angular.module('app').directive('tokkInvoiceHistory', tokkInvoiceHistory);
}