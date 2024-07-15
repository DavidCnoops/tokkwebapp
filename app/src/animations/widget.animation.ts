///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';

    angular.module('app').animation('.animationWidget', (
        $animateCss: ng.animate.IAnimateCssService,
        $timeout: ng.ITimeoutService
    ) => {
        return {
            removeClass(element, className, doneFn) {
                if (className === 'opened' && element[0].classList.contains('noEntries')) {
                    const oldHeight = element[0].offsetHeight + 'px';   
                    const newHeight = Math.round(document.body.clientHeight * (35 / 100) - 100) + 'px';    

                    const animator = $animateCss(element, {
                        from: {
                            height: oldHeight
                        },
                        to: {
                            height: newHeight
                        },
                        transitionStyle: `height 350ms cubic-bezier(0.165, 0.84, 0.44, 1)`
                    });

                    const animation = () => {
                        animator.start().done(() => {
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
                }
                else {
                    doneFn();
                    return;
                }
            }
        };
    });
}