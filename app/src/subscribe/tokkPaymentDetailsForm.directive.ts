///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';

    const styles = require('tokkPaymentDetailsForm.css');

    export interface IPaymentDetails {
        card_number: string;
        cvc: string;
        exp_month: number;
        exp_year: number;
        cardholder_name: string;
    }

    function tokkPaymentDetailsForm() {
        return {
            scope: {},
            bindToController: {
                broadcastKey: '<',
                reset: '&'
            },
            restrict: 'E',
            templateUrl: 'tokkPaymentDetailsForm.template.html',
            controller: PaymentDetailsFormController,
            controllerAs: 'vm'
        };
    }

    class PaymentDetailsFormController {
        public styles: any;
        public broadcastKey: string;
        public reset: Function;
        public cardNumber: string;
        public noCardNumber: boolean;
        public noCardNumberMessage: string;
        public invalidCardNumber: boolean;
        public invalidCardNumberMessage: string;
        public unsupportedCard: boolean;
        public unsupportedCardMessage: string;
        public CVC: string;
        public noCVC: boolean;
        public noCVCMessage: string;
        public invalidCVC: boolean;
        public invalidCVCMessage: string;
        public months: Array<number>;
        public years: Array<number>;
        public expMonth: number;
        public expYear: number;
        public noExpiry: boolean;
        public noExpiryMessage: string;
        public invalidExpiry: boolean;
        public invalidExpiryMessage: string;
        public cardholderName: string;
        public noCardholderName: boolean;
        public noCardholderNameMessage: string;
        public subscriptions: Array<Rx.Subscription>;

        constructor(
            private $scope: ng.IScope,
            private Broadcaster: Broadcaster
        ) {}

        $onInit() {
            this.styles = styles;
            this.months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
            this.years = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035];
            this.cardNumber = null;
            this.CVC = null;
            this.expMonth = null;
            this.expYear = null;
            this.cardholderName = null;

            this.noCardNumberMessage = `Please enter your card number`;
            this.invalidCardNumberMessage = `Invalid card number`;
            this.unsupportedCardMessage = `Card not accepted. Please use Visa, Mastercard or American Express.`;
            this.noCVCMessage = `Please enter CVC code`;
            this.invalidCVCMessage = `Invalid CVC`;
            this.noExpiryMessage = `Please select an expiry date`;
            this.invalidExpiryMessage = `Invalid expiration date`;
            this.noCardholderNameMessage = `Please enter cardholder's name`;

            this.resetValidation();

            this.subscriptions = [
                this.Broadcaster
                    .observeKey(this.broadcastKey)
                    .filter((data: IBroadcastObject) => data.message === 'validate')
                    .subscribe(() => {
                        if (this.validate()) {
                            const paymentDetails: IPaymentDetails = {
                                'card_number': this.cardNumber,
                                'cvc': this.CVC,
                                'exp_month': this.expMonth,
                                'exp_year': this.expYear,
                                'cardholder_name': this.cardholderName
                            };

                            this.Broadcaster.emit({
                                'key': this.broadcastKey, 
                                'message': 'payment-details', 
                                'value': paymentDetails
                            });
                        }
                    })
            ];

            this.$scope.$on('$destroy', () => {
                this.subscriptions.forEach(subscription => subscription.unsubscribe());
            });
        }


        resetCardNumberValidation() {
            this.noCardNumber = false;
            this.invalidCardNumber = false;
            this.unsupportedCard = false;
            this.reset();
        }


        resetExpiryValidation() {
            this.noExpiry = false;
            this.invalidExpiry = false;
            this.reset();
        }


        resetCVCValidation() {
            this.noCVC = false;
            this.invalidCVC = false;
            this.reset();
        }


        resetCardholderNameValidation() {
            this.noCardholderName = false;
            this.reset();
        }


        resetValidation() {
            this.resetCardNumberValidation();
            this.resetExpiryValidation();
            this.resetCVCValidation();
            this.resetCardholderNameValidation();
        }


        validate() {
            let isValid = true;

            this.resetValidation();

            if (!this.cardNumber) {
                this.noCardNumber = true;
                isValid = false;
            }
            else if (!Stripe.validateCardNumber(this.cardNumber)) {
                this.invalidCardNumber = true;
                isValid = false;
            }
            else {
                const cardProvider = _.trim(_.lowerCase(Stripe.cardType(this.cardNumber))).replace(/\s+/g, '');

                if (!_.includes(['visa', 'mastercard', 'americanexpress'], cardProvider)) {
                    this.unsupportedCard = true;
                    isValid = false;
                }
            }

            if (!this.expMonth || !this.expYear) {
                this.noExpiry = true;
                isValid = false;
            }
            else if (!Stripe.validateExpiry(this.expMonth.toString(), this.expYear.toString())) {
                this.invalidExpiry = true;
                isValid = false;
            }

            if (!this.CVC) {
                this.noCVC = true;
                isValid = false;
            }
            else if (!Stripe.validateCVC(this.CVC)) {
                this.invalidCVC = true;
                isValid = false;
            }

            if (!this.cardholderName) {
                this.noCardholderName = true;
                isValid = false;
            }

            return isValid;
        }
    }

    angular.module('app').directive('tokkPaymentDetailsForm', tokkPaymentDetailsForm);
}