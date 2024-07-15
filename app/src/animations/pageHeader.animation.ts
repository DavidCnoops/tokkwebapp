///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';

    angular.module('app').animation('.animationPageHeader', (
        $animateCss: ng.animate.IAnimateCssService, 
        $timeout: ng.ITimeoutService
    ) => {
        return {
            enter(element, doneFn) {
                element[0].style.transform = `translateY(15px)`;

                const animator = $animateCss(element, {
                    event: 'enter',
                    structural: true,
                    from: {
                        transform: `translateY(15px)`
                    },
                    to: {
                        transform: `translateY(0)`
                    },
                    transitionStyle: `transform 600ms cubic-bezier(0.165, 0.84, 0.44, 1)`
                });

                const animation = () => {
                    animator.start().done(() => {
                        element[0].style.removeProperty('transform');
                        doneFn();
                    });
                };

                if (bowser.safari) {
                    $timeout(() => {
                        animation();
                    }, 50);
                }
                else {
                    animation();
                }

                return (isCancelled) => {
                    if (_.isUndefined(isCancelled)) {
                        animator.end();
                    }
                };
            }
        };
    });
}