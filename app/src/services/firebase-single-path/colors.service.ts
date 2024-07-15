///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  export interface IColors {
    grey: string;
    blue: string;
    cyan: string;
    green: string;
    purple: string;
    violet: string;
    pink: string;
    red: string;
    orange: string;
    yellow: string;
  }

  export class Colors {
    public list: IColors;

    constructor() {
      this.list = {
        grey: "#546E7A",
        blue: "#1862ab",
        cyan: "#0c8599",
        green: "#2b8a3e",
        purple: "#7B1FA2",
        violet: "#5f3dc4",
        pink: "#d6336c",
        red: "#c92a2a",
        orange: "#e8590c",
        yellow: "#f08c00",
      };
    }
  }

  angular.module("app").service("Colors", Colors);
}
