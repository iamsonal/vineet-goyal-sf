import { Store } from '@ldsjs/engine';
import {
    DefaultDurableSegment,
    DurableStore,
    OnDurableStoreChangedListener,
} from '@ldsjs/environments';

import { ObjectKeys } from '../../../lds-runtime-mobile/src/utils/language';
import { DraftQueue } from '../DraftQueue';
import { makeDurableStoreDraftAware } from '../makeDurableStoreDraftAware';
import { buildDraftDurableStoreKey, DurableRecordRepresentation } from '../utils/records';
import { DraftDurableSegment } from '../DurableDraftQueue';
import {
    buildDurableRecordRepresentation,
    createDeleteDraftAction,
    createEditDraftAction,
    createPostDraftAction,
    DEFAULT_NAME_FIELD_VALUE,
    DRAFT_RECORD_ID,
    DRAFT_STORE_KEY_FIELD__NAME,
    NAME_VALUE,
    RECORD_ID,
    STORE_KEY_DRAFT_RECORD,
    STORE_KEY_FIELD__NAME,
    STORE_KEY_RECORD,
} from './test-utils';

function setupDraftStore(storeRecords: any = {}) {
    const baseDurableStore: DurableStore = {
        setEntries: jest.fn(),
        getEntries: jest.fn(),
        getAllEntries: jest.fn(),
        evictEntries: jest.fn(),
        registerOnChangedListener: jest.fn(),
    };
    const draftQueue: DraftQueue = {
        enqueue: jest.fn(),
        getActionsForTags: jest.fn(),
        registerDraftQueueCompletedListener: jest.fn(),
        processNextAction: jest.fn(),
    };

    const store = new Store();
    store.records = storeRecords;

    const durableStore = makeDurableStoreDraftAware(baseDurableStore, draftQueue, store);

    return { durableStore, baseDurableStore, draftQueue };
}

describe('makeDurableStoreDraftAware', () => {
    describe('setValues', () => {
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

            const { durableStore, baseDurableStore } = setupDraftStore(storeRecords);
            durableStore.setEntries(
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

            const { durableStore, baseDurableStore } = setupDraftStore(storeRecords);
            durableStore.setEntries(
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

            const { durableStore, baseDurableStore } = setupDraftStore(storeRecords);

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

            const { durableStore, baseDurableStore } = setupDraftStore(storeRecords);

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

        it('does not store draft changes in the durable store', () => {
            const record = {
                id: RECORD_ID,
                weakEtag: 1,
                fields: {
                    Name: {
                        __ref: STORE_KEY_FIELD__NAME,
                    },
                },
                drafts: {
                    edited: true,
                    created: false,
                    deleted: false,
                    serverValues: {
                        Name: { value: 'Jason', displayValue: null },
                    },
                },
            };

            const storeRecords = {
                [STORE_KEY_RECORD]: record,
                [STORE_KEY_FIELD__NAME]: NAME_VALUE,
            };

            const { durableStore, baseDurableStore } = setupDraftStore(storeRecords);
            durableStore.setEntries(
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
            expect(durableRecord.fields['Name'].value).toEqual('Jason');
        });

        it('does not store draft created records', () => {
            const record = {
                id: DRAFT_RECORD_ID,
                weakEtag: -1,
                fields: {
                    Name: {
                        __ref: DRAFT_STORE_KEY_FIELD__NAME,
                    },
                },
                drafts: {
                    edited: false,
                    created: true,
                    deleted: false,
                    serverValues: {},
                },
            };

            const storeRecords = {
                [STORE_KEY_DRAFT_RECORD]: record,
                [DRAFT_STORE_KEY_FIELD__NAME]: NAME_VALUE,
            };

            const { durableStore, baseDurableStore } = setupDraftStore(storeRecords);
            durableStore.setEntries(
                {
                    [STORE_KEY_DRAFT_RECORD]: { data: record },
                    [DRAFT_STORE_KEY_FIELD__NAME]: { data: NAME_VALUE },
                },
                DefaultDurableSegment
            );

            expect(baseDurableStore.setEntries).toBeCalledTimes(1);
            const entries = (baseDurableStore.setEntries as jest.Mock).mock.calls[0][0];
            expect(ObjectKeys(entries).length).toBe(0);
        });

        it('does not store draft node on edited records', () => {
            const record = {
                id: RECORD_ID,
                weakEtag: 1,
                fields: {
                    Name: {
                        __ref: STORE_KEY_FIELD__NAME,
                    },
                },
                drafts: {
                    edited: true,
                    created: false,
                    deleted: false,
                    serverValues: {
                        Name: { value: 'Jason', displayValue: null },
                    },
                },
            };

            const storeRecords = {
                [STORE_KEY_RECORD]: record,
                [STORE_KEY_FIELD__NAME]: NAME_VALUE,
            };

            const { durableStore, baseDurableStore } = setupDraftStore(storeRecords);
            durableStore.setEntries(
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
            expect(durableRecord.drafts).toBe(undefined);
        });

        it('does not store draft node on deleted records', () => {
            const record = {
                id: RECORD_ID,
                weakEtag: 1,
                fields: {
                    Name: {
                        __ref: STORE_KEY_FIELD__NAME,
                    },
                },
                drafts: {
                    edited: false,
                    created: false,
                    deleted: true,
                    serverValues: {},
                },
            };

            const storeRecords = {
                [STORE_KEY_RECORD]: record,
                [STORE_KEY_FIELD__NAME]: NAME_VALUE,
            };

            const { durableStore, baseDurableStore } = setupDraftStore(storeRecords);
            durableStore.setEntries(
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
            expect(durableRecord.drafts).toBe(undefined);
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

            const { durableStore, baseDurableStore } = setupDraftStore(storeRecords);

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

    describe('getValues', () => {
        it('should normalize fields', async () => {
            const durableRecord = buildDurableRecordRepresentation(RECORD_ID, { Name: NAME_VALUE });

            const { durableStore, baseDurableStore, draftQueue } = setupDraftStore({});
            draftQueue.getActionsForTags = jest.fn().mockResolvedValue({ [STORE_KEY_RECORD]: [] });
            baseDurableStore.getEntries = jest
                .fn()
                .mockResolvedValue({ [STORE_KEY_RECORD]: { data: durableRecord } });

            const readEntries = await durableStore.getEntries(
                [STORE_KEY_RECORD],
                DefaultDurableSegment
            );
            expect(ObjectKeys(readEntries).length).toBe(2);
        });

        it('should overlay draft edits', async () => {
            const durableRecord = buildDurableRecordRepresentation(RECORD_ID, { Name: NAME_VALUE });

            const { durableStore, baseDurableStore, draftQueue } = setupDraftStore();
            draftQueue.getActionsForTags = jest.fn().mockResolvedValue({
                [STORE_KEY_RECORD]: [createEditDraftAction(RECORD_ID, STORE_KEY_RECORD)],
            });
            baseDurableStore.getEntries = jest
                .fn()
                .mockResolvedValue({ [STORE_KEY_RECORD]: { data: durableRecord } });

            const readEntries = await durableStore.getEntries(
                [STORE_KEY_RECORD],
                DefaultDurableSegment
            );
            expect(ObjectKeys(readEntries).length).toBe(2);
            const nameField = readEntries[STORE_KEY_FIELD__NAME].data;
            const readRecord = readEntries[STORE_KEY_RECORD].data;

            expect(readRecord.drafts.edited).toBe(true);
            expect(nameField.value).toEqual(DEFAULT_NAME_FIELD_VALUE);
            expect(nameField.displayValue).toEqual(DEFAULT_NAME_FIELD_VALUE);
            expect(readRecord.drafts.serverValues.Name).toEqual(NAME_VALUE);
        });

        it('should return draft creates', async () => {
            const { durableStore, baseDurableStore, draftQueue } = setupDraftStore();
            draftQueue.getActionsForTags = jest.fn().mockResolvedValue({
                [STORE_KEY_DRAFT_RECORD]: [createPostDraftAction(STORE_KEY_DRAFT_RECORD)],
            });
            baseDurableStore.getEntries = jest.fn().mockResolvedValue(undefined);

            const readEntries = await durableStore.getEntries(
                [STORE_KEY_DRAFT_RECORD],
                DefaultDurableSegment
            );
            expect(ObjectKeys(readEntries).length).toBe(2);
            const nameField = readEntries[DRAFT_STORE_KEY_FIELD__NAME].data;
            const readRecord = readEntries[STORE_KEY_DRAFT_RECORD].data;

            expect(readRecord.drafts.created).toBe(true);
            expect(nameField.value).toEqual(DEFAULT_NAME_FIELD_VALUE);
            expect(nameField.displayValue).toEqual(DEFAULT_NAME_FIELD_VALUE);
        });

        it('should overlay draft deletes', async () => {
            const durableRecord = buildDurableRecordRepresentation(RECORD_ID, { Name: NAME_VALUE });

            const { durableStore, baseDurableStore, draftQueue } = setupDraftStore();
            draftQueue.getActionsForTags = jest.fn().mockResolvedValue({
                [STORE_KEY_RECORD]: [createDeleteDraftAction(RECORD_ID, STORE_KEY_RECORD)],
            });
            baseDurableStore.getEntries = jest
                .fn()
                .mockResolvedValue({ [STORE_KEY_RECORD]: { data: durableRecord } });

            const readEntries = await durableStore.getEntries(
                [STORE_KEY_RECORD],
                DefaultDurableSegment
            );
            expect(ObjectKeys(readEntries).length).toBe(2);
            const nameField = readEntries[STORE_KEY_FIELD__NAME].data;
            const readRecord = readEntries[STORE_KEY_RECORD].data;
            expect(readRecord.drafts.deleted).toBe(true);
            expect(nameField).toEqual(NAME_VALUE);
        });

        it('should overlay subsequent draft actions after a draft create', async () => {
            const { durableStore, baseDurableStore, draftQueue } = setupDraftStore();
            const editedNameField = 'ACME UPDATED';

            draftQueue.getActionsForTags = jest.fn().mockResolvedValue({
                [STORE_KEY_DRAFT_RECORD]: [
                    createPostDraftAction(STORE_KEY_DRAFT_RECORD),
                    createEditDraftAction(DRAFT_RECORD_ID, STORE_KEY_DRAFT_RECORD, editedNameField),
                ],
            });
            baseDurableStore.getEntries = jest.fn().mockResolvedValue(undefined);

            const readEntries = await durableStore.getEntries(
                [STORE_KEY_DRAFT_RECORD],
                DefaultDurableSegment
            );
            expect(ObjectKeys(readEntries).length).toBe(2);
            const nameField = readEntries[DRAFT_STORE_KEY_FIELD__NAME].data;
            const readRecord = readEntries[STORE_KEY_DRAFT_RECORD].data;

            expect(readRecord.drafts.created).toBe(true);
            expect(readRecord.drafts.edited).toBe(true);
            expect(nameField.value).toEqual(editedNameField);
            expect(nameField.displayValue).toEqual(editedNameField);
        });

        it('should overlay subsequent actions after a draft edit', async () => {
            const { durableStore, baseDurableStore, draftQueue } = setupDraftStore();
            const edit1 = 'ACME edit1';
            const edit2 = 'ACME edit2';
            const durableRecord = buildDurableRecordRepresentation(RECORD_ID, {
                Name: NAME_VALUE,
            });

            draftQueue.getActionsForTags = jest.fn().mockResolvedValue({
                [STORE_KEY_RECORD]: [
                    createEditDraftAction(RECORD_ID, STORE_KEY_RECORD, edit1),
                    createEditDraftAction(RECORD_ID, STORE_KEY_RECORD, edit2),
                ],
            });
            baseDurableStore.getEntries = jest
                .fn()
                .mockResolvedValue({ [STORE_KEY_RECORD]: { data: durableRecord } });

            const readEntries = await durableStore.getEntries(
                [STORE_KEY_RECORD],
                DefaultDurableSegment
            );
            expect(ObjectKeys(readEntries).length).toBe(2);
            const nameField = readEntries[STORE_KEY_FIELD__NAME].data;
            const readRecord = readEntries[STORE_KEY_RECORD].data;

            expect(readRecord.drafts.edited).toBe(true);
            expect(nameField.value).toEqual(edit2);
            expect(nameField.displayValue).toEqual(edit2);
            expect(readRecord.drafts.serverValues.Name).toEqual(NAME_VALUE);
        });

        it('does not overlay if no draft present for record', async () => {
            const durableRecord = buildDurableRecordRepresentation(RECORD_ID, {
                Name: NAME_VALUE,
            });

            const { durableStore, baseDurableStore, draftQueue } = setupDraftStore();
            draftQueue.getActionsForTags = jest.fn().mockResolvedValue({});
            baseDurableStore.getEntries = jest
                .fn()
                .mockResolvedValue({ [STORE_KEY_RECORD]: { data: durableRecord } });

            const readEntries = await durableStore.getEntries(
                [STORE_KEY_RECORD],
                DefaultDurableSegment
            );
            expect(ObjectKeys(readEntries).length).toBe(2);
            const nameField = readEntries[STORE_KEY_FIELD__NAME].data;
            const readRecord = readEntries[STORE_KEY_RECORD].data;

            expect(readRecord.drafts).toBeUndefined();
            expect(nameField).toEqual(NAME_VALUE);
        });

        it('should return undefined if a value is missing in durable store with draft queue empty', async () => {
            const { durableStore, baseDurableStore, draftQueue } = setupDraftStore();

            draftQueue.getActionsForTags = jest.fn().mockResolvedValue({});
            baseDurableStore.getEntries = jest.fn().mockResolvedValue(undefined);

            const readEntries = await durableStore.getEntries(
                ['SOME_MISSING_KEY'],
                DefaultDurableSegment
            );
            expect(readEntries).toBeUndefined();
        });

        it('should return undefined if a value is missing in durable store with a draft create present', async () => {
            const { durableStore, baseDurableStore, draftQueue } = setupDraftStore();

            draftQueue.getActionsForTags = jest.fn().mockResolvedValue({
                [STORE_KEY_DRAFT_RECORD]: [createPostDraftAction(STORE_KEY_DRAFT_RECORD)],
            });
            baseDurableStore.getEntries = jest.fn().mockResolvedValue(undefined);

            const readEntries = await durableStore.getEntries(
                [STORE_KEY_DRAFT_RECORD, 'SOME_MISSING_KEY'],
                DefaultDurableSegment
            );
            expect(readEntries).toBeUndefined();
        });
    });

    describe('registerOnChangeListener', () => {
        it('draft action changes notify affected record change', done => {
            let changeListener;
            const durableStore: DurableStore = makeDurableStoreDraftAware(
                {
                    registerOnChangedListener: listener => (changeListener = listener),
                } as any,
                {} as any,
                {} as any
            );

            const draftActionKey = buildDraftDurableStoreKey(STORE_KEY_RECORD, 'FOO');
            const baseListener: OnDurableStoreChangedListener = (
                ids: {
                    [key: string]: boolean;
                },
                segment: string
            ) => {
                expect(ids[STORE_KEY_RECORD]).toBe(true);
                expect(segment).toBe(DefaultDurableSegment);
                done();
            };
            durableStore.registerOnChangedListener(baseListener);
            changeListener({ [draftActionKey]: true }, DraftDurableSegment);
        });

        it('only changes to draft action segment are parsed', done => {
            let changeListener;
            const durableStore: DurableStore = makeDurableStoreDraftAware(
                {
                    registerOnChangedListener: listener => (changeListener = listener),
                } as any,
                {} as any,
                {} as any
            );

            const draftActionKey = buildDraftDurableStoreKey(STORE_KEY_RECORD, 'FOO');
            const baseListener: OnDurableStoreChangedListener = (ids: {
                [key: string]: boolean;
            }) => {
                expect(ids[draftActionKey]).toBe(true);
                done();
            };
            durableStore.registerOnChangedListener(baseListener);
            changeListener({ [draftActionKey]: true }, 'NOT_DRAFT_SEGMENT');
        });

        it('only changes to draft action keys in the draft segment are parsed', done => {
            let changeListener;
            const durableStore: DurableStore = makeDurableStoreDraftAware(
                {
                    registerOnChangedListener: listener => (changeListener = listener),
                } as any,
                {} as any,
                {} as any
            );
            const baseListener: OnDurableStoreChangedListener = (ids: {
                [key: string]: boolean;
            }) => {
                expect(ids[STORE_KEY_RECORD]).toBe(true);
                done();
            };
            durableStore.registerOnChangedListener(baseListener);
            changeListener({ [STORE_KEY_RECORD]: true }, DraftDurableSegment);
        });
    });
});
