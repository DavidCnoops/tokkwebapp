///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {

    'use strict';

    const styles = require('tokkSubscriptionPage.css');

    function tokkSubscriptionPage() {
        return {
            scope: {},
            bindToController: {},
            restrict: 'E',
            templateUrl: 'tokkSubscriptionPage.template.html',
            controller: SubscriptionPageController,
            controllerAs: 'vm'
        };
    }

    class SubscriptionPageController {
        public styles: any;
        public loaded: boolean;
        public modalOpened: boolean;
        public modalTitle: string;
        public modalContent: string;
        public subscription: IGroupSubscription;
        public subscriptions: Array<Rx.Subscription>;

        constructor(
            private $scope: ng.IScope,
            private $state: ng.ui.IStateService, 
            private Auth: Auth,
            private Users: Users,
            private GroupSubscription: GroupSubscription
        ) {}

        $onInit() {
            this.styles = styles;
            this.loaded = false;
            this.modalOpened = false;
            this.modalTitle = null;
            this.modalContent = null;
            this.subscription = null;

            this.subscriptions = [
                Rx.Observable.combineLatest(
                    this.Users.observe()
                        .filter(items => items !== null)
                        .switchMap(users => Rx.Observable.from(users))
                        .filter(user => user.$id === this.Auth.userUID)
                        .distinctUntilChanged(),

                    this.GroupSubscription.observe(this.Auth.userGroup),

                    (s1, s2) => {
                        return {
                            'user': s1,
                            'subscription': s2
                        };
                    }
                ).subscribe((data) => {
                    if (data.subscription.type === 'business' && !data.user.admin) {
                        this.$state.go('loggedin.settings.account');
                    }
                    else {
                        this.loaded = true;

                        // on upgrade to trial version
                        if (this.subscription && 
                            this.subscription.type === 'free' && 
                            data.subscription && 
                            data.subscription.type === 'business'
                        ) {
                            document.body.scrollTop = document.documentElement.scrollTop = 0;
                            this.modalOpened = true;
                            this.modalTitle = `Upgrade successful`;
                            this.modalContent = `Your account is upgraded to a free 30-day trial of Tokk for Business`;
                        }

                        // on purchase
                        if (this.subscription && 
                            this.subscription.type === 'business' && 
                            this.subscription.status === 'trial' && 
                            data.subscription && 
                            data.subscription.type === 'business' && 
                            data.subscription.status === 'active'
                        ) {
                            document.body.scrollTop = document.documentElement.scrollTop = 0;
                            this.modalOpened = true;
                            this.modalTitle = `Purchase successful`;
                            this.modalContent = `You successfully purchased a Tokk for Business subscription.`;
                        }

                        this.subscription = data.subscription;
                    }

                    this.$scope.$evalAsync();
                })
            ];

            this.$scope.$on('$destroy', () => {
                this.subscriptions.forEach(subscription => subscription.unsubscribe());
            });
        }


        closeModal() {
            this.modalOpened = false;
        }
    }

    angular.module('app').directive('tokkSubscriptionPage', tokkSubscriptionPage);
}