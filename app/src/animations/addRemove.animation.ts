///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';

    angular.module('app').animation('.animationAddRemove', (
        $animateCss: ng.animate.IAnimateCssService,
        $timeout: ng.ITimeoutService
    ) => {
        const enterAnimation = (element: JQuery, doneFn: Function): any => {
            const height = element[0].offsetHeight + 'px';

            element[0].style.height = '0px';
            element[0].style.opacity = '0';
            element[0].style.transform = 'scale(0.85)';

            const animator = $animateCss(element, {
                from: {
                    height: 0,
                    opacity: 0,
                    transform: 'scale(0.85)'
                },
                to: {
                    height: height,
                    opacity: 1,
                    transform: 'scale(1)'
                },
                transitionStyle: `
                    height 200ms cubic-bezier(0.165, 0.84, 0.44, 1),
                    opacity 300ms cubic-bezier(0.165, 0.84, 0.44, 1) 150ms,
                    transform 300ms cubic-bezier(0.165, 0.84, 0.44, 1) 150ms
                `
            });

            const animation = () => {
                animator.start().done(() => {
                    element[0].style.removeProperty('height');
                    element[0].style.removeProperty('opacity');
                    element[0].style.removeProperty('transform');
                    doneFn();
                });
            };

            if (!element[0].classList.contains('noEntryAddAnimation')) {
                if (bowser.safari) {
                    $timeout(() => {
                        animation();
                    }, 50);
                }
                else {
                    animation();
                }
            }
            else {
                doneFn();
            }

            return (isCancelled) => {
                if (_.isUndefined(isCancelled)) {
                    animator.end();
                }
            };
        };

        const leaveAnimation = (element: JQuery, doneFn: Function): any => {
            const height = element[0].offsetHeight + 'px';

            element[0].classList.add('addRemoveAnimationLeaveStarted');

            element[0].style.height = height;
            element[0].style.opacity = '1';
            element[0].style.overflow = 'hidden';

            const animator = $animateCss(element, {
                from: {
                    height: height,
                    opacity: 1
                },
                to: {
                    height: 0,
                    opacity: 0
                },
                transitionStyle: `all 300ms cubic-bezier(0.165, 0.84, 0.44, 1)`
            });

            const animation = () => {
                animator.start().done(() => {
                    element[0].classList.remove('addRemoveAnimationLeaveStarted');
                    element[0].style.removeProperty('height');
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
        };


        return {
            enter(element, doneFn) {
                return enterAnimation(element, doneFn);
            },

            removeClass(element, className, doneFn) {
                if (className === 'ng-hide') {
                    return enterAnimation(element, doneFn);
                }
            },

            leave(element, doneFn) {
                return leaveAnimation(element, doneFn);
            },

            addClass(element, className, doneFn) {
                if (className === 'ng-hide') {
                    return leaveAnimation(element, doneFn);
                }
            }
        };
    });
}