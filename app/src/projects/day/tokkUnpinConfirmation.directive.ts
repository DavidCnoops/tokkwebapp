///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {

    'use strict';

    const styles = require('tokkUnpinConfirmation.css');

    function tokkUnpinConfirmation() {
        return {
            scope: {},
            bindToController: {
                opened: '<',
                entryID: '<entryid',
                close: '&'
            },
            restrict: 'E',
            templateUrl: 'tokkUnpinConfirmation.template.html',
            controller: UnpinConfirmationController,
            controllerAs: 'vm'
        };
    }

    class UnpinConfirmationController {
        public styles: any;
        public opened: boolean;
        public entryID: string;
        public close: Function;
        public taskName: string;
        public humanDate: string;
        public humanTime: string;
        public entry: IEntry;
        public subscriptions: Array<Rx.Subscription>;

        constructor(
            private $scope: ng.IScope,
            private Today: Today,
            private Day: Day,
            private Utilities: Utilities,
            private Entries: Entries
        ) {}

        $onInit() {
            this.styles = styles;
            this.taskName = null;
            this.humanDate = null;
            this.humanTime = null;
            this.entry = null;
            this.subscriptions = [];

            const listener = this.$scope.$watch(() => this.opened, (newValue, oldValue) => {
                this.reset();
                _(this.subscriptions).forEach(subscription => subscription.unsubscribe());

                if (oldValue !== true && newValue === true) {
                    this.subscriptions = [
                        Rx.Observable.combineLatest(
                            this.Today.replay
                                .filter(isoDate => _.isString(isoDate) && !_.isEmpty(isoDate))
                                .distinctUntilChanged(),

                            this.Day.replay
                                .filter(isoDate => _.isString(isoDate) && !_.isEmpty(isoDate))
                                .distinctUntilChanged(),               

                            (s1, s2) => {
                                return {
                                    'today_iso_date': s1,
                                    'iso_date': s2
                                };
                            }
                        ).switchMap((data) => {
                            return this.Day.observe(data.iso_date)
                                .filter(entries => _.isArray(entries) && !_.isEmpty(entries))
                                .switchMap(entries => Rx.Observable.from(entries))
                                .filter(entry => entry.$id === this.entryID)
                                .distinctUntilChanged()
                                .map((entry) => {
                                    return {
                                        'today_iso_date': data.today_iso_date,
                                        'iso_date': data.iso_date,
                                        'entry': entry
                                    };
                                });
                        })
                        .subscribe((data) => {
                            this.taskName = data.entry.task_name;
                            this.humanDate = (data.iso_date === data.today_iso_date ? 'today' : moment(data.iso_date, 'YYYY-MM-DD', true).format('MMMM D'));
                            this.humanTime = (data.entry ? this.Utilities.humanizeSeconds(data.entry.seconds) : null);
                            this.entry = data.entry;

                            this.$scope.$evalAsync();
                        })
                    ];
                }
            }, true);

            this.$scope.$on('$destroy', () => {
                listener();
                _(this.subscriptions).forEach(subscription => subscription.unsubscribe());
            });
        }


        reset() {
            this.taskName = null;
            this.humanDate = null;
            this.humanTime = null;
            this.entry = null;
        }


        unpin(entry: IDayEntry) {
            this.Entries.remove(entry);
            this.close();
        }
    }

    angular.module('app').directive('tokkUnpinConfirmation', tokkUnpinConfirmation);
}