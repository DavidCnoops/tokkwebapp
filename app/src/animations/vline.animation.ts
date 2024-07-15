///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';

    angular.module('app').animation('.animationVline', ($animateCss: ng.animate.IAnimateCssService) => {
        return {
            leave(element, doneFn) {
                const height = element[0].offsetHeight + 'px';

                element[0].style.height = height;

                const animator = $animateCss(element, {
                    event: 'leave',
                    structural: true,
                    from: {
                        height: height
                    },
                    to: {
                        height: 0
                    },
                    transitionStyle: `height 250ms cubic-bezier(0.19, 1, 0.22, 1) 4ms`
                });

                animator.start().done(() => {
                    element[0].style.removeProperty('height');
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