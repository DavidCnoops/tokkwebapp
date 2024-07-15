///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  export class Auth {
    public userUID: string;
    public userGroup: string;
    public currentUser: firebase.default.User;
    public authListener: any;

    constructor(
      private $q: ng.IQService,
      private $log: ng.ILogService,
      private $state: ng.ui.IStateService,
      private UsersGroups: UsersGroups,
      private EmailsUsers: EmailsUsers,
      private Usermanagement: Usermanagement,
      private GroupSubscription: GroupSubscription,
      private Utilities: Utilities
    ) {
      this.userUID = null;
      this.userGroup = null;
      this.currentUser = null;
      this.authListener = null;
    }

    private authWithPassword(email: string, password: string) {
      return new this.$q<firebase.default.auth.UserCredential>((resolve, reject) => {
        firebase.default
          .auth()
          .signInWithEmailAndPassword(email, password)
          .then((userCredentials) => {
            resolve(userCredentials);
          })
          .catch((error) => {
            this.$log.error("Error for authWithPassword() of service Auth", error);
            reject(error);
          });
      });
    }

    registerUser(
      email: string,
      password: string,
      subscriptionType: "free" | "business",
      firstName: string | boolean = false,
      lastName: string | boolean = false
    ) {
      let userUID: string = null;
      const groupID: string = this.Utilities.generateFirebaseUUID();

      return this.createFirebaseUser(email, password)
        .then(() => {
          return this.authWithPassword(email, password);
        })
        .then((userCredentials) => {
          userUID = userCredentials.user.uid;
          return this.Usermanagement.createGroupAndUser(groupID, userUID, email, subscriptionType, firstName, lastName);
        })
        .then(() => {
          this.EmailsUsers.add(email, userUID);
          return this.login(email, password);
        })
        .then(() => {
          return userUID;
        })
        .catch((error) => {
          this.$log.error("Error for registerUser() of service Auth", error);
          this.unAuth();
          return this.$q.reject(error);
        });
    }

    registerInvitedUser(
      email: string,
      password: string,
      firstName: string,
      lastName: string,
      groupID: string,
      invitationID: string,
      token: string
    ) {
      let userUID: string = null;

      return this.createFirebaseUser(email, password)
        .then(() => {
          return this.authWithPassword(email, password);
        })
        .then((userCredentials) => {
          userUID = userCredentials.user.uid;
          return this.Usermanagement.addInvitedUserToExistingGroup(
            groupID,
            userUID,
            email,
            firstName,
            lastName,
            invitationID,
            token
          );
        })
        .then(() => {
          this.EmailsUsers.add(email, userUID);
          return this.login(email, password);
        })
        .then(() => {
          return userUID;
        })
        .catch((error) => {
          this.$log.error("Error for registerInvitedUser() of service Auth", error);
          this.unAuth();
          return this.$q.reject(error);
        });
    }

    private createFirebaseUser(email: string, password: string) {
      return new this.$q<void>((resolve, reject) => {
        firebase.default
          .auth()
          .createUserWithEmailAndPassword(email, password)
          .then(() => {
            resolve();
          })
          .catch((error) => {
            this.$log.error("Error for createFirebaseUser() of service Auth", error);
            reject(error);
          });
      });
    }

    login(email: string, password: string) {
      return this.authWithPassword(email, password)
        .then((userCredentials) => {
          this.setAuthListener();
          this.userUID = userCredentials.user.uid;
          return this.UsersGroups.getGroupForUserOnce(userCredentials.user.uid);
        })
        .then((groupID) => {
          this.userGroup = groupID;
          return this.GroupSubscription.getOnce(groupID);
        })
        .catch((error) => {
          this.$log.error("Error for login() of service Auth", error);

          if (!_.has(error, "invalid_subscription")) {
            this.unAuth();
          }

          return this.$q.reject(error);
        });
    }

    unAuth(redirect: boolean = false) {
      this.userUID = null;
      this.userGroup = null;
      this.currentUser = null;

      if (_.isFunction(this.authListener)) {
        this.authListener();
        this.authListener = null;
      }

      firebase.default.auth().signOut();

      if (redirect) {
        this.$state.go("login");
      }
    }

    setAuthListener() {
      if (!_.isFunction(this.authListener)) {
        this.authListener = firebase.default.auth().onAuthStateChanged((currentUser) => {
          if (currentUser) {
            this.currentUser = currentUser;
          } else {
            this.unAuth(true);
          }
        });
      }
    }

    asyncCheckAuthentication() {
      return new this.$q<{ user_uid: string; user_group: string }>((resolve, reject) => {
        const completeAuthentication = () => {
          this.setAuthListener();
          resolve({
            user_uid: this.userUID,
            user_group: this.userGroup,
          });
        };

        const cancelAuthentication = () => {
          this.unAuth(true);
          reject();
        };

        const checkUser = (currentUser: firebase.default.User) => {
          if (this.userUID !== currentUser.uid || this.userGroup === null) {
            this.userUID = currentUser.uid;

            this.UsersGroups.getGroupForUserOnce(this.userUID)
              .then((groupID) => {
                this.userGroup = groupID;
                return this.GroupSubscription.getOnce(groupID);
              })
              .then(() => {
                completeAuthentication();
              })
              .catch((error) => {
                cancelAuthentication();
              });
          } else if (this.userUID === currentUser.uid && this.userGroup !== null) {
            completeAuthentication();
          } else {
            cancelAuthentication();
          }
        };

        if (this.currentUser) {
          checkUser(this.currentUser);
        } else {
          const authListener = firebase.default.auth().onAuthStateChanged((currentUser) => {
            if (currentUser) {
              checkUser(currentUser);
            } else {
              cancelAuthentication();
            }

            authListener();
          });
        }
      });
    }
  }

  angular.module("app").service("Auth", Auth);
}
