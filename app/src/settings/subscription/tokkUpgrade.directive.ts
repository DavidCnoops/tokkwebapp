///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {

    'use strict';
    
    const styles = require('tokkUpgrade.css');

    function tokkUpgrade() {
        return {
            scope: {},
            bindToController: {},
            restrict: 'E',
            templateUrl: 'tokkUpgrade.template.html',
            controller: UpgradeController,
            controllerAs: 'vm'
        };
    }

    class UpgradeController {
        public styles: any;
        public processing: boolean;
        public firstName: string;
        public lastName: string;
        public error: IErrorObject;

        constructor(
            private $scope: ng.IScope,
            private $q: ng.IQService,
            private $timeout: ng.ITimeoutService,
            private Auth: Auth,
            private GroupSubscription: GroupSubscription,
            private Utilities: Utilities,
            private Users: Users
        ) {}

        $onInit() {
            this.styles = styles;
            this.processing = false;
            this.error = null;
        }


        resetError() {
            this.error = null;
        }


        upgrade(firstName: string, lastName: string) {
            if (!firstName) {
                this.error = this.Utilities.getError('no-firstname');
            }
            else if (!lastName) {
                this.error = this.Utilities.getError('no-lastname');
            }
            else {
                this.processing = true;

                return this.$q.all([
                    this.Users.updateFirstName(this.Auth.userGroup, this.Auth.userUID, firstName),
                    this.Users.updateLastName(this.Auth.userGroup, this.Auth.userUID, lastName)
                ])
                .then(() => {
                    // delay
                    return this.$timeout(() => true, 1000);
                })
                .then(() => {
                    return this.GroupSubscription.upgradeToBusinessTrial(this.Auth.userGroup);
                })
                .catch((error) => {
                    this.processing = false;
                    this.error = this.Utilities.getError(error);
                    this.$scope.$evalAsync();
                });
            }
        }
    }

    angular.module('app').directive('tokkUpgrade', tokkUpgrade);
}