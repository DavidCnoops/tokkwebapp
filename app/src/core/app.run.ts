///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {
  "use strict";

  angular.module("app").run(stateChange);

  function stateChange(
    $log: ng.ILogService,
    $rootScope: ng.IRootScopeService,
    $state: ng.ui.IStateService
  ) {
    $rootScope.$on(
      "$stateChangeStart",
      (event, toState, toParams, fromState, fromParams, error) => {
        // redirect to login page when /invitation/ doesn't have token parameter
        if (
          toState.name === "invitation-redeemer" &&
          _.isEmpty(toParams.token)
        ) {
          event.preventDefault();
          $state.go("login");
        }
      }
    );

    $rootScope.$on(
      "$stateChangeError",
      (event, toState, toParams, fromState, fromParams, error) => {
        $log.error("stateChangeError", error);
        $state.go("login");
      }
    );

    $rootScope.$on(
      "$stateNotFound",
      (event, unfoundState, fromState, fromParams) => {
        $log.error("stateNotFound", unfoundState);
        $state.go("login");
      }
    );
  }
}
