///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';

    function tokkContenteditable(keys) {

        function link (scope, element, attrs) {
            let maxCharLength = parseInt(attrs.maxLength, 10);
            maxCharLength = (maxCharLength > 0 ? maxCharLength : 256);

            const inputKeydownListener: EventListener = (event: KeyboardEvent) => {
                const charLength = _.trim(element[0].textContent).length;

                // cancel default keypress behavior when max length is reached or when enter is pressed
                if ((charLength >= maxCharLength && event.which !== keys.backspace && event.which !== keys.esc) || event.which === keys.enter) {
                    event.preventDefault();
                }
            };

            const inputPasteListener: EventListener = (event: Event) => {
                const text = _.trim(element[0].textContent).substring(0, maxCharLength);
                scope.setInput({'text': text});
                scope.$evalAsync();
            };

            element[0].addEventListener('keydown', inputKeydownListener, false);
            element[0].addEventListener('paste', inputPasteListener, false);

            scope.$on('$destroy', () => {
                element[0].removeEventListener('keydown', inputKeydownListener, false);
                element[0].removeEventListener('paste', inputPasteListener, false);
            });
        }


        return {
            scope: {
                setInput: '&'
            },
            restrict: 'A',
            link: link
        };
    }

    angular.module('app').directive('tokkContenteditable', tokkContenteditable);
}