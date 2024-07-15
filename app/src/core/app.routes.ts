///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {
  "use strict";

  angular.module("app").config(routerConfig);

  function routerConfig(
    $locationProvider: ng.ILocationProvider,
    $stateProvider: ng.ui.IStateProvider,
    $urlRouterProvider: ng.ui.IUrlRouterProvider
  ) {
    $locationProvider.html5Mode({
      enabled: true,
      requireBase: true,
    });

    $stateProvider
      .state("login", {
        url: "/login",
        template: "<tokk-login-page></tokk-login-page>",
      })
      .state("signup", {
        url: "/signup",
        template: "<tokk-signup-page></tokk-signup-page>",
      })
      .state("passwordreset", {
        url: "/passwordreset",
        template: "<tokk-password-reset-page></tokk-password-reset-page>",
      })
      .state("loggedin", {
        abstract: true,
        template: "<tokk-loggedin></tokk-loggedin>",
      })
      .state("loggedin.projects", {
        url: "/",
        template: "<tokk-projects-page></tokk-projects-page>",
      })
      .state("loggedin.reports", {
        url: "/reports",
        template: "<tokk-reports-page></tokk-reports-page>",
      })
      .state("loggedin.settings", {
        url: "/settings",
        abstract: true,
        template: "<tokk-settings></tokk-settings>",
      })
      .state("loggedin.settings.account", {
        url: "/account",
        template: "<tokk-account-page></tokk-account-page>",
      })
      .state("loggedin.settings.users", {
        url: "/users",
        template: "<tokk-users-page></tokk-users-page>",
      })
      .state("loggedin.settings.invitations", {
        url: "/invitations",
        template: "<tokk-invitations-page></tokk-invitations-page>",
      })
      .state("loggedin.settings.subscription", {
        url: "/subscription",
        template: "<tokk-subscription-page></tokk-subscription-page>",
      })
      .state("subscribe", {
        url: "/subscribe",
        template: '<tokk-subscribe-page code="code"></tokk-subscribe-page>',
        params: { code: null },
        controller: ($scope, $stateParams) => {
          $scope.code = $stateParams.code;
        },
      })
      .state("invitation-redeemer", {
        url: "/invitation/:token",
        template:
          '<tokk-invitation-redeemer-page token="token"></tokk-invitation-redeemer-page>',
        controller: ($scope, $stateParams) => {
          $scope.token = $stateParams.token;
        },
      });

    $urlRouterProvider.otherwise("/");
  }
}
