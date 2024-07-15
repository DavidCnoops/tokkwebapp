///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  const styles = require("tokkChangePassword.css");

  function tokkChangePassword() {
    return {
      scope: {},
      bindToController: {},
      restrict: "E",
      templateUrl: "tokkChangePassword.template.html",
      controller: ChangePasswordController,
      controllerAs: "vm",
    };
  }

  class ChangePasswordController {
    public styles: any;
    public loaded: boolean;
    public error: IErrorObject;
    public email: string;
    public newPassword: string;
    public newPasswordConfirmation: string;
    public currentPassword: string;
    public processing: boolean;
    public success: boolean;
    public successMessage: string;
    public subscriptions: Array<Rx.Subscription>;

    constructor(
      private $scope: ng.IScope,
      private $timeout: ng.ITimeoutService,
      private Auth: Auth,
      private Users: Users,
      private Utilities: Utilities
    ) {}

    $onInit() {
      this.styles = styles;
      this.loaded = false;
      this.error = null;
      this.email = null;
      this.newPassword = null;
      this.newPasswordConfirmation = null;
      this.currentPassword = null;
      this.processing = false;
      this.success = false;
      this.successMessage = "Successfully changed password";

      this.subscriptions = [
        this.Users.observe()
          .filter((items) => items !== null)
          .switchMap((users) => Rx.Observable.from(users))
          .filter((user) => user.$id === this.Auth.userUID)
          .distinctUntilChanged()
          .subscribe((user) => {
            this.loaded = true;
            this.email = user.email;
            this.$scope.$evalAsync();
          }),
      ];

      this.$scope.$on("$destroy", () => {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
      });
    }

    resetError() {
      this.error = null;
    }

    resetSuccess() {
      this.success = false;
    }

    save(email: string, currentPassword: string, newPassword: string, newPasswordConfirmation: string) {
      if (this.loaded && !this.processing) {
        this.resetError();
        this.resetSuccess();

        if (!currentPassword) {
          this.error = this.Utilities.getError("no-current-password");
        } else if (!newPassword) {
          this.error = this.Utilities.getError("no-new-password");
        } else if (newPassword.length < 6) {
          this.error = this.Utilities.getError("weak-password");
        } else if (newPassword !== newPasswordConfirmation) {
          this.error = this.Utilities.getError("passwords-no-match");
        } else {
          this.processing = true;

          const user = firebase.default.auth().currentUser;
          const credential = firebase.default.auth.EmailAuthProvider.credential(email, currentPassword);

          user
            .reauthenticateAndRetrieveDataWithCredential(credential)
            .then(() => {
              return this.Users.updatePassword(email, currentPassword, newPassword);
            })
            .then(() => {
              this.currentPassword = null;
              this.newPassword = null;
              this.newPasswordConfirmation = null;
              this.processing = false;
              this.success = true;
              this.$timeout(() => (this.success = false), 6000);
              this.$scope.$evalAsync();
            })
            .catch((error) => {
              this.processing = false;
              this.error = this.Utilities.getError(error);
              this.$scope.$evalAsync();
            });
        }
      }
    }
  }

  angular.module("app").directive("tokkChangePassword", tokkChangePassword);
}
