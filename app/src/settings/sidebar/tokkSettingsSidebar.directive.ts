///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {

    'use strict';

    const styles = require('tokkSettingsSidebar.css');

    function tokkSettingsSidebar() {
        return {
            scope: {},
            bindToController: {},
            restrict: 'E',
            templateUrl: 'tokkSettingsSidebar.template.html',
            controller: SettingsSidebarController,
            controllerAs: 'vm'
        };
    }

    class SettingsSidebarController {
        public styles: any;
        public loaded: boolean;
        public user: IUser;
        public subscription: IGroupSubscription;
        public subscriptions: Array<Rx.Subscription>;

        constructor(
            private $scope: ng.IScope,
            private Auth: Auth,
            private Users: Users,
            private GroupSubscription: GroupSubscription
        ) {}

        $onInit() {
            this.styles = styles;
            this.loaded = false;
            this.user = null;
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
                    this.loaded = true;
                    this.user = data.user;
                    this.subscription = data.subscription;
                    this.$scope.$evalAsync();
                })
            ];

            this.$scope.$on('$destroy', () => {
                this.subscriptions.forEach(subscription => subscription.unsubscribe());
            });
        }
    }

    angular.module('app').directive('tokkSettingsSidebar', tokkSettingsSidebar);
}