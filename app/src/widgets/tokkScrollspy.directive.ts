///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';

    interface IScope extends ng.IScope {
        scrolling: Function;
    }

    function tokkScrollspy() {

        function link(scope: IScope, element: ng.IAugmentedJQuery, attrs: ng.IAttributes) {
            const scrolling = (event) => {
                scope.scrolling({'position': event.target.scrollTop});
            };

            element[0].addEventListener('scroll', scrolling, false);

            scope.$on('$destroy', () => {
                element[0].removeEventListener('scroll', scrolling, false);
            });
        }

        return {
            scope: {
                scrolling: '&'
            },
            restrict: 'A',
            link: link
        };
    }

    angular.module('app').directive('tokkScrollspy', tokkScrollspy);
}