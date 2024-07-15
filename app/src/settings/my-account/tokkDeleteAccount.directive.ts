///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  const styles = require("tokkDeleteAccount.css");

  function tokkDeleteAccount() {
    return {
      scope: {},
      bindToController: {},
      restrict: "E",
      templateUrl: "tokkDeleteAccount.template.html",
      controller: DeleteAccountController,
      controllerAs: "vm",
    };
  }

  class DeleteAccountController {
    public styles: any;
    public loaded: boolean;
    public error: IErrorObject;
    public processing: boolean;
    public user: IUser;
    public invitations: Array<IGroupInvitation>;
    public subscription: IGroupSubscription;
    public billingInformation: IFirebaseBillingInformation;
    public password: string;
    public subscriptions: Array<Rx.Subscription>;

    constructor(
      private $scope: ng.IScope,
      private $q: ng.IQService,
      private $http: ng.IHttpService,
      private $state: ng.ui.IStateService,
      private serverUrl: string,
      private Auth: Auth,
      private Users: Users,
      private GroupSubscription: GroupSubscription,
      private GroupInvitations: GroupInvitations,
      private BillingInformation: BillingInformation,
      private Utilities: Utilities,
      private Invitations: Invitations
    ) {}

    $onInit() {
      this.styles = styles;
      this.loaded = false;
      this.error = null;
      this.processing = false;
      this.user = null;
      this.subscription = null;
      this.billingInformation = null;
      this.password = null;

      this.subscriptions = [
        Rx.Observable.combineLatest(
          this.GroupSubscription.observe(this.Auth.userGroup),

          this.GroupInvitations.observe(),

          this.BillingInformation.observe(),

          this.Users.observe()
            .filter((items) => items !== null)
            .switchMap((users) => Rx.Observable.from(users))
            .filter((user) => user.$id === this.Auth.userUID)
            .distinctUntilChanged(),

          (s1, s2, s3, s4) => {
            return {
              subscription: s1,
              invitations: s2,
              billing_information: s3,
              user: s4,
            };
          }
        ).subscribe((data) => {
          this.loaded = true;
          this.user = data.user;
          this.invitations = data.invitations;
          this.subscription = data.subscription;
          this.billingInformation = data.billing_information;
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

    deleteAccount(password: string) {
      if (!this.processing) {
        if (!password) {
          this.error = this.Utilities.getError("no-current-password");
        } else {
          this.processing = true;
          const userUID = _.cloneDeep(this.Auth.userUID);
          const groupID = _.cloneDeep(this.Auth.userGroup);
          const email = _.cloneDeep(this.user.email);
          const invitations = _.cloneDeep(this.invitations);
          const credential = firebase.default.auth.EmailAuthProvider.credential(email, password);

          firebase.default
            .auth()
            .currentUser.reauthenticateAndRetrieveDataWithCredential(credential)
            .then(() => {
              return firebase.default.auth().currentUser.getIdToken(true);
            })
            .then((firebaseIDToken) => {
              if (invitations && invitations.length > 0) {
                return this.Invitations.removeMultiple(groupID, invitations).then(() => {
                  return firebaseIDToken;
                });
              } else {
                return this.$q.resolve(firebaseIDToken);
              }
            })
            .then((firebaseIDToken) => {
              this.$state.go("login");

              return this.$http({
                url: `${this.serverUrl}/group/remove`,
                method: "POST",
                headers: { "Content-Type": "application/json" },
                data: {
                  user_id: userUID,
                  group_id: groupID,
                  firebase_id_token: firebaseIDToken,
                },
              });
            })
            .then(() => {
              this.Auth.unAuth();
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

  angular.module("app").directive("tokkDeleteAccount", tokkDeleteAccount);
}
