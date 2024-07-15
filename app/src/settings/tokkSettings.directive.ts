///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';

    const styles = require('tokkSettings.css');

    function tokkSettings() {
        return {
            scope: {},
            bindToController: {},
            restrict: 'E',
            template: `
                <div class="{{::vm.styles.container}}">
                    <tokk-settings-sidebar class="{{::vm.styles.sidebar}}"></tokk-settings-sidebar>
                    <ui-view class="{{::vm.styles.page}}"></ui-view>
                </div>
            `,
            controller: SettingsController,
            controllerAs: 'vm'
        };
    }

    class SettingsController {
        public styles: any;
        public subscriptions: Array<Rx.Subscription>;

        constructor(
            private Auth: Auth,
            private GroupMetaData: GroupMetaData,
            private GroupSubscription: GroupSubscription,
            private GroupInvitations: GroupInvitations,
            private BillingInformation: BillingInformation,
            private Users: Users
        ) {}

        $onInit() {
            this.styles = styles;
            this.subscriptions = [
                this.BillingInformation.observe().subscribe(),
                this.GroupSubscription.observe(this.Auth.userGroup).subscribe(),
                this.GroupMetaData.observe().subscribe(),
                this.GroupInvitations.observe().subscribe(),
                this.Users.observe().subscribe()
            ];
        }

        $onDestroy() {
            this.subscriptions.forEach(subscription => subscription.unsubscribe());
        }
    }

    angular.module('app').directive('tokkSettings', tokkSettings);
}