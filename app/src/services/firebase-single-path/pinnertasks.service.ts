///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  export interface PinnerTask extends IUserProjectTask {
    selectable?: boolean;
  }

  export class PinnerTasks {
    constructor(private Auth: Auth, private FirebaseUtils: FirebaseUtils) {}

    observe(projectID: string) {
      const ref = firebase.default
        .database()
        .ref(`group/${this.Auth.userGroup}/user/${this.Auth.userUID}/user_projects/${projectID}/tasks/`);
      return this.FirebaseUtils.arrayStream<PinnerTask>("pinnertasks", ref).observable;
    }
  }

  angular.module("app").service("PinnerTasks", PinnerTasks);
}
