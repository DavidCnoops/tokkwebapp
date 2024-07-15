///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';

    angular.module('app').animation('.animationAccordion2', ($animateCss: ng.animate.IAnimateCssService) => {
        return {
            addClass(element, className, doneFn) {
                if (className === 'expanded') {
                    const filterHeaderTitle = element[0].querySelector('.tokkReportFiltersFilterTitle');
                    const filterHeaderValue = element[0].querySelector('.tokkReportFiltersFilterValue');
                    const filterContent = element[0].querySelector('.tokkReportFiltersFilterContent');

                    const oldHeight = filterHeaderTitle.clientHeight + filterHeaderValue.clientHeight + 2 + 'px';
                    const newHeight = filterHeaderTitle.clientHeight + filterContent.clientHeight + 2 + 'px';

                    element[0].style.height = oldHeight;

                    const animator = $animateCss(element, {
                        from: {
                            height: oldHeight
                        },
                        to: {
                            height: newHeight
                        },
                        transitionStyle: `height 250ms cubic-bezier(0.165, 0.84, 0.44, 1)`
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
                else {
                    doneFn();
                    return;
                }
            },

            removeClass(element, className, doneFn) {
                if (className === 'expanded') {
                    const filterHeaderTitle = element[0].querySelector('.tokkReportFiltersFilterTitle');
                    const filterHeaderValue = element[0].querySelector('.tokkReportFiltersFilterValue');
                    const filterContent = element[0].querySelector('.tokkReportFiltersFilterContent');

                    const oldHeight = filterHeaderTitle.clientHeight + filterContent.clientHeight + 2 + 'px';
                    const newHeight = filterHeaderTitle.clientHeight + filterHeaderValue.clientHeight + 2 + 'px';

                    element[0].style.height = oldHeight;

                    const animator = $animateCss(element, {
                        from: {
                            height: oldHeight
                        },
                        to: {
                            height: newHeight
                        },
                        transitionStyle: `height 250ms cubic-bezier(0.165, 0.84, 0.44, 1)`
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
                else {
                    doneFn();
                    return;
                }
            }
        };
    });
}