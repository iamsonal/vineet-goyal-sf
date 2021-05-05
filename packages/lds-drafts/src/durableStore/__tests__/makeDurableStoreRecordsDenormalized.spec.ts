import { Store } from '@luvio/engine';
import { DefaultDurableSegment, DurableStore } from '@luvio/environments';

import {
    buildDurableRecordRepresentation,
    NAME_VALUE,
    RECORD_ID,
    STORE_KEY_RECORD,
    STORE_KEY_FIELD__NAME,
} from '../../__tests__/test-utils';
import { ObjectKeys } from '../../utils/language';
import { makeRecordDenormalizingDurableStore } from '../makeRecordDenormalizingDurableStore';
import { DurableRecordRepresentation } from '../../utils/records';

function setupRecordStore(storeRecords: any = {}) {
    const baseDurableStore: DurableStore = {
        setEntries: jest.fn(),
        getEntries: jest.fn(),
        getAllEntries: jest.fn(),
        evictEntries: jest.fn(),
        registerOnChangedListener: jest.fn(),
        batchOperations: jest.fn(),
    };

    const store = new Store();
    store.records = storeRecords;

    const durableStore = makeRecordDenormalizingDurableStore(baseDurableStore, store);

    return { durableStore, baseDurableStore };
}

describe('makeRecordDenormalizingDurableStore', () => {
    describe('setEntries', () => {
        describe('record denormalization', () => {
            it('should denormalize fields', async () => {
                const record = {
                    id: RECORD_ID,
                    weakEtag: 1,
                    fields: {
                        Name: {
                            __ref: STORE_KEY_FIELD__NAME,
                        },
                    },
                };

                const storeRecords = {
                    [STORE_KEY_RECORD]: record,
                    [STORE_KEY_FIELD__NAME]: NAME_VALUE,
                };

                const { durableStore, baseDurableStore } = setupRecordStore(storeRecords);
                durableStore.setEntries<any>(
                    {
                        [STORE_KEY_RECORD]: { data: record },
                        [STORE_KEY_FIELD__NAME]: { data: NAME_VALUE },
                    },
                    DefaultDurableSegment
                );

                const entries = (baseDurableStore.setEntries as jest.Mock).mock.calls[0][0];

                // only one entry should be set since the fields should have been denormalized into the record
                expect(ObjectKeys(entries).length).toBe(1);

                // expect store entry to be denormalized
                expect(entries[STORE_KEY_RECORD].data).toEqual({
                    id: RECORD_ID,
                    weakEtag: 1,
                    fields: { Name: NAME_VALUE },
                    links: {
                        Name: { __ref: STORE_KEY_FIELD__NAME },
                    },
                });
            });

            it('should handle refs', () => {
                const nameKey = 'UiApi::RecordRepresentation:001xx000003Gn4WAAS__fields__Name';
                const ownerKey = 'UiApi::RecordRepresentation:001xx000003Gn4WAAS__fields__Owner';
                const recordRefKey = 'UiApi::RecordRepresentation:foo2';
                const recordRefNameKey = 'UiApi::RecordRepresentation:foo2__fields__Name';

                const record = {
                    data: {
                        fields: {
                            Name: {
                                __ref: nameKey,
                            },
                            Owner: {
                                __ref: ownerKey,
                            },
                        },
                        id: RECORD_ID,
                        weakEtag: 1,
                    },
                };
                const refRecord = {
                    data: {
                        id: 'foo2',
                        weakEtag: 1,
                        fields: {
                            Name: {
                                __ref: recordRefNameKey,
                            },
                        },
                    },
                };

                const store = {
                    [STORE_KEY_RECORD]: record,
                    [nameKey]: {
                        value: 'Justin',
                        displayValue: '',
                    },
                    [ownerKey]: {
                        __ref: recordRefKey,
                    },

                    [recordRefKey]: refRecord,
                    [recordRefNameKey]: {
                        value: 'Jason',
                        displayValue: '',
                    },
                };
                const { durableStore, baseDurableStore } = setupRecordStore(store);

                durableStore.setEntries<any>(
                    {
                        [STORE_KEY_RECORD]: record,
                    },
                    DefaultDurableSegment
                );

                const entries = (baseDurableStore.setEntries as jest.Mock).mock.calls[0][0];
                const setRecord = entries[STORE_KEY_RECORD].data;
                expect(setRecord.fields.Owner.__ref).toEqual(recordRefKey);
                expect(setRecord.links.Owner.__ref).toEqual(ownerKey);
            });

            it('should filter out pending record fields', () => {
                const record = {
                    id: RECORD_ID,
                    weakEtag: 1,
                    fields: {
                        Name: {
                            __ref: STORE_KEY_FIELD__NAME,
                        },
                        Birthday: {
                            pending: true,
                        },
                    },
                };

                const storeRecords = {
                    [STORE_KEY_RECORD]: record,
                    [STORE_KEY_FIELD__NAME]: NAME_VALUE,
                };

                const { durableStore, baseDurableStore } = setupRecordStore(storeRecords);
                durableStore.setEntries<any>(
                    {
                        [STORE_KEY_RECORD]: { data: record },
                        [STORE_KEY_FIELD__NAME]: { data: NAME_VALUE },
                    },
                    DefaultDurableSegment
                );

                expect(baseDurableStore.setEntries).toBeCalledTimes(1);
                const entries = (baseDurableStore.setEntries as jest.Mock).mock.calls[0][0];
                const entry = entries[STORE_KEY_RECORD];
                const durableRecord = entry.data as DurableRecordRepresentation;
                expect(durableRecord.fields['Name'].value).toEqual(NAME_VALUE.value);
                expect(durableRecord.fields['Birthday']).toBeUndefined();
            });

            it('includes missing nodes with the record', () => {
                const record = {
                    id: RECORD_ID,
                    weakEtag: 1,
                    fields: {
                        Name: {
                            __ref: STORE_KEY_FIELD__NAME,
                        },
                        Birthday: {
                            __ref: undefined,
                            isMissing: true,
                        },
                    },
                };

                const storeRecords = {
                    [STORE_KEY_RECORD]: record,
                    [STORE_KEY_FIELD__NAME]: NAME_VALUE,
                };

                const { durableStore, baseDurableStore } = setupRecordStore(storeRecords);
                durableStore.setEntries<any>(
                    {
                        [STORE_KEY_RECORD]: { data: record },
                        [STORE_KEY_FIELD__NAME]: { data: NAME_VALUE },
                    },
                    DefaultDurableSegment
                );

                expect(baseDurableStore.setEntries).toBeCalledTimes(1);
                const entries = (baseDurableStore.setEntries as jest.Mock).mock.calls[0][0];
                const entry = entries[STORE_KEY_RECORD];
                const durableRecord = entry.data as DurableRecordRepresentation;
                expect(durableRecord.fields['Name'].value).toEqual(NAME_VALUE.value);
                expect(durableRecord.fields['Birthday']).toBeUndefined();
                expect(durableRecord.links['Name']).toEqual({
                    __ref: 'UiApi::RecordRepresentation:001xx000003Gn4WAAS__fields__Name',
                });
                expect(durableRecord.links['Birthday']).toEqual({
                    __ref: undefined,
                    isMissing: true,
                });
            });

            it('writes the entire denormalized record when setting a single field', () => {
                const record = {
                    id: RECORD_ID,
                    weakEtag: 1,
                    fields: {
                        Name: {
                            __ref: STORE_KEY_FIELD__NAME,
                        },
                    },
                };

                const storeRecords = {
                    [STORE_KEY_RECORD]: record,
                    [STORE_KEY_FIELD__NAME]: NAME_VALUE,
                };

                const { durableStore, baseDurableStore } = setupRecordStore(storeRecords);

                // set just the name field
                durableStore.setEntries(
                    {
                        [STORE_KEY_FIELD__NAME]: { data: NAME_VALUE },
                    },
                    DefaultDurableSegment
                );

                expect(baseDurableStore.setEntries).toBeCalledTimes(1);
                const entries = (baseDurableStore.setEntries as jest.Mock).mock.calls[0][0];

                // only the denormalized record should be put
                expect(ObjectKeys(entries).length).toBe(1);
                const entry = entries[STORE_KEY_RECORD];
                const durableRecord = entry.data as DurableRecordRepresentation;
                expect(durableRecord.id).toBe(RECORD_ID);
                expect(durableRecord.fields.Name.value).toBe(NAME_VALUE.value);
            });

            it('does not write the record when a field is missing from the store', () => {
                // simulate production
                process.env.NODE_ENV = 'production';
                const record = {
                    id: RECORD_ID,
                    weakEtag: 1,
                    fields: {
                        Name: {
                            __ref: STORE_KEY_FIELD__NAME,
                        },
                    },
                };

                // dont have name field in the store
                const storeRecords = {
                    [STORE_KEY_RECORD]: record,
                };

                const { durableStore, baseDurableStore } = setupRecordStore(storeRecords);

                // set just the name field
                durableStore.setEntries(
                    {
                        [STORE_KEY_RECORD]: { data: record },
                    },
                    DefaultDurableSegment
                );

                expect(baseDurableStore.setEntries).toBeCalledTimes(1);
                const entries = (baseDurableStore.setEntries as jest.Mock).mock.calls[0][0];

                // no entries should get set
                expect(ObjectKeys(entries).length).toBe(0);
            });

            it('handles when record is a 404', async () => {
                const record404 = {
                    __type: 'error',
                    status: 404,
                    error: {
                        statusText: 'Not Found',
                        status: 404,
                        body: null,
                        headers: {},
                        ok: false,
                    },
                };

                const storeRecords = {
                    [STORE_KEY_RECORD]: record404,
                };

                const { durableStore, baseDurableStore } = setupRecordStore(storeRecords);

                // set just the name field
                durableStore.setEntries(
                    {
                        [STORE_KEY_RECORD]: { data: record404 },
                    },
                    DefaultDurableSegment
                );

                expect(baseDurableStore.setEntries).toBeCalledTimes(1);
                const entries = (baseDurableStore.setEntries as jest.Mock).mock.calls[0][0];

                // only the denormalized record should be put
                expect(ObjectKeys(entries).length).toBe(1);
                const entry = entries[STORE_KEY_RECORD];
                expect(entry.data).toStrictEqual(record404);
            });
        });
    });

    describe('getEntries', () => {
        it('should normalize fields', async () => {
            const durableRecord = buildDurableRecordRepresentation(RECORD_ID, { Name: NAME_VALUE });

            const { durableStore, baseDurableStore } = setupRecordStore({});
            baseDurableStore.getEntries = jest
                .fn()
                .mockResolvedValue({ [STORE_KEY_RECORD]: { data: durableRecord } });

            const readEntries = await durableStore.getEntries(
                [STORE_KEY_RECORD],
                DefaultDurableSegment
            );
            expect(ObjectKeys(readEntries).length).toBe(2);
        });

        it('should handle refs properly', async () => {
            const { durableStore, baseDurableStore } = setupRecordStore({});

            const nameKey = 'UiApi::RecordRepresentation:001xx000003Gn4WAAS__fields__Name';
            const ownerKey = 'UiApi::RecordRepresentation:001xx000003Gn4WAAS__fields__Owner';
            const recordRefKey = 'UiApi::RecordRepresentation:foo2';
            const recordRefNameKey = 'UiApi::RecordRepresentation:foo2__fields__Name';

            const ds = {
                [STORE_KEY_RECORD]: {
                    data: {
                        fields: {
                            Name: {
                                value: 'Justin',
                                displayValue: '',
                            },
                            Owner: {
                                __ref: recordRefKey,
                            },
                        },
                        id: RECORD_ID,
                        links: {
                            Name: {
                                __ref: nameKey,
                            },
                            Owner: {
                                __ref: ownerKey,
                            },
                        },
                        weakEtag: 1,
                    },
                },
                [recordRefKey]: {
                    data: {
                        id: 'foo2',
                        weakEtag: 1,
                        fields: {
                            Name: {
                                value: 'Jason',
                                displayValue: '',
                            },
                        },
                        links: {
                            Name: {
                                __ref: recordRefNameKey,
                            },
                        },
                    },
                },
            };

            baseDurableStore.getEntries = jest.fn().mockResolvedValue(ds);

            const readEntries = await durableStore.getEntries<any>(
                [STORE_KEY_RECORD, recordRefKey],
                DefaultDurableSegment
            );

            expect(ObjectKeys(readEntries).length).toBe(5);
            const record = readEntries[STORE_KEY_RECORD].data;
            expect(record.fields.Owner.__ref).toEqual(ownerKey);
            const owner = readEntries[ownerKey].data;
            expect(owner.__ref).toEqual(recordRefKey);
        });

        it('should not request fields', async () => {
            const durableRecord = buildDurableRecordRepresentation(RECORD_ID, { Name: NAME_VALUE });

            const { durableStore, baseDurableStore } = setupRecordStore({});
            const getSpy = jest.fn();
            getSpy.mockResolvedValue({ [STORE_KEY_RECORD]: { data: durableRecord } });
            baseDurableStore.getEntries = getSpy;

            await durableStore.getEntries(
                [STORE_KEY_RECORD, STORE_KEY_FIELD__NAME],
                DefaultDurableSegment
            );
            expect(getSpy.mock.calls[0][0]).toEqual([STORE_KEY_RECORD]);
        });

        it('does not normalize fields of errors', async () => {
            const record404 = {
                __type: 'error',
                status: 404,
                error: {
                    statusText: 'Not Found',
                    status: 404,
                    body: null,
                    headers: {},
                    ok: false,
                },
            };

            const { durableStore, baseDurableStore } = setupRecordStore({});
            baseDurableStore.getEntries = jest
                .fn()
                .mockResolvedValue({ [STORE_KEY_RECORD]: { data: record404 } });

            const entries = await durableStore.getEntries(
                [STORE_KEY_RECORD],
                DefaultDurableSegment
            );

            const entry = entries[STORE_KEY_RECORD];
            expect(entry.data).toStrictEqual(record404);
        });

        it('should restore missing link markers', async () => {
            const durableRecord = buildDurableRecordRepresentation(RECORD_ID, { Name: NAME_VALUE });
            durableRecord.links['Birthday'] = {
                isMissing: true,
            };

            const { durableStore, baseDurableStore } = setupRecordStore({});
            baseDurableStore.getEntries = jest
                .fn()
                .mockResolvedValue({ [STORE_KEY_RECORD]: { data: durableRecord } });

            const readEntries = await durableStore.getEntries<any>(
                [STORE_KEY_RECORD],
                DefaultDurableSegment
            );
            expect(ObjectKeys(readEntries).length).toBe(2);
            const missingField =
                readEntries['UiApi::RecordRepresentation:001xx000003Gn4WAAS'].data.fields[
                    'Birthday'
                ];
            expect(missingField).toBeDefined();
            expect(missingField.isMissing).toBe(true);
            expect(Object.prototype.hasOwnProperty.call(missingField, '__ref')).toBe(true);
        });
    });
});
