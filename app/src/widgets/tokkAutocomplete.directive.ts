///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';

    declare var window: any;

    const styles = require('tokkAutocomplete.css');

    function tokkAutocomplete() {
        return {
            scope: {},
            bindToController: {
                group: '@',
                searchProperty: '@',
                viewProperty: '@',
                key: '@',
                setInput: '&',
                opened: '<'
            },
            restrict: 'E',
            templateUrl: 'tokkAutocomplete.template.html',
            transclude: true,
            controller: AutocompleteController,
            controllerAs: 'vm'
        };
    }


    export class AutocompleteController {
        public styles: any;
        public group: 'projects' | 'tasks' | 'tags';
        public searchProperty: string;
        public viewProperty: string;
        public opened: boolean;
        public key: string;
        public container: HTMLElement;
        public input: HTMLInputElement;
        public inputValueProperty: string;
        public setInput: Function;
        public clickSubscription: Rx.Subscription;
        public selectedItem: IGroupProject | IGroupTask | IGroupTag;
        public autocompleteOpened: boolean;
        public matchedItems: Array<IGroupProject | IGroupTask | IGroupTag>;
        public subscriptions: Array<Rx.Subscription>;

        constructor(
            private $scope: ng.IScope,
            private $element: ng.IRootElementService,
            private keys: IKeys,
            private Utilities: Utilities,
            private GroupProjects: GroupProjects, 
            private GroupTasks: GroupTasks, 
            private GroupTags: GroupTags,
            private Broadcaster: Broadcaster
        ) {}

        $onInit() {
            this.styles = styles;
            this.selectedItem = null;
            this.autocompleteOpened = false;
            this.clickSubscription = null;
            this.matchedItems = [];

            this.subscriptions = [
                this.Broadcaster.observe()
                    .filter(object => object.key !== this.key && object.message === 'opened')
                    .subscribe(() => {
                        this.closeDropdown();
                        this.$scope.$evalAsync();
                    }),

                this.Broadcaster.observeKey(this.key)
                    .filter(data => data.message === 'close')
                    .subscribe(() => {
                        this.closeDropdown();
                        this.$scope.$evalAsync();
                    })
            ];

            // Pushes extra subscriptions to this.subscriptions[].
            // Only run after this.subscriptions has been declared!
            this.setServiceObserver(this.group);
        }


        $postLink() {
            this.container = this.$element[0];
            this.input = this.$element[0].querySelector('.autocomplete-input');
            this.inputValueProperty = (this.input.tagName === 'INPUT' ? 'value' : 'textContent');
        }


        $onChanges(changes) {
            if (_.isBoolean(changes.opened.currentValue) && 
                _.isBoolean(changes.opened.previousValue) && 
                !_.isEqual(changes.opened.currentValue, changes.opened.previousValue)
            ) {
                this.toggleList();
            }
        }


        $onDestroy() {
            this.Utilities.unsubscribe(this.clickSubscription);
            this.subscriptions.forEach(subscription => subscription.unsubscribe());
        }


        setServiceObserver(group: string) {
            if (group === 'projects') {
                this.subscriptions.push(this.GroupProjects.observe().subscribe());
            }
            else if (group === 'tasks') {
                this.subscriptions.push(this.GroupTasks.observe().subscribe());
            }
            else if (group === 'tags') {
                this.subscriptions.push(this.GroupTags.observe().subscribe());
            }
        }


        getSourceList(group: 'projects' | 'tasks' | 'tags'): Array<IGroupProject | IGroupTask | IGroupTag> {
            if (group === 'projects') {
                return this.GroupProjects.stream.data || [];
            }
            else if (group === 'tasks') {
                return this.GroupTasks.stream.data || [];
            }
            else if (group === 'tags') {
                return this.GroupTags.stream.data || [];
            }
        }


        addClickSubscription() {
            this.Utilities.unsubscribe(this.clickSubscription);

            this.clickSubscription = Rx.Observable
                .fromEvent(document, 'click')
                .filter((event: JQueryEventObject) => {
                    const element = event.target;
                    return element && element.classList && !element.classList.contains('autocomplete-noclose');
                })
                .subscribe(() => {
                    this.closeDropdown();
                    this.$scope.$evalAsync();
                });
        }


        openDropdown() {
            this.autocompleteOpened = true;
            this.addClickSubscription();
            this.Broadcaster.emit({'key': this.key, 'message': 'opened', 'value': true});
            this.input.focus();
        }


        closeDropdown() {
            if (this.autocompleteOpened === true) {
                this.matchedItems = [];
                this.autocompleteOpened = false;
                this.selectedItem = null;
                this.Utilities.unsubscribe(this.clickSubscription);
            }
        }


        findAndSelectExactMatch(list: Array<any>) {
            _(list)
                .filter(item => item[this.searchProperty] === this.Utilities.slugify(this.input[this.inputValueProperty]))
                .forEach((item) => {
                    this.select(item);
                    return false;
                });
        }


        toggleList() {
            if (this.autocompleteOpened === true) {
                this.closeDropdown();
            }
            else {
                this.matchedItems = this.getSourceList(this.group);
                this.findAndSelectExactMatch(this.matchedItems);
                this.openDropdown();
            }
        }


        keyup(event: KeyboardEvent) {
            if (event.which !== this.keys.esc && 
                event.which !== this.keys.arrowDown && 
                event.which !== this.keys.arrowUp &&
                event.which !== this.keys.enter
            ) {
                const inputText = _.trim(this.input[this.inputValueProperty]);
                this.findMatches(inputText);
            }
        }


        keydown(event: KeyboardEvent) {
            if (event.which === this.keys.arrowDown || event.which === this.keys.arrowUp) {
                if (this.autocompleteOpened === true && this.matchedItems.length > 0) {
                    event.preventDefault();
                    this.arrowNavigation(event);
                }
            }
        }


        arrowNavigation(event: KeyboardEvent) {            
            let newIndex: number = null;
            const oldIndex: number = (this.selectedItem ? _.findIndex(this.matchedItems, {'$id': this.selectedItem.$id}) : -1);

            if (event.which === this.keys.arrowDown) {
                if ( oldIndex > -1 && this.matchedItems.length > (oldIndex + 1) ) {
                    newIndex = oldIndex + 1;
                }
                else {
                    newIndex = 0;
                }
            }
            else if (event.which === this.keys.arrowUp) {
                if ( oldIndex > -1 && (oldIndex - 1) >= 0 ) {
                    newIndex = oldIndex - 1;
                }
                else {
                    newIndex = this.matchedItems.length - 1;
                }
            }

            if (newIndex !== oldIndex) {
                this.select(this.matchedItems[newIndex], newIndex);
            }
        }


        findMatches(inputText: string) {
            this.selectedItem = null;

            if (inputText.length > 1) {
                let partialMatch = false;
                let exactMatch = false;
                inputText = this.Utilities.slugify(inputText);

                this.matchedItems = this.getSourceList(this.group).filter((item) => {
                    return this.Utilities.fuzzysearch(inputText, item[this.searchProperty]);
                })
                .sort((a, b) => {
                    return window.Levenshtein.get(a[this.searchProperty], inputText) - window.Levenshtein.get(b[this.searchProperty], inputText);
                });

                if (this.matchedItems && this.matchedItems.length > 0) {
                    partialMatch = true;

                    if (this.matchedItems[0][this.searchProperty] === inputText) {
                        exactMatch = true;
                    }
                }

                if (partialMatch || exactMatch) {
                    this.openDropdown();
                }
                else {
                    this.closeDropdown();
                }
            }
            else {
                this.closeDropdown();
            }
        }


        select(item, index: boolean|number = false) {
            this.selectedItem = _.cloneDeep(item);

            if (_.isNumber(index)) {
                const dropdownElement = this.container.getElementsByClassName(this.styles.dropdown);
                const selectedListItemElement = this.container.getElementsByClassName(this.styles.selected);

                if (index > 0) {
                    dropdownElement[0].scrollTop = (index - 1) * selectedListItemElement[0].clientHeight;
                }
                else {
                    dropdownElement[0].scrollTop = 0;
                }
            }
        }


        setSelected(event: MouseEvent|KeyboardEvent) {
            if (_.isObject(this.selectedItem) && !_.isEmpty(this.selectedItem)) {
                event.stopPropagation();
                this.setInput({'text': this.selectedItem[this.viewProperty]});
                this.input.focus();
                this.Utilities.setCaretAtEnd(this.input);
            }

            this.closeDropdown();
        }
    }

    angular.module('app').directive('tokkAutocomplete', tokkAutocomplete);
}