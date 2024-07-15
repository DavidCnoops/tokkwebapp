///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {

    'use strict';

    const styles = require('tokkListFilter.css');

    function tokkListFilter() {
        return {
            scope: {},
            bindToController: {
                type: '@',
                property: '@',
                viewproperty: '@'
            },
            restrict: 'E',
            templateUrl: 'tokkListFilter.template.html',
            controller: ListFilterController,
            controllerAs: 'vm'
        };
    }

    interface IItemsCheckedStateList {
        [key: string]: boolean;
    }

    class ListFilterController {
        public styles: any;
        public type: 'projects' | 'tasks' | 'tags' | 'users';
        public property: 'project_slug' | 'task_slug' | 'tag_slug' | '$id';
        public viewproperty: 'project_name' | 'task_name' | 'tag_name' | 'email';
        public searchText: string;
        public list: Array<any>;
        public itemsCheckedStateList: IItemsCheckedStateList;
        public allChecked: boolean;
        public selectedFilterCollection: IFilterCollection;
        public subscriptions: Array<Rx.Subscription>;

        constructor(
            private $scope: ng.IScope,
            private FilterCollections: FilterCollections,
            private ReportDependencies: ReportDependencies,
            private Utilities: Utilities
        ) {}

        $onInit() {
            this.styles = styles;
            this.searchText = null;
            this.list = null;
            this.itemsCheckedStateList = null;
            this.allChecked = null;
            this.selectedFilterCollection = null;

            this.subscriptions = [
                Rx.Observable.combineLatest(
                    this.FilterCollections.observe(),
                    this.FilterCollections.replay,
                    (s1, s2) => {
                        return {
                            'filtercollections': s1, 
                            'selected_filtercollection_id': s2
                        };
                    }
                )
                .subscribe((data) => {
                    this.list = this.getList(this.type);

                    if (data.selected_filtercollection_id) {
                        this.selectedFilterCollection = _(data.filtercollections).find(filtercollection => filtercollection.$id === data.selected_filtercollection_id);

                        if (this.selectedFilterCollection) {
                            this.allChecked = (this.selectedFilterCollection[this.type] === 'all');
                            this.itemsCheckedStateList = this.getItemsCheckedStateList(this.list, this.selectedFilterCollection[this.type]);
                        }
                    }
                    else {
                        this.itemsCheckedStateList = null;
                        this.allChecked = null;
                        this.selectedFilterCollection = null;
                    }

                    this.$scope.$evalAsync();
                })
            ];

            this.$scope.$on('$destroy', () => {
                this.subscriptions.forEach(subscription => subscription.unsubscribe());
            });
        }


        getList(type: 'projects' | 'tasks' | 'tags' | 'users'): Array<any> {
            if (this.ReportDependencies.list && this.ReportDependencies.list[type]) {
                if (type === 'tags') {
                    // sort array and move the mock 'untagged' object to the front
                    const list = _(this.ReportDependencies.list[type]).filter(item => item.tag_slug !== 'untagged').sortBy(this.property).value();
                    return [{'tag_name': 'Untagged', 'tag_slug': 'untagged'}, ...list];
                }

                if (type === 'users') {
                    return _(this.ReportDependencies.list[type]).sortBy(item => item.first_name).value();
                }

                return _(this.ReportDependencies.list[type]).sortBy(this.property).value();
            }

            return null;
        }


        getItemsCheckedStateList(list: Array<any>, filterValues: 'all' | Array<string>) {
            const output: IItemsCheckedStateList = {};

            _(list).forEach(listItem => output[listItem[this.property]] = false);

            if (_.isArray(filterValues)) {
                _(list).forEach((listItem) => {
                    output[listItem[this.property]] = _(filterValues).some(filterValue => filterValue === listItem[this.property]);
                });
            }

            return this.Utilities.deepFreeze<IItemsCheckedStateList>(output);
        }


        selectAll() {
            this.FilterCollections.update(this.selectedFilterCollection.$id, {[this.type]: 'all'});
        }


        toggleCheckbox(
            toggledFilterValue: string, 
            oldCheckedSate: boolean, 
            selectedFilterCollection: IFilterCollection, 
            type: string
        ) {
            const object: IUpdatedFilterCollection = {};

            if (!_.isArray(selectedFilterCollection[type])) {
                object[type] = [toggledFilterValue];
            }
            else if (oldCheckedSate === true) {
                const filterValues = _(selectedFilterCollection[type]).filter(filterValue => filterValue !== toggledFilterValue).value();
                object[type] = (_.isArray(filterValues) && !_.isEmpty(filterValues) ? filterValues : 'all');
            }
            else if (oldCheckedSate === false) {
                const filterValues = _(selectedFilterCollection[type]).concat(toggledFilterValue).value();
                object[type] = filterValues;
            }

            this.FilterCollections.update(selectedFilterCollection.$id, object);
        }
    }

    angular.module('app').directive('tokkListFilter', tokkListFilter);
}