import { NimbusDurableStore } from '../NimbusDurableStore';
import { Store } from '@ldsjs/engine';
import { ObjectKeys } from '../utils/language';
import {
    resetNimbusStoreGlobal,
    MockNimbusDurableStore,
    mockNimbusStoreGlobal,
} from './MockNimbusDurableStore';
import {
    makeDurableStoreRecordAware,
    DurableRecordRepresentation,
} from '../makeDurableStoreRecordAware';

describe('nimbus durable store tests', () => {
    afterEach(() => {
        resetNimbusStoreGlobal();
    });
    it('should filter out pending record fields', () => {
        const durableStore = new MockNimbusDurableStore();
        const key = 'UiApi::RecordRepresentation:foo';
        const nameKey = 'UiApi::RecordRepresentation:foo__fields__Name';
        const nameValue = {
            displayValue: null,
            value: 'whoops',
        };
        const birthdayValue = {
            pending: true,
        };
        const store = new Store();
        store.records = {
            [key]: {
                id: 'foo',
                weakEtag: 1,
                fields: {
                    Name: {
                        __ref: nameKey,
                    },
                    Birthday: birthdayValue,
                },
            },
            [nameKey]: nameValue,
        };
        mockNimbusStoreGlobal(durableStore);
        const nimbusStore = makeDurableStoreRecordAware(new NimbusDurableStore(), store);
        nimbusStore.setEntries({
            [key]: { data: store.records[key] },
            [nameKey]: { data: store.records[nameKey] },
        });

        expect(ObjectKeys(durableStore.kvp).length).toBe(1);
        const data = durableStore.kvp[key];
        const entry = JSON.parse(data);
        const record = entry.data as DurableRecordRepresentation;
        expect(record.fields['Name'].value).toEqual(nameValue);
        expect(record.fields['Birthday']).toBeUndefined();
    });

    it('setValues should denormalize fields', async () => {
        const durableStore = new MockNimbusDurableStore();
        const setEntriesSpy = jest.fn();
        durableStore.setEntries = setEntriesSpy;
        const key = 'UiApi::RecordRepresentation:foo';
        const nameKey = 'UiApi::RecordRepresentation:foo__fields__Name';
        const nameValue = {
            displayValue: null,
            value: 'whoops',
        };
        const store = new Store();
        store.records = {
            [key]: {
                id: 'foo',
                weakEtag: 1,
                fields: {
                    Name: {
                        __ref: nameKey,
                    },
                },
            },
            [nameKey]: nameValue,
        };
        mockNimbusStoreGlobal(durableStore);
        const nimbusStore = makeDurableStoreRecordAware(new NimbusDurableStore(), store);
        await nimbusStore.setEntries({
            [nameKey]: { data: store.records[nameKey] },
            [key]: { data: store.records[key] },
        });

        const setValue = setEntriesSpy.mock.calls[0][0];
        const setKeys = ObjectKeys(setValue);
        // only one value should be set
        expect(setKeys.length).toBe(1);
        expect(setKeys[0]).toBe(key);
    });

    it('getValues should normalize fields', async () => {
        const durableStore = new MockNimbusDurableStore();
        const key = 'UiApi::RecordRepresentation:foo';
        const nameKey = 'UiApi::RecordRepresentation:foo__fields__Name';
        const nameValue = {
            displayValue: null,
            value: 'whoops',
        };
        const store = new Store();
        store.records = {
            [key]: {
                id: 'foo',
                weakEtag: 1,
                fields: {
                    Name: {
                        __ref: nameKey,
                    },
                },
            },
            [nameKey]: nameValue,
        };
        mockNimbusStoreGlobal(durableStore);
        const nimbusStore = makeDurableStoreRecordAware(new NimbusDurableStore(), store);
        await nimbusStore.setEntries({
            [key]: { data: store.records[key] },
            [nameKey]: { data: store.records[nameKey] },
        });

        const readEntries = await nimbusStore.getEntries([key, nameKey]);
        expect(ObjectKeys(readEntries).length).toBe(2);
    });
});
