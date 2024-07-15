///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';

    angular.module('app').directive('tokkPreventParentScroll', () => {
        return (scope, element, attrs) => {
            const scrolling = (event: WheelEvent) => {
                const deltaY = (event.deltaMode === 1 ? event.deltaY * 20 : event.deltaY);
                element[0].scrollTop += deltaY;
                event.preventDefault();
            };

            element[0].addEventListener('wheel', scrolling, false);

            scope.$on('$destroy', () => {
                element[0].removeEventListener('wheel', scrolling, false);
            });
        };
    });

}