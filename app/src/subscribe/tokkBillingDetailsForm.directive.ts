///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';

    const styles = require('tokkBillingDetailsForm.css');

    export interface IBillingDetails {
        email: string;
        address: string;
        city: string;
        postal_code: string;
        country_code: string;
        is_business: boolean;
        company_name: string;
        company_vat_number: string;
    }

    function tokkBillingDetailsForm() {
        return {
            scope: {},
            bindToController: {
                broadcastKey: '<',
                fill: '<',
                billingDetails: '<'
            },
            restrict: 'E',
            templateUrl: 'tokkBillingDetailsForm.template.html',
            controller: BillingDetailsFormController,
            controllerAs: 'vm'
        };
    }

    class BillingDetailsFormController {
        public styles: any;
        public broadcastKey: string;
        public fill: string;
        public billingDetails: IBillingDetails;
        public email: string;
        public noEmail: boolean;
        public noEmailMessage: string;
        public invalidEmail: boolean;
        public invalidEmailMessage: string;
        public address: string;
        public noAddress: boolean;
        public noAddressMessage: string;
        public city: string;
        public noCity: boolean;
        public noCityMessage: string;
        public postalCode: string;
        public noPostalCode: boolean;
        public noPostalCodeMessage: string;
        public country: ICountry;
        public noCountry: boolean;
        public noCountryMessage: string;
        public isBusiness: boolean;
        public isBusinessBeforeUpdate: boolean;
        public companyName: string;
        public noCompanyName: boolean;
        public noCompanyNameMessage: string;
        public companyVAT: string;
        public noCompanyVAT: boolean;
        public noCompanyVATMessage: string;
        public subscriptions: Array<Rx.Subscription>;

        constructor(
            private $scope: ng.IScope,
            private Countries: Countries,
            private Utilities: Utilities,
            private Broadcaster: Broadcaster
        ) {}

        $onInit() {
            this.styles = styles;
            this.email = null;
            this.address = null;
            this.city = null;
            this.postalCode = null;
            this.country = null;
            this.isBusiness = true;
            this.isBusinessBeforeUpdate = false;
            this.companyName = null;
            this.companyVAT = null;

            this.noEmailMessage = `Please enter an email address`;
            this.invalidEmailMessage = `Invalid email address`;
            this.noAddressMessage = `Please enter a street address`;
            this.noCityMessage = `Please enter a city name`;
            this.noPostalCodeMessage = `Please enter a postal code`;
            this.noCountryMessage = `Please select a country`;
            this.noCompanyNameMessage = `Please enter your company name`;
            this.noCompanyVATMessage = `Please enter a VAT number`;

            if (this.fill && this.billingDetails) {
                this.email = _.cloneDeep(this.billingDetails.email);
                this.address = _.cloneDeep(this.billingDetails.address);
                this.city = _.cloneDeep(this.billingDetails.city);
                this.postalCode = _.cloneDeep(this.billingDetails.postal_code);
                this.country = _(this.Countries.list).find(item => item.code === this.billingDetails.country_code);
                this.isBusiness = _.cloneDeep(this.billingDetails.is_business);
                this.isBusinessBeforeUpdate = _.cloneDeep(this.billingDetails.is_business);
                this.companyName = (this.billingDetails.company_name ? _.cloneDeep(this.billingDetails.company_name) : null);
                this.companyVAT = (this.billingDetails.company_vat_number ? _.cloneDeep(this.billingDetails.company_vat_number) : null);
            }

            this.resetValidation();

            this.subscriptions = [
                this.Broadcaster
                    .observeKey(this.broadcastKey)
                    .filter(data => data.message === 'validate')
                    .subscribe(() => {
                        if (this.validate()) {
                            const billingDetails: IBillingDetails = {
                                'email': this.email,
                                'address': this.address,
                                'city': this.city,
                                'postal_code': this.postalCode,
                                'country_code': this.country.code,
                                'is_business': this.isBusiness,
                                'company_name': this.companyName,
                                'company_vat_number': this.companyVAT
                            };

                            this.Broadcaster.emit({
                                'key': this.broadcastKey, 
                                'message': 'billing-details', 
                                'value': billingDetails
                            });
                        }
                    })
            ];

            this.$scope.$on('$destroy', () => {
                this.subscriptions.forEach(subscription => subscription.unsubscribe());
            });
        }


        resetEmailValidation() {
            this.noEmail = false;
            this.invalidEmail = false;
        }


        resetAddressValidation() {
            this.noAddress = false;
        }


        resetCityValidation() {
            this.noCity = false;
        }


        resetPostalCodeValidation() {
            this.noPostalCode = false;
        }


        resetCountryValidation() {
            this.noCountry = false;
        }


        resetCompanyNameValidation() {
            this.noCompanyName = false;
        }


        resetCompanyVATValidation() {
            this.noCompanyVAT = false;
        }


        resetValidation() {
            this.resetEmailValidation();
            this.resetAddressValidation();
            this.resetCityValidation();
            this.resetPostalCodeValidation();
            this.resetCountryValidation();
            this.resetCompanyNameValidation();
            this.resetCompanyVATValidation();
        }


        toggleCustomerType(isBusiness: boolean) {
            this.isBusiness = !isBusiness;
            this.resetCompanyNameValidation();
            this.resetCompanyVATValidation();
        }


        validate() {
            let isValid = true;

            this.resetValidation();

            if (!this.email) {
                this.noEmail = true;
                isValid = false;
            }
            else if (!this.Utilities.validEmail(this.email)) {
                this.invalidEmail = true;
                isValid = false;
            }

            if (!this.address) {
                this.noAddress = true;
                isValid = false;
            }

            if (!this.city) {
                this.noCity = true;
                isValid = false;
            }

            if (!this.postalCode) {
                this.noPostalCode = true;
                isValid = false;
            }

            if (!this.country) {
                this.noCountry = true;
                isValid = false;
            }

            if (this.isBusiness) {
                if (!this.companyName) {
                    this.noCompanyName = true;
                    isValid = false;
                }
    
                if (this.country && this.country.EU && !this.companyVAT) {
                    this.noCompanyVAT = true;
                    isValid = false;
                }
                else if (this.country && !this.country.EU) {
                    this.noCompanyVAT = false;
                    this.companyVAT = null;
                }
            }
            else {
                this.companyName = null;
                this.companyVAT = null;
            }

            return isValid;
        }
    }

    angular.module('app').directive('tokkBillingDetailsForm', tokkBillingDetailsForm);
}