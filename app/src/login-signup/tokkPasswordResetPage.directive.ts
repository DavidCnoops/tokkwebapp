///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {
  "use strict";

  const styles = require("tokkLoginPage.css");

  function tokkPasswordResetPage() {
    return {
      scope: {},
      bindToController: {},
      restrict: "E",
      templateUrl: "tokkPasswordResetPage.template.html",
      controller: PasswordResetController,
      controllerAs: "vm",
    };
  }

  class PasswordResetController {
    public styles: any;
    public email: string;
    public success: boolean;
    public successMessage: string;
    public processing: boolean;
    public error: IErrorObject;

    constructor(
      private $scope: ng.IScope,
      private $timeout: ng.ITimeoutService,
      private $element: ng.IRootElementService,
      private Utilities: Utilities
    ) {}

    $onInit() {
      this.styles = styles;
      this.email = null;
      this.success = false;
      this.successMessage = null;
      this.processing = false;
      this.error = null;
    }

    $postLink() {
      this.$timeout(() => this.focusInput("email"));
    }

    focusInput(inputName: "email") {
      const elementToFocus = <HTMLInputElement>this.$element[0].querySelector(`.${inputName}`);
      elementToFocus.focus();
    }

    resetError() {
      this.success = null;
      this.error = null;
    }

    resetPassword(email: string) {
      email = _.trim(email);

      this.resetError();

      if (!email) {
        this.focusInput("email");
        this.error = this.Utilities.getError("no-email");
      } else {
        this.processing = true;

        firebase.default
          .auth()
          .sendPasswordResetEmail(email)
          .then(() => {
            this.processing = false;
            this.email = null;
            this.success = true;
            this.successMessage = `A password reset email was sent to ${email}`;
            this.$scope.$evalAsync();
          })
          .catch((error) => {
            this.processing = false;
            this.error = this.Utilities.getError(error);

            if (_.includes(this.error.code, "email")) {
              this.focusInput("email");
            }

            this.$scope.$evalAsync();
          });
      }
    }
  }

  angular.module("app").directive("tokkPasswordResetPage", tokkPasswordResetPage);
}
