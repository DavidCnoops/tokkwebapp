///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';

    angular.module('app').animation('.animationError', ($animateCss: ng.animate.IAnimateCssService) => {

        const enterAnimation = (element: JQuery, doneFn: Function): any => {
            const height = element[0].offsetHeight + 'px';

            element[0].style.height = '0px';
            element[0].style.opacity = '0';
            element[0].style.transform = 'scale(0.8)';

            const animator = $animateCss(element, {
                event: 'enter',
                structural: true,
                from: {
                    height: 0,
                    opacity: 0,
                    transform: 'scale(0.8)'
                },
                to: {
                    height: height,
                    opacity: 1,
                    transform: 'scale(1)'
                },
                transitionStyle: `
                    height 100ms cubic-bezier(0.165, 0.84, 0.44, 1),
                    opacity 200ms cubic-bezier(0.165, 0.84, 0.44, 1) 50ms,
                    transform 200ms cubic-bezier(0.165, 0.84, 0.44, 1) 50ms
                `
            });

            if (!element[0].classList.contains('noEntryAddAnimation')) {
                animator.start().done(() => {
                    element[0].style.removeProperty('height');
                    element[0].style.removeProperty('opacity');
                    element[0].style.removeProperty('transform');
                    doneFn();
                });
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

            element[0].style.height = height;
            element[0].style.opacity = '1';

            const animator = $animateCss(element, {
                event: 'leave',
                structural: true,
                from: {
                    height: height,
                    opacity: 1
                },
                to: {
                    height: 0,
                    opacity: 0
                },
                transitionStyle: `all 200ms cubic-bezier(0.19, 1, 0.22, 1)`
            });

            animator.start().done(() => {
                element[0].style.removeProperty('height');
                element[0].style.removeProperty('opacity');
                doneFn();
            });

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