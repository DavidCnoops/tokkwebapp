///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {

    'use strict';

    const styles = require('tokkSharingList.css');

    interface ISharingDropdownItem {
        user_uid: string;
        user_project_id: string | boolean;
        email: string;
        name: string;
        selected?: boolean;
    }

    function tokkSharingList() {
        return {
            scope: {},
            bindToController: {},
            restrict: 'E',
            templateUrl: 'tokkSharingList.template.html',
            controller: SharingListController,
            controllerAs: 'vm'
        };
    }

    export class SharingListController {
        public styles: any;
        public colorName: string;
        public colorHex: string;
        public sharedUsers: Array<ISharingDropdownItem>;
        public showTooltip: boolean;
        public subscriptions: Array<Rx.Subscription>;

        constructor(
            private $scope: ng.IScope,
            private $timeout: ng.ITimeoutService,
            private Auth: Auth,
            private UserProject: UserProject,
            private Users: Users,
            private UserProjectSharing: UserProjectSharing,
            private UserProjectsList: UserProjectsList,
            private Colors: Colors,
            private Streams: Streams,
            private Broadcaster: Broadcaster
        ) {}

        $onInit() {
            this.styles = styles;
            this.colorName = null;
            this.colorHex = null;
            this.showTooltip = true;
            this.sharedUsers = null;

            /*
            // DEBUG
            this.sharedUsers = [
                {
                    'user_uid': '1',
                    'user_project_id': '1',
                    'email': 'bleh@bleh.com',
                    'name': 'Me',
                    'selected': true 
                },
                {
                    'user_uid': '2',
                    'user_project_id': '1',
                    'email': 'bleh@bleh.com',
                    'name': 'David Cnoops',
                    'selected': false 
                },
                {
                    'user_uid': '3',
                    'user_project_id': '1',
                    'email': 'bleh@bleh.com',
                    'name': 'Michael Cowels',
                    'selected': false 
                },
                {
                    'user_uid': '4',
                    'user_project_id': '1',
                    'email': 'bleh@bleh.com',
                    'name': 'Yannick Cnoops',
                    'selected': false 
                },
                {
                    'user_uid': '4',
                    'user_project_id': '1',
                    'email': 'bleh@bleh.com',
                    'name': 'Patrick Cnoops',
                    'selected': false 
                },
                {
                    'user_uid': '5',
                    'user_project_id': '1',
                    'email': 'bleh@bleh.com',
                    'name': 'Ingrid Donckers',
                    'selected': false 
                }
            ];
            */

            this.subscriptions = [
                Rx.Observable.combineLatest(
                    this.UserProject.replay
                        .filter(value => value !== null)
                        .switchMap((selectedProjectID) => {
                            return Rx.Observable.combineLatest(
                                this.UserProjectSharing.observe(selectedProjectID),

                                this.UserProjectsList.observe()
                                    .filter(items => items !== null)
                                    .switchMap(list => Rx.Observable.from(list))
                                    .filter(project => project.user_project_id === selectedProjectID)
                                    .distinctUntilChanged(),

                                (s1, s2) => {
                                    return {
                                        'sharing_items': s1,
                                        'project': s2
                                    };
                                }
                            ).map((data) => {
                                return {
                                    'selected_project_id': selectedProjectID,
                                    'sharing_items': data.sharing_items,
                                    'project': data.project
                                };
                            });
                        }),

                    this.Users.observe().filter(items => items !== null),

                    this.Streams.stream.sharing.replay,

                    this.UserProjectsList.observe(),

                    (s1, s2, s3, s4) => {
                        return {
                            'selected_project_id': s1.selected_project_id,
                            'sharing_items': s1.sharing_items, 
                            'project': s1.project,
                            'users': s2,
                            'selected_shared_user_uid': s3
                        };
                    }
                ).subscribe((data) => {
                    this.colorName = data.project.color;
                    this.colorHex = (data.project ? this.Colors.list[data.project.color] : null);

                    const sharingItems = _(data.sharing_items).filter(item => item.status === 'sharing' && _.isString(item.user_project_id) && !_.isEmpty(item.user_project_id)).value();

                    if (_.isArray(sharingItems) && !_.isEmpty(sharingItems)) {
                        this.sharedUsers = this.buildSharingList(data.selected_project_id, data.users, data.sharing_items, data.selected_shared_user_uid);
                    }
                    else {
                        this.sharedUsers = null;
                    }

                    this.$scope.$evalAsync();
                })
            ];

            this.$scope.$on('$destroy', () => {
                this.subscriptions.forEach(subscription => subscription.unsubscribe());
            });
        }


        buildSharingListItem(userUID: string, projectID: string|boolean, users: Array<IUser>, selectedUserUID: string) {
            const user = _(users).find(user => user.$id === userUID);

            return <ISharingDropdownItem>{
                'user_uid': user.$id,
                'user_project_id': projectID,
                'email': user.email,
                'name': (userUID === this.Auth.userUID ? `Me` : `${user.first_name } ${user.last_name}`),
                'selected': (userUID === selectedUserUID)
            };
        }


        buildSharingList(projectID: string, users: Array<IUser>, sharingItems: Array<IUserProjectSharingItem>, selectedUserUID: string) {
            return [this.buildSharingListItem(this.Auth.userUID, projectID, users, selectedUserUID)].concat(
                _(sharingItems)
                    .filter(item => item.status === 'sharing' && _.isString(item.user_project_id) && !_.isEmpty(item.user_project_id))
                    .sortBy(item => item.added)
                    .map(item => this.buildSharingListItem(item.user_uid, item.user_project_id, users, selectedUserUID))
                    .value()
            );
        }


        selectUser(userUID: string) {
            if (_.isString(userUID) && !_.isEmpty(userUID)) {
                this.Streams.stream.sharing.set(userUID);
            }
        }


        openSharingModal() {
            this.showTooltip = false;

            this.$timeout(() => {
                this.showTooltip = true;
            }, 50);

            this.Broadcaster.emit({
                'key': '7c5ba180-33f6-481f-a4cb-635d35e331ae', 
                'message': 'opensharingmodal', 
                'value': true
            });
        }
    }

    angular.module('app').directive('tokkSharingList', tokkSharingList);
}