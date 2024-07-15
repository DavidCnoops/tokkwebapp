///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {

    'use strict';

    function tokkAccountPage() {
        return {
            scope: {},
            bindToController: {},
            restrict: 'E',
            templateUrl: 'tokkAccountPage.template.html',
            controller: AccountPageController,
            controllerAs: 'vm'
        };
    }

    class AccountPageController {
        public canDeleteAccount: boolean;
        public subscriptionType: 'free' | 'business';
        public subscriptions: Array<Rx.Subscription>;

        constructor(
            private $scope: ng.IScope,
            private $state: ng.ui.IStateService,
            private $timeout: ng.ITimeoutService,
            private Auth: Auth,
            private Users: Users,
            private GroupSubscription: GroupSubscription,
            private GroupMetaData: GroupMetaData
        ) {}

        $onInit() {
            this.canDeleteAccount = false;
            this.subscriptionType = null;

            this.subscriptions = [
                Rx.Observable.combineLatest(
                    this.GroupSubscription.observe(this.Auth.userGroup),

                    this.GroupMetaData.observe(),

                    this.Users.observe()
                        .filter(items => items !== null)
                        .switchMap(users => Rx.Observable.from(users))
                        .filter(user => user.$id === this.Auth.userUID)
                        .distinctUntilChanged(),

                    (s1, s2, s3) => {
                        return {
                            'subscription': s1, 
                            'meta_data': s2,
                            'user': s3
                        };
                    }
                ).subscribe((data) => {
                    this.canDeleteAccount = false;
                    this.subscriptionType = data.subscription.type;

                    if (data.subscription.type === 'free' || (
                            data.subscription.type === 'business' &&
                            (data.subscription.status === 'cancelled' || data.subscription.status === 'trial') && 
                            data.meta_data.active_user_count === 1 && 
                            data.meta_data.archived_user_count === 0 &&
                            data.user.admin === true &&
                            data.user.status === 'active'
                    )) {
                        this.canDeleteAccount = true;
                    }

                    this.$scope.$evalAsync();
                })
            ];

            this.$scope.$on('$destroy', () => {
                this.subscriptions.forEach(subscription => subscription.unsubscribe());
            });
        }


        logout() {
            this.$state.go('login');

            this.$timeout(() => {
                this.Auth.unAuth();
            }, 50);
        }
    }

    angular.module('app').directive('tokkAccountPage', tokkAccountPage);
}