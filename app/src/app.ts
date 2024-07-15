((exports) => {
  "use strict";

  // bootstrap
  document.addEventListener("DOMContentLoaded", () => {
    angular.bootstrap(document, ["app"], { strictDi: true });
  });

  // define app module
  angular.module("app", ["ngAnimate", "ngSanitize", "ui.router"]);
})(window);
