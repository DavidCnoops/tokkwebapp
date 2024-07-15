///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';

    function tokkClickOutside() {

        function link(scope, element, attrs) {
            const handler = (event) => {
                let insideClick = false;

                for (let element = event.target; element; element = element.parentNode) {
                    if (element.classList && element.classList.contains(attrs.container)) {
                        insideClick = true;
                        break;
                    }
                }

                if (!insideClick) {
                    scope.$eval(attrs.action);
                }

                if (_.isUndefined(attrs.noevalasync)) {
                    scope.$evalAsync();
                }
            };

            document.addEventListener('click', handler, false);

            scope.$on('$destroy', () => {
                document.removeEventListener('click', handler, false);
            });
        }

        return {
            restrict: 'A',
            link: link
        };
    }

    angular.module('app').directive('tokkClickOutside', tokkClickOutside);
}