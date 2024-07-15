///<reference path='../../../typings/dependencies.d.ts' />
///<reference path='../../../typings/app.d.ts' />

module app {

    'use strict';

    declare const dragula: any;
    declare const autoScroll: any;

    // const styles = require('tokkDragula.css');
    require('tokkDragula.css');

    interface IScope extends ng.IScope {
        isdraggable: boolean;
        update(object: {
            oldIndex: number;
            newIndex: number;
            draggedItemID: string;
        });
        scrollcontainer: string;
        handler?: string;
        key?: string;
    }

    function tokkDragula(
        ReplayBroadcaster: ReplayBroadcaster,
        Streams: Streams
    ) {
        function link(scope: IScope, element: ng.IAugmentedJQuery, attrs: ng.IAttributes) {
            const containers: any = [element[0]];
            let oldIndex: number = null;
            let scroll = null;
            const drake = dragula(containers, {
                moves: (el, container, handle) => {
                    if (handle.tagName === 'INPUT') {
                        return false;
                    }
                    else if (scope.isdraggable) {
                        if (scope.handler && _.isString(scope.handler)) {
                            let isHandler = false;

                            for (let element: any = handle; element; element = element.parentNode) {
                                if (element.classList && element.classList.contains(scope.handler)) {
                                    isHandler = true;
                                    break;
                                }
                            }

                            return isHandler;
                        }

                        return true;
                    }

                    return false;
                },
                invalid: (element, handle) => {
                    return element.classList.contains('nodrag');
                },
                ignoreInputTextSelection: true,
                direction: 'vertical',
                animation: 150
            });

            if (scope.scrollcontainer) {
                scroll = autoScroll([document.querySelector(scope.scrollcontainer)], {
                    margin: 50,
                    maxSpeed: 6,
                    scrollWhenOutside: true,
                    autoScroll: function() {
                        return this.down && drake.dragging;
                    }
                });
            }

            drake.on('drag', (element, source) => {
                oldIndex = Array.prototype.slice.call(source.children).indexOf(element);
                const draggedItemID: string = element.getAttribute('itemid');

                if (scope.key) {
                    ReplayBroadcaster.emit({
                        'key': scope.key, 
                        'message': 'sorting', 
                        'value': {
                            'status': 'started',
                            'dragged_item_id': draggedItemID
                        }
                    });
                }
            });

            drake.on('dragend', (element) => {
                const draggedItemID: string = element.getAttribute('itemid');

                if (scope.key) {
                    ReplayBroadcaster.emit({
                        'key': scope.key, 
                        'message': 'sorting', 
                        'value': {
                            'status': 'ended',
                            'dragged_item_id': draggedItemID
                        }
                    });
                }
            });

            drake.on('drop', (element, target, source, sibling) => {
                const newIndex: number = Array.prototype.slice.call(source.children).indexOf(element);
                const draggedItemID: string = element.getAttribute('itemid');

                scope.update({
                    'oldIndex': oldIndex,
                    'newIndex': newIndex,
                    'draggedItemID': draggedItemID
                });
            });

            scope.$on('$destroy', () => {
                drake.destroy();

                if (scroll) {
                    scroll.destroy();
                }
            });
        }

        return {
            scope: {
                isdraggable: '<',
                update: '&',
                scrollcontainer: '@',
                handler: '@',
                key: '@'
            },
            restrict: 'A',
            link: link
        };
    }

    angular.module('app').directive('tokkDragula', tokkDragula);
}