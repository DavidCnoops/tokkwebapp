///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  export class Connection {
    constructor(private FirebaseUtils: FirebaseUtils) {}

    observe() {
      const ref = firebase.default.database().ref(`.info/connected`);
      return this.FirebaseUtils.objectStream<boolean>("connection", ref).observable;
    }
  }

  angular.module("app").service("Connection", Connection);
}
