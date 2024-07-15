///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';

    angular.module('app').animation('.animationDayPrevious', ($animateCss: ng.animate.IAnimateCssService) => {
        let leaveAnimators = [];

        return {
            enter(element, doneFn) {
                const distance = document.querySelector('.tokkDayEntriesContainerPaddingLeft').clientWidth + element[0].clientWidth;

                element[0].style.transform = `translateX(-${distance}px)`;

                const animator = $animateCss(element, {
                    event: 'enter',
                    structural: true,
                    from: {
                        transform: `translateX(-${distance}px)`
                    },
                    to: {
                        transform: `translateX(0)`
                    },
                    transitionStyle: `transform 450ms cubic-bezier(0.19, 1, 0.22, 1)`
                });

                animator.start().done(() => {
                    element[0].style.removeProperty('transform');
                    leaveAnimators = [];
                    doneFn();
                });

                return (isCancelled) => {
                    if (_.isUndefined(isCancelled)) {
                        leaveAnimators.forEach(animator => animator.end());
                        animator.end();
                    }
                };
            },

            leave(element, doneFn) {
                const distance = document.querySelector('.tokkDayEntriesContainerPaddingLeft').clientWidth + element[0].clientWidth;

                element[0].style.transform = `translateX(0)`;

                const animator = $animateCss(element, {
                    event: 'leave',
                    structural: true,
                    from: {
                        transform: `translateX(0)`
                    },
                    to: {
                        transform: `translateX(${distance}px)`
                    },
                    transitionStyle: `transform 450ms cubic-bezier(0.19, 1, 0.22, 1)`
                });

                leaveAnimators.push(animator);

                animator.start().done(() => {
                    element[0].style.removeProperty('transform');
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