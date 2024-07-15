///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  export class Prefetch {
    constructor(private FirebaseUtils: FirebaseUtils) {}

    observe(refString: string) {
      const ref = firebase.default.database().ref(refString);
      return this.FirebaseUtils.objectStream("prefetch", ref).observable;
    }
  }

  angular.module("app").service("Prefetch", Prefetch);
}
