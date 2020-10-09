import { clone, stripProperties } from 'test-util';

function formatResults(recordIds, results) {
    return results.reduce(function(seed, avatar, index) {
        const recordId = recordIds[index];
        seed[recordId] = avatar;
        return seed;
    }, {});
}

const matchers = {
    toEqualActionsSnapshot: () => {
        return {
            compare: function(actual, expected) {
                var stripped = clone(expected);
                stripProperties(stripped, ['url', 'links']);

                expect(actual).toEqualSnapshotWithoutEtags(stripped);
                return { pass: true };
            },
        };
    },

    toEqualRecordAvatarsSnapshot: () => {
        return {
            compare: function(actual, recordIds, expected) {
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
            compare: function(actual, expected) {
                var stripped = clone(expected);
                stripProperties(stripped, ['currentPageUrl']);

                expect(actual).toEqualSnapshotWithoutEtags(stripped);
                return { pass: true };
            },
        };
    },

    toEqualBatchRecordSnapshot: () => {
        return {
            compare: function(actual, expected) {
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
