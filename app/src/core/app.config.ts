///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {
  "use strict";

  angular.module("app").config(configure);

  function configure(
    $compileProvider: ng.ICompileProvider,
    $logProvider: ng.ILogProvider,
    $qProvider: ng.IQProvider,
    $provide: ng.auto.IProvideService,
    debug: boolean,
    firebaseApiKey: string,
    firebaseAuthDomain: string,
    firebaseDatabaseURL: string,
    firebaseStorageBucket: string,
    firebaseMessagingSenderId: string,
    stripeKey: string,
    websiteUrl: string
  ) {
    $qProvider.errorOnUnhandledRejections(false);
    $compileProvider.debugInfoEnabled(debug);
    $logProvider.debugEnabled(debug);

    $provide.decorator("$exceptionHandler", ($delegate) => {
      return (exception, cause) => {
        $delegate(exception, cause);
      };
    });

    $provide.decorator("$log", ($delegate) => {
      const _error = $delegate.error;

      $delegate.error = function (message, error) {
        _error.apply(this, arguments);
      };

      return $delegate;
    });

    // initialize Firebase
    firebase.default.initializeApp({
      apiKey: firebaseApiKey,
      authDomain: firebaseAuthDomain,
      databaseURL: firebaseDatabaseURL,
      storageBucket: firebaseStorageBucket,
      messagingSenderId: firebaseMessagingSenderId,
    });

    // initialize Stripe
    Stripe.setPublishableKey(stripeKey);
  }
}
