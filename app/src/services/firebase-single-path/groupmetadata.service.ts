///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  export interface IGroupMetaData {
    $id?: string;
    active_user_count?: number;
    archived_user_count?: number;
    invitation_count?: number;
  }

  export class GroupMetaData {
    constructor(private Auth: Auth, private FirebaseUtils: FirebaseUtils) {}

    observe() {
      const ref = firebase.default.database().ref(`group/${this.Auth.userGroup}/group_meta_data/`);
      return this.FirebaseUtils.objectStream<IGroupMetaData>("groupmetadata", ref).observable;
    }
  }

  angular.module("app").service("GroupMetaData", GroupMetaData);
}
