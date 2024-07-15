///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';
    
    const styles = require('tokkDropdown.css');

    function tokkDropdown() {
        return {
            scope: {},
            bindToController: {
                dropdownname: '@',
                list: '<',
                viewname: '@',
                valuename: '@',
                footer: '@',
                footertext: '@',
                footericon: '@',
                footerclick: '&'
            },
            restrict: 'E',
            templateUrl: 'tokkDropdown.template.html',
            controller: Dropdown,
            controllerAs: 'vm'
        };
    }

    class Dropdown {
        public styles: any;
        public dropdownname: string;
        public list: Array<any>;
        public localList: Array<any>;
        public viewname: string;
        public valuename: string;
        public footer: string;
        public footertext: string;
        public footericon: string;
        public footerclick: any;
        public dropdownVisible: boolean;
        public selectedItem: any;
        public subscriptions: Array<Rx.Subscription>;

        constructor(
            private $scope: ng.IScope,
            private keys: IKeys,
            private Streams: Streams
        ) {}

        $onInit() {
            this.styles = styles;
            this.localList = this.mergeListWithLocalList([], this.list);
            this.dropdownVisible = false;

            const listener = this.$scope.$watch(() => this.dropdownVisible, (newValue, oldValue) => {
                if (oldValue === true && newValue === false) {
                    this.unhover();
                }
            }, true);

            // set the initialy selected item to the first element from the this.localList array
            this.selectedItem = _.cloneDeep(this.findItem(this.localList, this.valuename, this.localList[0]));

            const stream: IStream<string> = this.Streams.stream[this.dropdownname];

            this.subscriptions = [
                stream.replay.subscribe((dropdownValue) => {
                    const selectedItem = this.findItem(this.localList, this.valuename, dropdownValue);

                    if (selectedItem) {
                        this.localList = _(this.localList).map((listItem) => {
                            return {...listItem, 'selected': listItem[this.valuename] === selectedItem[this.valuename]};
                        }).value();

                        this.selectedItem = selectedItem;
                        this.dropdownVisible = false;
                    }

                    this.$scope.$evalAsync();
                })
            ];

            this.$scope.$on('$destroy', () => {
                listener();
                this.subscriptions.forEach(subscription => subscription.unsubscribe());
            });
        }


        $onChanges(changes) {
            const oldLocalList = _.cloneDeep(this.localList);
            this.localList = this.mergeListWithLocalList(oldLocalList, changes.list.currentValue);
        }


        mergeListWithLocalList(oldLocalList: Array<any>, list: Array<any>) {
            return _(list).map((listItem) => {
                const matchingLocalListItem = _(oldLocalList).find(localListItem => localListItem[this.valuename] === listItem[this.valuename]);

                return {
                    ...listItem, 
                    ...{
                        'selected': (matchingLocalListItem && matchingLocalListItem.selected === true),
                        'hovering': (matchingLocalListItem && matchingLocalListItem.hovering === true)
                    }
                };
            }).value();
        }


        findItem(list: any, valuePropertyName: string, value: any): any {
            // create object with both a dynamic property name and value so _.findIndex can use the output
            // reason: _.findIndex can't interpret the dynamic property name by itself and will always return an index of -1
            const object = {};
            object[valuePropertyName] = value;
            const index = _.findIndex(this.localList, object);

            if (index > -1) {
                return this.localList[index];
            }

            return false;
        }


        toggleDropdown() {
            this.dropdownVisible = !this.dropdownVisible;

            if (this.dropdownVisible && !_(this.localList).some(listItem => listItem.selected === true)) {
                this.localList[0].selected = true;
            }
        }


        select(item) {
            this.dropdownVisible = false;
            const stream: IStream<string> = this.Streams.stream[this.dropdownname];
            stream.set(item[this.valuename]);
        }


        hover(item) {
            this.unhover();

            this.localList = _(this.localList).map((listItem) => {
                return {...listItem, 'hovering': listItem[this.valuename] === item[this.valuename]};
            }).value();
        }


        unhover() {
            this.localList = _(this.localList).map((listItem) => {
                return {...listItem, 'hovering': false};
            }).value();
        }


        selectHoveredItem(event: KeyboardEvent) {
            const hoveredItem = _(this.localList).find(listItem => listItem.hovering);
    
            if (hoveredItem) {
                this.select(hoveredItem);
                event.preventDefault();
            }
        }


        arrowNavigation(event: KeyboardEvent) {
            let newIndex: number = null;
            const oldIndex = _(this.localList).findIndex(listItem => listItem.hovering);

            event.preventDefault();
    
            if (event.which === this.keys.arrowDown) {
                if (oldIndex > -1 && this.localList.length > (oldIndex + 1)) {
                    newIndex = oldIndex + 1;
                }
                else {
                    newIndex = 0;
                }
            }
            else if (event.which === this.keys.arrowUp) {
                if (oldIndex > -1 && (oldIndex - 1) >= 0) {
                    newIndex = oldIndex - 1;
                }
                else {
                    newIndex = this.localList.length - 1;
                }
            }
    
            // hover next item if index changed
            if (newIndex !== oldIndex) {
                if (oldIndex > -1) { 
                    this.localList[oldIndex].hovering = false; 
                }
    
                this.localList[newIndex].hovering = true;
            }
        }


        close() {
            this.dropdownVisible = false;
        }
    }

    angular.module('app').directive('tokkDropdown', tokkDropdown);
}