///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {

    'use strict';

    const styles = require('tokkUsersPage.css');

    function tokkUsersPage() {
        return {
            scope: {},
            bindToController: {},
            restrict: 'E',
            templateUrl: 'tokkUsersPage.template.html',
            controller: UsersPageController,
            controllerAs: 'vm'
        };
    }

    class UsersPageController {
        public styles: any;
        public loaded: boolean;
        public helpOpened: boolean;
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
            this.helpOpened = false;

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
                    this.loaded = false;

                    if (data.subscription.type !== 'business') {
                        this.$state.go('loggedin.settings.account');
                    }
                    else {
                        this.loaded = true;
                    }

                    this.$scope.$evalAsync();
                })
            ];

            this.$scope.$on('$destroy', () => {
                this.subscriptions.forEach(subscription => subscription.unsubscribe());
            });
        }


        openHelp() {
            this.helpOpened = true;
        }


        closeHelp() {
            this.helpOpened = false;
        }


        toggleHelp() {
            this.helpOpened = !this.helpOpened;
        }
    }

    angular.module('app').directive('tokkUsersPage', tokkUsersPage);
}