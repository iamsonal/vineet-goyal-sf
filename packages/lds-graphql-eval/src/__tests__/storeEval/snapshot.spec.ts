import {
    createFulfilledSnapshot,
    createSeenRecords,
    findIds,
    GRAPHQL_ROOT_KEY,
    IdMap,
} from '../../storeEval/snapshot';
import { evaluationResults } from './util';

describe('snapshot functions', () => {
    describe('findIds', () => {
        it('finds ids in top level and child nodes', () => {
            const jsonResult = JSON.parse(evaluationResults(1634703585585));
            const ids = findIds(jsonResult);
            expect(ids).toEqual(['1tsx0000000004zAAA', '1tsx0000000008MAAZ', '1tsx0000000008MAAQ']);
        });
    });

    describe('createSeenRecords', () => {
        it('returns seen records for top level and children', () => {
            const jsonResult = JSON.parse(evaluationResults(1634703585585));
            const ids = createSeenRecords(jsonResult);
            expect(ids).toEqual({
                'UiApi::RecordRepresentation:1tsx0000000004zAAA': true,
                'UiApi::RecordRepresentation:1tsx0000000008MAAQ': true,
                'UiApi::RecordRepresentation:1tsx0000000008MAAZ': true,
            });
        });
    });

    describe('createSnapshot', () => {
        it('creates fulfilled snapshot with passed in seenRecords and data', () => {
            const data = JSON.parse(evaluationResults(Date.now()));
            const seenRecords: IdMap = { 'UiApi::RecordRepresentation:1tsx0000000008MAAZ': true };
            const snapshot = createFulfilledSnapshot(data, seenRecords);

            expect(snapshot).toEqual({
                data,
                recordId: GRAPHQL_ROOT_KEY,
                seenRecords,
                select: {
                    recordId: GRAPHQL_ROOT_KEY,
                    node: {
                        kind: 'Fragment',
                        private: [],
                    },
                    variables: {},
                },
                state: 'Fulfilled',
                variables: {},
            });
        });
    });
});
