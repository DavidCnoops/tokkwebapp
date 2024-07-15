///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {

    'use strict';

    export interface IReportResultItem {
        name: string;
        viewName: string;
        seconds: number;
        time: string;
        children: Array<IReportResultItem>;
    }

    export class ReportResult {

        getGroupOrder(groupBy1: 'list' | 'day' | 'user', groupBy2: 'list' | 'day' | 'user') {
            return [this.getGroupOrderItemName(groupBy1), this.getGroupOrderItemName(groupBy2), 'task_slug'];
        }


        getGroupOrderItemName(type: 'list' | 'day' | 'user') {
            if (type === 'list') {
                return 'project_slug';
            }
            else if (type === 'day') {
                return 'entry_date';
            }
            else if (type === 'user') {
                return 'user_uid';
            }
        }


        getFilterPropertyName(type: string) {
            if (type === 'days') {
                return 'entry_date_timestamp';
            }
            else if (type === 'projects') {
                return 'project_slug';
            }
            else if (type === 'tasks') {
                return 'task_slug';
            }
            else if (type === 'tags') {
                return 'tag_slug';
            }
            else if (type === 'users') {
                return 'user_uid';
            }
        }


        getFilteredEntries(entries: Array<IEntry>, filterCollection: IFilterCollection) {
            let filteredEntries: Array<IEntry> = [];

            if (filterCollection) {
                filteredEntries = _(entries).filter((entry) => {
                    let includeEntry = true;

                    _(['users', 'projects', 'tasks']).forEach((filterName) => {
                        const propertyName = this.getFilterPropertyName(filterName);

                        if (_.isArray(filterCollection[filterName])) {
                            if (!_.includes(filterCollection[filterName], entry[propertyName])) {
                                includeEntry = false;
                                return false; // break
                            }
                        }
                    });

                    return includeEntry;
                }).value();

                if (filteredEntries.length > 0 && _.isArray(filterCollection.tags)) {
                    filteredEntries = _(filteredEntries).filter((entry) => {
                        return _.intersection(filterCollection.tags, entry.tags).length > 0;
                    }).value();
                }

                if (filteredEntries.length > 0 && _.isArray(filterCollection.days)) {
                    filteredEntries = _(filteredEntries).filter((entry) => {
                        return entry.created_at >= filterCollection.days[0] && entry.created_at <= filterCollection.days[1];
                    }).value();
                }
            }

            return filteredEntries;
        }


        getGroupedEntries(
            filteredEntries: Array<IEntry>, 
            users: Array<IUser>, 
            groupBy1: 'list' | 'day' | 'user',
            groupBy2: 'list' | 'day' | 'user'
        ): Array<IReportResultItem> {
            const groupOrder = this.getGroupOrder(groupBy1, groupBy2);

            const nest = (entries: Array<IEntry>, keys: Array<string>) => {
                if (_.isArray(keys) && !_.isEmpty(keys)) {
                    entries = _(entries).map((entry) => {
                        const user = _(users).find(user => user.$id === entry.user_uid);

                        if (user) {
                            return {
                                ...entry,
                                'first_name': user.first_name
                            };
                        }

                        return entry;
                    }).value();

                    entries = _(entries).sortBy(keys.map(item => (item === 'user_uid' ? 'first_name' : item))).value();
                }
                else {
                    return null;
                }

                const identifierPropertyName = keys[0];
                const rest = keys.slice(1);

                return _.chain(_.groupBy(entries, identifierPropertyName)).map((groupedEntries: Array<IEntry>) => {
                    const totalSeconds = _.sum(_.map(groupedEntries, 'seconds'));

                    // only include entry when it has seconds
                    if (totalSeconds > 0) {
                        return {
                            'name': groupedEntries[0][identifierPropertyName],
                            'viewName': this.getViewName(identifierPropertyName, groupedEntries[0], users),
                            'seconds': totalSeconds,
                            'time': this.getHumanizedTime(totalSeconds),
                            'children': nest(groupedEntries, rest)
                        };
                    }
                })
                .filter((output) => !_.isUndefined(output))
                .value();
            };

            const groupedEntries = nest(filteredEntries, groupOrder);

            return groupedEntries;
        }


        getJSONEntries(
            filteredEntries: Array<IEntry>, 
            users: Array<IUser>, 
            groupBy1: 'list' | 'day' | 'user',
            groupBy2: 'list' | 'day' | 'user'
        ) {
            const groupOrder = this.getGroupOrder(groupBy1, groupBy2);

            const nest = (entries: Array<IEntry>, keys: Array<string>) => {
                if (_.isArray(keys) && !_.isEmpty(keys)) {
                    entries = _(entries).map((entry) => {
                        const user = _(users).find(user => user.$id === entry.user_uid);

                        if (user) {
                            return {
                                ...entry,
                                'first_name': user.first_name
                            };
                        }

                        return entry;
                    }).value();

                    entries = _(entries).sortBy(keys.map(item => (item === 'user_uid' ? 'first_name' : item))).value();
                }
                else {
                    return null;
                }

                const identifierPropertyName = keys[0];
                const rest = keys.slice(1);

                return _.chain(_.groupBy(entries, identifierPropertyName)).map((groupedEntries: Array<IEntry>) => {
                    const totalSeconds = _.sum(_.map(groupedEntries, 'seconds'));

                    // only include entry when it has seconds
                    if (totalSeconds > 0) {
                        return {
                            'name': this.getViewName(identifierPropertyName, groupedEntries[0], users),
                            'seconds': totalSeconds,
                            'time': this.getHumanizedTime(totalSeconds),
                            'children': nest(groupedEntries, rest)
                        };
                    }
                })
                .filter((output) => !_.isUndefined(output))
                .value();
            };

            return JSON.stringify(this.pruneEmpty(nest(filteredEntries, groupOrder)), null, 2);
        }


        getViewName(propertyName: string, entry: IEntry, users: Array<IUser>) {
            if (propertyName === 'project_slug') {
                return entry.project_name;
            }
            else if (propertyName === 'task_slug') {
                return entry.task_name;
            }
            else if (propertyName === 'entry_date') {
                return moment(entry.entry_date, 'YYYY-MM-DD', true).format('dddd, MMMM D, YYYY');
            }
            else if (propertyName === 'user_uid') {
                const user = _(users).find(user => user.$id === entry.user_uid);
                return `${user.first_name} ${user.last_name}`;
            }
        }


        getHumanizedTime(inputSeconds: number): string {
			let humanTime = null;
			let hoursNotation = 'hour';
			const minutesNotation = 'min';
			let secondsNotation = 'second';

			const hours = Math.floor(inputSeconds / 3600);
			const minutes = Math.floor((inputSeconds - (hours * 3600)) / 60);
			const seconds = inputSeconds - (hours * 3600) - (minutes * 60);

			if (hours === 0 || hours > 1) {
				hoursNotation += 's';
			}

			if (seconds === 0 || seconds > 1) {
				secondsNotation += 's';
			}

			if (hours > 0 && minutes > 0) {
                humanTime = `${hours} ${hoursNotation} ${minutes} ${minutesNotation}`;
			}
            else if (hours > 0 && minutes === 0) {
                humanTime = `${hours} ${hoursNotation}`;
            }
			else if (hours === 0 && minutes > 0) {
                humanTime = `${minutes} ${minutesNotation}`;
			}
			else {
                humanTime = `${seconds} ${secondsNotation}`;
			}

			return humanTime;
        }


        getTotalTime(filteredEntries: Array<IEntry>) {
            const totalSeconds = _(filteredEntries).reduce((total, entry) => total + entry.seconds, 0);
            return this.getHumanizedTime(totalSeconds);
        }


        pruneEmpty(obj) {
            return function prune(current) {
                _.forOwn(current, (value, key) => {
                    if (_.isNil(value) || 
                        _.isNaN(value) ||
                        (_.isString(value) && _.isEmpty(value)) ||
                        (_.isObject(value) && _.isEmpty(prune(value)))
                    ) {
                        delete current[key];
                    }
                });

                // remove any leftover undefined values from the delete operation on an array
                if (_.isArray(current)) {
                    _.pull(current, undefined);
                }

                return current;
            }(_.cloneDeep(obj));  // do not modify the original object, create a clone instead
        }
    }

    angular.module('app').service('ReportResult', ReportResult);
}