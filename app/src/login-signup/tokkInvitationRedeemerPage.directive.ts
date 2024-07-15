///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';

    const styles = require('tokkInvitationRedeemerPage.css');

    function tokkInvitationRedeemerPage() {
        return {
            scope: {},
            bindToController: {
                token: '<'
            },
            restrict: 'E',
            templateUrl: 'tokkInvitationRedeemerPage.template.html',
            controller: InvitationRedeemerPageController,
            controllerAs: 'vm'
        };
    }

    class InvitationRedeemerPageController {
        public styles: any;
        public token: string;
        public loaded: boolean;
        public invitation: IInvitationReference;

        constructor(
            private InvitationReferences: InvitationReferences
        ) {}

        $onInit() {
            this.styles = styles;
            this.loaded = false;
            this.invitation = null;

            this.InvitationReferences.getSingleInvitationOnce(this.token).then((invitation) => {
                this.loaded = true;
                this.invitation = invitation;
            })
            .catch(() => {
                this.loaded = true;
                this.invitation = null;
            });
        }
    }

    angular.module('app').directive('tokkInvitationRedeemerPage', tokkInvitationRedeemerPage);
}