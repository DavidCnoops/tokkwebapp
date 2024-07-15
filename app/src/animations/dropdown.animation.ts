///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';

    angular.module('app').animation('.animationDropdown', ($animateCss: ng.animate.IAnimateCssService) => {
        return {
            enter(element, doneFn) {
                const height = element[0].offsetHeight + 'px';

                element[0].style.height = '0';
                element[0].style.opacity = '0';
                element[0].style.overflow = 'hidden';

                const animator = $animateCss(element, {
                    event: 'enter',
                    structural: true,
                    from: {
                        height: 0,
                        opacity: 0
                    },
                    to: {
                        height: height,
                        opacity: 1
                    },
                    transitionStyle: `all 150ms cubic-bezier(0.19, 1, 0.22, 1)`
                });

                animator.start().done(() => {
                    element[0].style.removeProperty('height');
                    element[0].style.removeProperty('opacity');
                    element[0].style.removeProperty('overflow');
                    doneFn();
                });

                return (isCancelled) => {
                    if (_.isUndefined(isCancelled)) {
                        animator.end();
                    }
                };
            },

            leave(element, doneFn) {
                element[0].style.opacity = '1';

                const animator = $animateCss(element, {
                    event: 'leave',
                    structural: true,
                    from: {
                        opacity: 1
                    },
                    to: {
                        opacity: 0
                    },
                    transitionStyle: `opacity 150ms cubic-bezier(0.19, 1, 0.22, 1)`
                });

                animator.start().done(() => {
                    element[0].style.removeProperty('opacity');
                    doneFn();
                });

                return (isCancelled) => {
                    if (_.isUndefined(isCancelled)) {
                        animator.end();
                    }
                };
            }
        };
    });
}