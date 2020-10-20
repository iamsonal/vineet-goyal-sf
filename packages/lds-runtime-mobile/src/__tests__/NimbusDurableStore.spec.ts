import { NimbusDurableStore } from '../NimbusDurableStore';
import {
    MockNimbusDurableStore,
    resetNimbusStoreGlobal,
    mockNimbusStoreGlobal,
} from './MockNimbusDurableStore';
import { JSONStringify } from '../utils/language';
import { DefaultDurableSegment } from '@ldsjs/environments';
describe('nimbus durable store tests', () => {
    afterEach(() => {
        resetNimbusStoreGlobal();
    });

    describe('getEntries', () => {
        it('should return undefined if missing entries', async () => {
            const nimbusStore = new MockNimbusDurableStore();
            mockNimbusStoreGlobal(nimbusStore);
            const durableStore = new NimbusDurableStore();
            const result = await durableStore.getEntries(['missing'], DefaultDurableSegment);
            expect(result).toBeUndefined();
        });
        it('should parse serialized entries', async () => {
            const recordId = 'foo';
            const recordData = { data: { bar: true } };
            const nimbusStore = new MockNimbusDurableStore();
            nimbusStore.kvp[recordId] = JSONStringify(recordData);
            mockNimbusStoreGlobal(nimbusStore);

            const durableStore = new NimbusDurableStore();
            const result = await durableStore.getEntries([recordId], DefaultDurableSegment);
            const entry = result[recordId];
            expect(entry).toEqual(recordData);
            expect(entry.data['bar']).toBe(true);
        });
        it('should return undefined if missing some entries', async () => {
            const nimbusStore = new MockNimbusDurableStore();
            mockNimbusStoreGlobal(nimbusStore);
            const durableStore = new NimbusDurableStore();
            nimbusStore.kvp['present'] = JSONStringify({ data: {} });
            const result = await durableStore.getEntries(
                ['missing', 'present'],
                DefaultDurableSegment
            );
            expect(result).toBeUndefined();
        });
    });

    describe('setEntries', () => {
        it('should stringify entries', async () => {
            const nimbusStore = new MockNimbusDurableStore();
            const setSpy = jest.fn();
            nimbusStore.setEntriesInSegment = setSpy;
            const recordId = 'foo';
            const recordData = { data: { bar: true } };
            mockNimbusStoreGlobal(nimbusStore);

            const durableStore = new NimbusDurableStore();
            const setData = {
                [recordId]: recordData,
            };
            await durableStore.setEntries(setData, DefaultDurableSegment);

            expect(setSpy.mock.calls[0][0][recordId]).toEqual(JSONStringify(recordData));
        });
    });
});
