///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';

    angular.module('app').directive('tokkDocumentEscape', (keys) => {
        return (scope, element, attrs) => {
            const handler = (event) => {
                if (event.which === keys.esc) {
                    scope.$apply(() => scope.$eval(attrs.tokkDocumentEscape, {'$event': event}));
                }
            };

            document.addEventListener('keydown', handler, false);

            scope.$on('$destroy', () => document.removeEventListener('keydown', handler, false));
        };
    });
}