///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';

    angular.module('app').animation('.animationAccordion', (
        $animateCss: ng.animate.IAnimateCssService,
        $timeout: ng.ITimeoutService
    ) => {
        return {
            enter(element, doneFn) {   
                const height = element[0].offsetHeight + 'px';

                element[0].style.height = '0px';
                element[0].style.overflow = 'hidden';

                const animator = $animateCss(element, {
                    event: 'enter',
                    structural: true,
                    from: {
                        height: 0
                    },
                    to: {
                        height: height
                    },
                    transitionStyle: `height 250ms cubic-bezier(0.19, 1, 0.22, 1)`
                });

                const animation = () => {
                    animator.start().done(() => {
                        element[0].style.removeProperty('height');
                        element[0].style.removeProperty('overflow');
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
            },

            leave(element, doneFn) {
                const height = element[0].offsetHeight + 'px';

                element[0].style.height = height;
                element[0].style.overflow = 'hidden';

                const animator = $animateCss(element, {
                    event: 'leave',
                    structural: true,
                    from: {
                        height: height
                    },
                    to: {
                        height: 0
                    },
                    transitionStyle: `height 250ms cubic-bezier(0.19, 1, 0.22, 1)`
                });

                const animation = () => {
                    animator.start().done(() => {
                        element[0].style.removeProperty('height');
                        element[0].style.removeProperty('overflow');
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