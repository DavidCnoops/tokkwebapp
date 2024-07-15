///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {

    'use strict';

    const styles = require('tokkCalendar.css');

    function tokkCalendar() {
        return {
            scope: {},
            bindToController: {
                opened: '<',
                ondatechange: '&',
                close: '&'
            },
            restrict: 'E',
            templateUrl: 'tokkCalendar.template.html',
            controller: CalendarController,
            controllerAs: 'vm'
        };
    }

    class CalendarController {
        public styles: any;
        public opened: boolean;
        public picker: Pikaday;
        public ondatechange: Function;
        public isoDate: string;
        public isToday: boolean;
        public subscriptions: Array<Rx.Subscription>;

        constructor(
            private $scope: ng.IScope,
            private $timeout: ng.ITimeoutService,
            private $element: ng.IRootElementService,
            private Day: Day,
            private Today: Today
        ) {}

        $onInit() {
            this.styles = styles;
            this.picker = null;
            this.isoDate = null;
            this.isToday = true;
            this.subscriptions = [];

            this.$timeout(() => {
                const that = this;

                this.picker = new Pikaday({
                    onSelect() {
                        const pickerDate = that.picker.toString();

                        if (pickerDate !== that.isoDate) {
                            that.ondatechange({'date': pickerDate});
                        }
                    }
                });

                this.subscriptions = [
                    this.Day.replay
                        .filter(isoDate => _.isString(isoDate) && !_.isEmpty(isoDate))
                        .distinctUntilChanged()  
                        .subscribe((isoDate) => {
                            const pickerDate = this.picker.toString();

                            this.isoDate = isoDate;
                            this.isToday = (isoDate === this.Today.isoDate ? true : false);

                            if (pickerDate !== isoDate) {
                                this.picker.setDate(isoDate);
                                this.picker.gotoDate(new Date(isoDate));
                            }

                            this.$scope.$evalAsync();
                        })
                ];

                const container = <HTMLDivElement>this.$element[0].querySelector(`.${this.styles.pikadayContainer}`);
                container.appendChild(this.picker.el);
            });

            this.$scope.$on('$destroy', () => {
                this.destroyPicker();
                this.subscriptions.forEach(subscription => subscription.unsubscribe());
            });
        }


        destroyPicker() {
            if (this.picker) {
                this.picker.destroy();
                this.picker = null;
            }
        }


        goToToday() {
            this.ondatechange({'date': this.Today.isoDate});
        }
    }

    angular.module('app').directive('tokkCalendar', tokkCalendar);
}