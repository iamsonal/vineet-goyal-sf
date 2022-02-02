import { StoreMetadata } from '@luvio/engine';
import { buildTTLStrategy } from './util';
import {
    createSeenRecords,
    createSnapshot,
    findIds,
    findMetadata,
    SnapshotState,
    snapshotStateFromTTL,
} from '../../storeEval/snapshot';
import { evaluationResults, snapshotTemplate } from './util';

function makeMetadata(expirations: number[]): StoreMetadata[] {
    return expirations.map((timeStamp) => {
        return {
            ingestionTimestamp: 1634703585585,
            expirationTimestamp: timeStamp,
            representationName: 'RecordRepresentation',
            namespace: 'UiApi::',
            staleTimestamp: 9007199254740991,
        };
    });
}
describe('snapshot functions', () => {
    describe('findIds', () => {
        it('finds ids in top level and child nodes', () => {
            const jsonResult = JSON.parse(evaluationResults(1634703585585));
            const ids = findIds(jsonResult);
            expect(ids).toEqual(['1tsx0000000004zAAA', '1tsx0000000008MAAZ', '1tsx0000000008MAAQ']);
        });
    });

    describe('snapshotStateFromTTL', () => {
        const ttlStrategy = buildTTLStrategy(500);
        const now = 1630000001000;
        it('returns unfulfilled when at least one record is beyond stale', () => {
            const metadata = makeMetadata([now - 600, now + 500, now - 450]);
            const state = snapshotStateFromTTL(metadata, ttlStrategy, now);

            expect(state).toEqual(SnapshotState.Unfulfilled);
        });

        it('returns stale when at least one record is stale', () => {
            const metadata = makeMetadata([now - 100, now + 500, now - 450]);
            const state = snapshotStateFromTTL(metadata, ttlStrategy, now);

            expect(state).toEqual(SnapshotState.Stale);
        });

        it('returns fulfilled when no records are stale or beyond stale', () => {
            const metadata = makeMetadata([now + 100, now + 500, now + 450]);
            const state = snapshotStateFromTTL(metadata, ttlStrategy, now);

            expect(state).toEqual(SnapshotState.Fulfilled);
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

    describe('findMetadata', () => {
        it('returns _metadata node for top level and child nodes', () => {
            const jsonResult = JSON.parse(evaluationResults(1634703585585));
            const ids = findMetadata(jsonResult);
            expect(ids).toEqual([
                {
                    expirationTimestamp: 1634703585585,
                    ingestionTimestamp: 1634703582297,
                    namespace: 'UiApi::',
                    representationName: 'RecordRepresentation',
                    staleTimestamp: 9007199254740991,
                },
                {
                    expirationTimestamp: 1634703585585,
                    ingestionTimestamp: 1634703585585,
                    namespace: 'UiApi::',
                    representationName: 'RecordRepresentation',
                    staleTimestamp: 9007199254740991,
                },
                {
                    expirationTimestamp: 1634703585585,
                    ingestionTimestamp: 1634703585585,
                    namespace: 'UiApi::',
                    representationName: 'RecordRepresentation',
                    staleTimestamp: 9007199254740991,
                },
            ]);
        });
    });

    describe('createSnapshot', () => {
        const ttlStrategy = buildTTLStrategy(500);
        const now = 1630000001000;

        it('creates fulfilled snapshot', () => {
            const jsonResult = JSON.parse(evaluationResults(now + 100));
            const snapshot = createSnapshot(jsonResult, ttlStrategy, now);

            expect(snapshot).toEqual(snapshotTemplate(now + 100, SnapshotState.Fulfilled));
        });

        it('creates unfulfilled snapshot', () => {
            const jsonResult = JSON.parse(evaluationResults(now - 1000));
            const snapshot = createSnapshot(jsonResult, ttlStrategy, now);

            expect(snapshot).toEqual(snapshotTemplate(now - 1000, SnapshotState.Unfulfilled));
        });

        it('creates stale snapshot', () => {
            const jsonResult = JSON.parse(evaluationResults(now - 450));
            const snapshot = createSnapshot(jsonResult, ttlStrategy, now);

            expect(snapshot).toEqual(snapshotTemplate(now - 450, SnapshotState.Stale));
        });
    });
});
