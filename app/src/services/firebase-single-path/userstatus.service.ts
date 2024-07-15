///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  export class UserStatus {
    constructor(private Auth: Auth, private FirebaseUtils: FirebaseUtils) {}

    observe() {
      const ref = firebase.default.database().ref(`group/${this.Auth.userGroup}/users/${this.Auth.userUID}/status`);
      return this.FirebaseUtils.objectStream<"active" | "archived">("userstatus", ref).observable;
    }
  }

  angular.module("app").service("UserStatus", UserStatus);
}
