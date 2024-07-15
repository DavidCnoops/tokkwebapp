///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {
  "use strict";

  const styles = require("tokkLoginPage.css");

  function tokkSignupPage() {
    return {
      scope: {},
      bindToController: {},
      restrict: "E",
      templateUrl: "tokkSignupPage.template.html",
      controller: SignupPageController,
      controllerAs: "vm",
    };
  }

  class SignupPageController {
    public styles: any;
    public firstName: string;
    public lastName: string;
    public email: string;
    public password: string;
    public error: IErrorObject;
    public processing: boolean;

    constructor(
      private $state: ng.ui.IStateService,
      private $element: ng.IRootElementService,
      private $timeout: ng.ITimeoutService,
      private Auth: Auth,
      private EmailsInvites: EmailsInvites,
      private Utilities: Utilities
    ) {}

    $onInit() {
      this.styles = styles;
      this.firstName = null;
      this.lastName = null;
      this.email = null;
      this.password = null;
      this.error = null;
      this.processing = false;
    }

    $postLink() {
      this.$timeout(() => this.focusInput("firstName"));
    }

    focusInput(inputName: "firstName" | "lastName" | "email" | "password") {
      const elementToFocus = <HTMLInputElement>(
        this.$element[0].querySelector(`.${inputName}`)
      );
      elementToFocus.focus();
    }

    resetError() {
      this.error = null;
    }

    signup(
      firstName: string,
      lastName: string,
      email: string,
      password: string
    ) {
      firstName = _.trim(firstName);
      lastName = _.trim(lastName);
      email = _.trim(email);

      this.resetError();

      if (!firstName) {
        this.focusInput("firstName");
        this.error = this.Utilities.getError("no-firstname");
      } else if (!lastName) {
        this.focusInput("lastName");
        this.error = this.Utilities.getError("no-lastname");
      } else if (!email) {
        this.focusInput("email");
        this.error = this.Utilities.getError("no-email");
      } else if (!password) {
        this.focusInput("password");
        this.error = this.Utilities.getError("no-password");
      } else {
        this.processing = true;

        this.Utilities.checkInvitedEmails(this.EmailsInvites, email)
          .then(() => {
            return this.Auth.registerUser(
              email,
              password,
              "business",
              firstName,
              lastName
            );
          })
          .then(() => {
            this.$state.go("loggedin.projects");
          })
          .catch((error) => {
            this.processing = false;
            this.error = this.Utilities.getError(error);

            if (error.code === "email-already-in-use") {
              this.error.message =
                "An account with this email address already exists. If you are the owner of this account and want to upgrade, please log in and go to Settings > Tokk for Business";
            }

            if (_.includes(this.error.code, "firstname")) {
              this.focusInput("firstName");
            } else if (_.includes(this.error.code, "lastname")) {
              this.focusInput("lastName");
            } else if (_.includes(this.error.code, "email")) {
              this.focusInput("email");
            } else if (_.includes(this.error.code, "password")) {
              this.focusInput("password");
            }
          });
      }
    }
  }

  angular.module("app").directive("tokkSignupPage", tokkSignupPage);
}
