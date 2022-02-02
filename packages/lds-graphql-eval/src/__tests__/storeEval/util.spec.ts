import { DurableStoreChange, DurableStoreOperationType } from '@luvio/environments';
import { hasObjectInfoChanges } from '../../storeEval/util';

describe('util', () => {
    describe('hasObjectInfoChanges', () => {
        it('returns false if change is not in default segment', () => {
            const change: DurableStoreChange = {
                ids: ['UiApi::ObjectInfoRepresentation:99399202'],
                type: DurableStoreOperationType.SetEntries,
                segment: 'notDefault',
            };
            expect(hasObjectInfoChanges([change])).toEqual(false);
        });

        it('returns false if change is not setEntries', () => {
            const change: DurableStoreChange = {
                ids: ['UiApi::ObjectInfoRepresentation:99399202'],
                type: DurableStoreOperationType.EvictEntries,
                segment: 'DEFAULT',
            };

            expect(hasObjectInfoChanges([change])).toEqual(false);
        });

        it('returns false if change is not for object info representation', () => {
            const change: DurableStoreChange = {
                ids: ['UiApi::RecordRepresentation:99399202'],
                type: DurableStoreOperationType.SetEntries,
                segment: 'DEFAULT',
            };

            expect(hasObjectInfoChanges([change])).toEqual(false);
        });

        it('returns true if segment is default, type is SetEntries and id is for object info', () => {
            const change: DurableStoreChange = {
                ids: ['UiApi::ObjectInfoRepresentation:99399202'],
                type: DurableStoreOperationType.SetEntries,
                segment: 'DEFAULT',
            };

            const change2: DurableStoreChange = {
                ids: ['UiApi::RecordRepresentation:99399202'],
                type: DurableStoreOperationType.SetEntries,
                segment: 'DEFAULT',
            };

            expect(hasObjectInfoChanges([change, change2])).toEqual(true);
        });
    });
});
