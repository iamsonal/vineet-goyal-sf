import { clone, stripEtags, stripProperties } from 'test-util';

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
                var striped = clone(expected);
                stripEtags(striped);
                stripProperties(striped, ['url', 'links']);

                expect(actual).toEqualSnapshotWithoutEtags(striped);
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
};

beforeAll(() => {
    jasmine.addMatchers(matchers);
});
