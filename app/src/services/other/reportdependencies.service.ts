///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {

    'use strict';

    export interface IReportDependenciesList {
        users: Array<IUser>;
        projects: Array<IGroupProject  |IUserProjectListItem>;
        tasks: Array<IGroupTask | IUserTasksListItem>;
        tags: Array<IGroupTag | IUserTagsListItem>;
    }

    export interface IReportDependenciesMappedList {
        users: Array<string>;
        projects: Array<string>;
        tasks: Array<string>;
        tags: Array<string>;
    }

    export class ReportDependencies {
        public entries: Array<IEntry>;
        public list: IReportDependenciesList;
        public mappedList: IReportDependenciesMappedList;
        private behaviorSubject: Rx.BehaviorSubject<IReportDependenciesMappedList | null>;
        public replay: Rx.Observable<IReportDependenciesMappedList | null>;

        constructor(
            private $log: ng.ILogService,
            private Auth: Auth,
            private Utilities: Utilities
        ) {
            this.entries = [];
            this.list = null;
            this.mappedList = null;
            this.behaviorSubject = new Rx.BehaviorSubject(null);
            this.replay = this.behaviorSubject.distinctUntilChanged().publishReplay(1).refCount();
        }


        initiate(
            hasAccessToGroupEntries: boolean,
            users: Array<IUser>, 
            projects: Array<IGroupProject|IUserProjectListItem>,
            tasks: Array<IGroupTask|IUserTasksListItem>, 
            tags: Array<IGroupTag|IUserTagsListItem>,
            entries: Array<IEntry>
        ) {
            this.entries = this.Utilities.deepFreeze(entries);

            this.list = this.Utilities.deepFreeze({
                'users': (hasAccessToGroupEntries ? users : (users ? users.filter(user => user.$id === this.Auth.userUID) : null)),
                'projects': (projects ? projects : []),
                'tasks': (tasks ? tasks : []),
                'tags': (tags ? [{'tag_name': 'Untagged', 'tag_slug': 'untagged'}, ...tags] : [{'tag_name': 'Untagged', 'tag_slug': 'untagged'}])
            });

            this.mappedList = this.Utilities.deepFreeze({
                'users': this.list.users.map(user => user.$id),
                'projects': this.list['projects'].map(project => project.project_slug),
                'tasks': this.list['tasks'].map(task => task.task_slug),
                'tags': this.list['tags'].map(tag => tag.tag_slug)
            });

            this.behaviorSubject.next(this.mappedList);
        }


        getFilterValuesViewNames(filterCollection: IFilterCollection, type: 'projects' | 'tasks' | 'tags' | 'users') {
            if (_.isArray(filterCollection[type])) {
                return _(filterCollection[type]).map((item) => {
                    return this.getFilterValueViewName(item, type);
                })
                .sortBy()
                .value();
            }

            return filterCollection[type];
        }


        private getFilterValueViewName(filterValue: string, type: 'projects' | 'tasks' | 'tags' | 'users') {
            if (this.list) {
                if (type === 'projects') {
                    const project = _(this.list.projects).find(project => project.project_slug === filterValue);
                    return (project ? project.project_name : null);
                }
                else if (type === 'tasks') {
                    const task = _(this.list.tasks).find(task => task.task_slug === filterValue);
                    return (task ? task.task_name : null);
                }
                else if (type === 'tags') {
                    if (filterValue === 'untagged') {
                        return 'Untagged';
                    }
                    else {
                        const tag = _(this.list.tags).find(tag => tag.tag_slug === filterValue);
                        return (tag ? tag.tag_name : null);
                    }
                }
                else if (type === 'users') {
                    const user = _(this.list.users).find(user => user.$id === filterValue);
                    return (user ? user.first_name + ' ' + user.last_name : null);
                }
            }
            else {
                this.$log.error('Error for getFilterValueViewName() of ReportDependencies');
            }
        }


        destroy() {
            this.entries = [];
            this.list = null;
            this.mappedList = null;
            this.behaviorSubject.next(null);
        }
    }

    angular.module('app').service('ReportDependencies', ReportDependencies);
}