///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';

    angular.module('app').filter('highlight', () => (item, input) => {
        const phrase = (input.tagName === 'INPUT' ? input.value : _.trim(input.textContent));

        if (_.isString(phrase) && !_.isEmpty(phrase)) {
            return item.replace(new RegExp('(' + phrase + ')', 'gi'), '<span ng-non-bindable class="highlighted">$1</span>');
        }

        return item;
    });
}