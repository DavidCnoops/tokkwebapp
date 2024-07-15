///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {

    'use strict';

    const styles = require('tokkInvitationsPage.css');

    function tokkInvitationsPage() {
        return {
            scope: {},
            bindToController: {},
            restrict: 'E',
            templateUrl: 'tokkInvitationsPage.template.html',
            controller: InvitationsPageController,
            controllerAs: 'vm'
        };
    }

    class InvitationsPageController {
        public styles: any;
        public subscriptions: Array<Rx.Subscription>;

        constructor(
            private $scope: ng.IScope,
            private GroupInvitations: GroupInvitations
        ) {}

        $onInit() {
            this.styles = styles;

            this.subscriptions = [
                this.GroupInvitations.observe().subscribe()
            ];

            this.$scope.$on('$destroy', () => {
                this.subscriptions.forEach(subscription => subscription.unsubscribe());
            });
        }
    }

    angular.module('app').directive('tokkInvitationsPage', tokkInvitationsPage);
}