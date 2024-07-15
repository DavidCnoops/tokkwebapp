///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';

    const styles = require('tokkSubscribePage.css');

    function tokkSubscribePage() {
        return {
            scope: {},
            bindToController: {
                code: '<'
            },
            restrict: 'E',
            templateUrl: 'tokkSubscribePage.template.html',
            controller: SubscribePageController,
            controllerAs: 'vm'
        };
    }

    class SubscribePageController {
        public styles: any;
        public code: IGroupSubscriptionErrorCodes;
        public loaded: boolean;
        public subscriptions: Array<Rx.Subscription>;

        constructor(
            private $scope: ng.IScope,
            private $state: ng.ui.IStateService,
            private Auth: Auth,
            private GroupMetaData: GroupMetaData,
            private GroupSubscription: GroupSubscription,
            private BillingInformation: BillingInformation
        ) {}

        $onInit() {
            this.styles = styles;
            this.loaded = false;
            this.subscriptions = [];

            this.$scope.$on('$destroy', () => {
                this.subscriptions.forEach(subscription => subscription.unsubscribe());
            });
        }


        $postLink() {
            if (this.code) {
                this.subscriptions = [
                    Rx.Observable.combineLatest(
                        this.Auth.asyncCheckAuthentication(),
                        this.GroupMetaData.observe(),
                        this.GroupSubscription.observe(this.Auth.userGroup),
                        this.BillingInformation.observe(),
                        (s1, s2, s3, s4) => {
                            return {
                                'meta_data': s2,
                                'subscription': s3,
                                'billing_information': s4
                            };
                        }
                    )
                    .subscribe((data) => {
                        if (!this.loaded) {
                            this.loaded = true;
                            this.$scope.$evalAsync();
                        }
                    },
                    (error) => {
                        this.$state.go('login');
                    })
                ];
            }
            else {
                this.$state.go('login');
            }
        }
    }

    angular.module('app').directive('tokkSubscribePage', tokkSubscribePage);
}