import { clone, stripProperties } from 'test-util';

function formatResults(recordIds, results) {
    return results.reduce(function (seed, avatar, index) {
        const recordId = recordIds[index];
        seed[recordId] = avatar;
        return seed;
    }, {});
}

function stripActionsIds(result) {
    if (result.actions) {
        const sourceObjects = Object.keys(result.actions);
        if (sourceObjects && sourceObjects.length) {
            for (let i = 0; i < sourceObjects.length; i++) {
                const key = sourceObjects[i];
                const actions = result.actions[key].actions;
                if (actions && actions.length) {
                    for (let j = 0; j < actions.length; j++) {
                        stripProperties(result.actions[key].actions[j], ['id']);
                    }
                }
            }
        }
    }
}

const matchers = {
    toEqualActionsBatchSnapshot: () => {
        return {
            compare: function (actual, expected) {
                var stripped = clone(expected);
                stripProperties(stripped, ['url', 'links']);

                // Iterate over stripped.results[].result.actions{}.actions[] and remove the id
                if (stripped.results && stripped.results.length) {
                    for (let resultIdx = 0; resultIdx < stripped.results.length; resultIdx++) {
                        stripActionsIds(stripped.results[resultIdx].result);
                    }
                }

                expect(actual).toEqualSnapshotWithoutEtags(stripped);
                return { pass: true };
            },
        };
    },
    toEqualActionsSnapshot: () => {
        return {
            compare: function (actual, expected) {
                var stripped = clone(expected);
                stripProperties(stripped, ['url', 'links']);

                // Iterate over result.actions{}.actions[]
                stripActionsIds(stripped);

                expect(actual).toEqualSnapshotWithoutEtags(stripped);
                return { pass: true };
            },
        };
    },

    toEqualRecordAvatarsSnapshot: () => {
        return {
            compare: function (actual, recordIds, expected) {
                if (expected === undefined) {
                    throw new Error(
                        `Invalid use of "toEqualRecordAvatarsSnapshot". Must pass array of "recordIds" because server response does not have enough information to infer record id`
                    );
                }
                var formatted = formatResults(recordIds, expected.results);
                expect(actual).toEqualSnapshotWithoutEtags(formatted);
                return { pass: true };
            },
        };
    },

    toEqualNavItemsSnapShot: () => {
        return {
            compare: function (actual, expected) {
                var stripped = clone(expected);
                stripProperties(stripped, ['currentPageUrl']);

                expect(actual).toEqualSnapshotWithoutEtags(stripped);
                return { pass: true };
            },
        };
    },

    toEqualBatchRecordSnapshot: () => {
        return {
            compare: function (actual, expected) {
                var stripped = clone(expected);
                stripProperties(stripped, ['hasErrors']);

                expect(actual).toEqualSnapshotWithoutEtags(stripped);
                return { pass: true };
            },
        };
    },
};

beforeAll(() => {
    jasmine.addMatchers(matchers);
});
