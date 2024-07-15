///<reference path='../../typings/dependencies.d.ts' />
///<reference path='../../typings/app.d.ts' />

module app {
  "use strict";

  const styles = require("tokkApp.css");

  function tokkApp() {
    return {
      scope: {},
      restrict: "E",
      template: `<div ui-view></div>`,
      controller: AppController,
      controllerAs: "vm",
    };
  }

  class AppController {
    public styles: any;

    $onInit() {
      this.styles = styles;
    }
  }

  angular.module("app").directive("tokkApp", tokkApp);
}
