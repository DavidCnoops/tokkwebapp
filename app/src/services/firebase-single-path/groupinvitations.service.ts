///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  export interface IGroupInvitation {
    $id?: string;
    added: number;
    email: string;
    token: string;
    sender_uid: string;
  }

  export class GroupInvitations {
    constructor(private Auth: Auth, private FirebaseUtils: FirebaseUtils) {}

    observe() {
      const ref = firebase.default.database().ref(`group/${this.Auth.userGroup}/invitations/`);
      return this.FirebaseUtils.arrayStream<IGroupInvitation>("groupinvitations", ref).observable;
    }
  }

  angular.module("app").service("GroupInvitations", GroupInvitations);
}
