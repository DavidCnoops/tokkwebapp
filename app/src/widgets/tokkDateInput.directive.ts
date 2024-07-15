///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';

    const styles = require('tokkDateInput.css');

    function tokkDateInput() {
        return {
            scope: {},
            bindToController: {
                isoDate: '<',
                isoMinDate: '<',
                isoMaxDate: '<',
                onDateSelected: '&'
            },
            restrict: 'E',
            templateUrl: 'tokkDateInput.template.html',
            controller: DateInputController,
            controllerAs: 'vm'
        };
    }

    class DateInputController {
        public styles: any;
        public isoDate: string;
        public isoMinDate: string;
        public isoMaxDate: string;
        public onDateSelected: Function;
        public picker: Pikaday;
        public format: string;

        constructor(
            private $scope: ng.IScope,
            private $element: ng.IRootElementService,
            private $timeout: ng.ITimeoutService
        ) {}

        $onInit() {
            let listener1 = null;
            let listener2 = null;

            this.styles = styles;
            this.picker = null;
            this.format = 'dddd, MMMM D, YYYY';

            this.$timeout(() => {
                const that = this;

                this.picker = new Pikaday({
                    field: <HTMLInputElement>that.$element[0].querySelector(`.${that.styles.input}`),
                    format: that.format,
                    theme: 'tokkDateInput',
                    onSelect: () => {
                        const isoDate = moment(that.picker.toString(), that.format, true).format('YYYY-MM-DD');

                        if (isoDate !== that.isoDate) {
                            that.onDateSelected({'date': isoDate});
                        }
                    },
                    onOpen: () => {
                        that.picker.setDate(moment(that.isoDate, 'YYYY-MM-DD', true).toDate());
                        that.picker.gotoDate(moment(that.isoDate, 'YYYY-MM-DD', true).toDate());
                    }
                });

                this.picker.setDate(moment(this.isoDate, 'YYYY-MM-DD', true).toDate());
                this.picker.gotoDate(moment(this.isoDate, 'YYYY-MM-DD', true).toDate());
                this.picker.setMinDate(moment(this.isoMinDate, 'YYYY-MM-DD', true).toDate());
                this.picker.setMaxDate(moment(this.isoMaxDate, 'YYYY-MM-DD', true).toDate());

                listener1 = this.$scope.$watch(() => this.isoMinDate, (newValue, oldValue) => {
                    if (newValue !== oldValue && newValue !== null) {
                        this.picker.setMinDate(moment(newValue, 'YYYY-MM-DD', true).toDate());
                    }
                }, true);

                listener2 = this.$scope.$watch(() => this.isoMaxDate, (newValue, oldValue) => {
                    if (newValue !== oldValue && newValue !== null) {
                        this.picker.setMaxDate(moment(newValue, 'YYYY-MM-DD', true).toDate());
                    }
                }, true);
            });

            this.$scope.$on('$destroy', () => {
                if (listener1 !== null) { listener1(); }
                if (listener2 !== null) { listener2(); }
                if (this.picker !== null) { this.picker.destroy(); }
            });
        }
    }

    angular.module('app').directive('tokkDateInput', tokkDateInput);
}