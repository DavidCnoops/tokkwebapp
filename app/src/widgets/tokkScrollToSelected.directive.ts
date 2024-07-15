///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';

    angular.module('app').directive('tokkScrollToSelected', () => {
        return (scope, element, attrs) => {
            const selectedItem = <HTMLDivElement>element[0].querySelector('.selected');

            if (selectedItem !== null) {
                element[0].scrollTop = selectedItem.offsetTop - selectedItem.clientHeight;
            }

            scope.$evalAsync();
        };
    });

}