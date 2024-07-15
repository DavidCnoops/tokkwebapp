///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  const styles = require("tokkNameEmail.css");

  function tokkNameEmail() {
    return {
      scope: {},
      bindToController: {},
      restrict: "E",
      templateUrl: "tokkNameEmail.template.html",
      controller: NameEmailController,
      controllerAs: "vm",
    };
  }

  class NameEmailController {
    public styles: any;
    public loaded: boolean;
    public tokkSubscription: IGroupSubscription;
    public oldFirstName: string;
    public newFirstName: string;
    public oldLastName: string;
    public newLastName: string;
    public oldEmail: string;
    public newEmail: string;
    public password: string;
    public processing: boolean;
    public success: boolean;
    public successMessage: string;
    public error: IErrorObject;
    public subscriptions: Array<Rx.Subscription>;

    constructor(
      private $q: ng.IQService,
      private $scope: ng.IScope,
      private $timeout: ng.ITimeoutService,
      private Auth: Auth,
      private GroupSubscription: GroupSubscription,
      private Users: Users,
      private EmailsUsers: EmailsUsers,
      private Utilities: Utilities
    ) {}

    $onInit() {
      this.styles = styles;
      this.loaded = false;
      this.oldFirstName = null;
      this.newFirstName = null;
      this.oldLastName = null;
      this.newLastName = null;
      this.oldEmail = null;
      this.newEmail = null;
      this.password = null;
      this.success = false;
      this.successMessage = "Successfully updated name & email";
      this.error = null;
      this.processing = false;

      this.subscriptions = [
        Rx.Observable.combineLatest(
          this.GroupSubscription.observe(this.Auth.userGroup),

          this.Users.observe()
            .filter((items) => items !== null)
            .switchMap((users) => Rx.Observable.from(users))
            .filter((user) => user.$id === this.Auth.userUID),

          (s1, s2) => {
            return {
              subscription: s1,
              user: s2,
            };
          }
        ).subscribe((data) => {
          this.loaded = true;
          this.tokkSubscription = data.subscription;
          this.oldFirstName = data.user.first_name ? data.user.first_name : null;
          this.oldLastName = data.user.last_name ? data.user.last_name : null;
          this.oldEmail = data.user.email;
          this.newFirstName = _.cloneDeep(this.oldFirstName);
          this.newLastName = _.cloneDeep(this.oldLastName);
          this.newEmail = _.cloneDeep(this.oldEmail);
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

    save(
      newFirstName: string,
      newLastName: string,
      oldEmail: string,
      newEmail: string,
      password: string,
      subscriptionType
    ) {
      if (this.loaded && !this.processing) {
        newFirstName = _.trim(newFirstName);
        newLastName = _.trim(newLastName);
        newEmail = _.trim(newEmail);

        this.resetError();

        if (subscriptionType === "business" && !newFirstName) {
          this.error = this.Utilities.getError("no-firstname");
        } else if (subscriptionType === "business" && !newLastName) {
          this.error = this.Utilities.getError("no-lastname");
        } else if (!newEmail) {
          this.error = this.Utilities.getError("no-email");
        } else if (!this.Utilities.validEmail(newEmail)) {
          this.error = this.Utilities.getError("invalid-email");
        } else if (!password) {
          this.error = this.Utilities.getError("no-confirmation-password");
        } else {
          this.processing = true;

          const user = firebase.default.auth().currentUser;
          const credential = firebase.default.auth.EmailAuthProvider.credential(oldEmail, password);

          user
            .reauthenticateAndRetrieveDataWithCredential(credential)
            .then(() => {
              return this.$q.all([
                this.Users.updateFirstName(this.Auth.userGroup, this.Auth.userUID, newFirstName),
                this.Users.updateLastName(this.Auth.userGroup, this.Auth.userUID, newLastName),
                this.Users.updateEmail(this.Auth.userGroup, this.Auth.userUID, newEmail),
              ]);
            })
            .then(() => {
              return this.EmailsUsers.remove(oldEmail);
            })
            .then(() => {
              return this.EmailsUsers.add(newEmail, this.Auth.userUID);
            })
            .then(() => {
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

  angular.module("app").directive("tokkNameEmail", tokkNameEmail);
}
