///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';

    angular.module('app').directive('tokkEscape', (keys) => {
        return (scope, element, attrs) => {
            const handler = (event) => {
                if (event.which === keys.esc) {
                    scope.$apply(() => scope.$eval(attrs.tokkEscape, {'$event': event}));
                    event.preventDefault();
                }
            };

            element[0].addEventListener('keydown', handler, true);

            scope.$on('$destroy', () => element[0].removeEventListener('keydown', handler, true));
        };
    });
}