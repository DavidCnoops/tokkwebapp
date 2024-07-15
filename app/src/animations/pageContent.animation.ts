///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';

    angular.module('app').animation('.animationPageContent', (
        $animateCss: ng.animate.IAnimateCssService, 
        $timeout: ng.ITimeoutService
    ) => {
        return {
            enter(element, doneFn) {
                element[0].style.opacity = `0`;
                element[0].style.transform = `translateY(15px)`;

                const animator = $animateCss(element, {
                    event: 'enter',
                    structural: true,
                    from: {
                        opacity: 0,
                        transform: `translateY(15px)`
                    },
                    to: {
                        opacity: 1,
                        transform: `translateY(0)`
                    },
                    transitionStyle: `all 400ms cubic-bezier(0.165, 0.84, 0.44, 1) 200ms`
                });

                const animation = () => {
                    animator.start().done(() => {
                        element[0].style.removeProperty('opacity');
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