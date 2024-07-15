///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {
  "use strict";

  const styles = require("tokkLoginPage.css");

  function tokkLoginPage() {
    return {
      scope: {},
      bindToController: {},
      restrict: "E",
      templateUrl: "tokkLoginPage.template.html",
      controller: LoginPageController,
      controllerAs: "vm",
    };
  }

  class LoginPageController {
    public styles: any;
    public email: string;
    public password: string;
    public processing: boolean;
    public error: IErrorObject;

    constructor(
      private $state: ng.ui.IStateService,
      private $timeout: ng.ITimeoutService,
      private $element: ng.IRootElementService,
      private Auth: Auth,
      private Utilities: Utilities
    ) {}

    $onInit() {
      this.styles = styles;
      this.email = null;
      this.password = null;
      this.processing = false;
      this.error = null;
    }

    $postLink() {
      this.$timeout(() => this.focusInput("email"));
    }

    resetError() {
      this.error = null;
    }

    focusInput(inputName: "email" | "password") {
      const elementToFocus = <HTMLInputElement>(
        this.$element[0].querySelector(`.${inputName}`)
      );
      elementToFocus.focus();
    }

    login(email: string, password: string) {
      email = _.trim(email);
      password = _.trim(password);

      this.resetError();

      if (!email) {
        this.focusInput("email");
        this.error = this.Utilities.getError("no-email");
      } else if (!password) {
        this.focusInput("password");
        this.error = this.Utilities.getError("no-password");
      } else {
        this.processing = true;

        this.Auth.login(email, password)
          .then(() => {
            this.$state.go("loggedin.projects");
          })
          .catch((error) => {
            this.processing = false;

            const errorCodes = [
              "TOKK_TRIAL_EXPIRED",
              "TOKK_SUBSCRIPTION_CANCELLED",
              "TOKK_SUBSCRIPTION_ERROR",
            ];

            if (
              error &&
              error["code"] &&
              _.includes(errorCodes, error["code"])
            ) {
              this.$state.go("subscribe", { code: error["code"] });
            } else {
              this.error = this.Utilities.getError(error);

              if (_.includes(this.error.code, "email")) {
                this.focusInput("email");
              } else if (_.includes(this.error.code, "password")) {
                this.focusInput("password");
              }
            }
          });
      }
    }
  }

  angular.module("app").directive("tokkLoginPage", tokkLoginPage);
}
