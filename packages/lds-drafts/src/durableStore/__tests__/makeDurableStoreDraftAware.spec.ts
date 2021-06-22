import {
    DurableStore,
    DurableStoreOperation,
    DurableStoreOperationType,
} from '@luvio/environments';

import { DraftAction, DraftActionMap, DraftActionStatus } from '../../DraftQueue';
import { makeDurableStoreDraftAware } from '../makeDurableStoreDraftAware';
import { buildDraftDurableStoreKey } from '../../utils/records';
import {
    buildDurableRecordRepresentation,
    createDeleteDraftAction,
    createEditDraftAction,
    createPostDraftAction,
    DEFAULT_NAME_FIELD_VALUE,
    DRAFT_RECORD_ID,
    NAME_VALUE,
    RECORD_ID,
    STORE_KEY_DRAFT_RECORD,
    STORE_KEY_RECORD,
    CURRENT_USER_ID,
} from '../../__tests__/test-utils';
import { DRAFT_SEGMENT } from '../../DurableDraftQueue';
import { CustomActionData } from '../../actionHandlers/CustomActionHandler';
import { ObjectKeys } from '../../utils/language';

function setupDraftStore(draftActions: DraftActionMap) {
    const baseDurableStore: DurableStore = {
        setEntries: jest.fn(),
        getEntries: jest.fn(),
        getAllEntries: jest.fn(),
        evictEntries: jest.fn(),
        registerOnChangedListener: jest.fn(),
        batchOperations: jest.fn(),
    };

    const durableStore = makeDurableStoreDraftAware(
        baseDurableStore,
        jest.fn().mockResolvedValue(draftActions),
        CURRENT_USER_ID
    );

    return { durableStore, baseDurableStore };
}

describe('makeDurableStoreDraftAware', () => {
    describe('setEntries', () => {
        describe('draft evaluation', () => {
            it('writes a synthetic record when post action is written', async () => {
                const durableRecord = buildDurableRecordRepresentation(RECORD_ID, {
                    Name: NAME_VALUE,
                });
                const createAction = createPostDraftAction(STORE_KEY_DRAFT_RECORD, DRAFT_RECORD_ID);
                durableRecord.drafts = {
                    created: true,
                    edited: false,
                    deleted: false,
                    serverValues: {},
                    draftActionIds: [createAction.id],
                };

                const { durableStore, baseDurableStore } = setupDraftStore({
                    [STORE_KEY_DRAFT_RECORD]: [createAction],
                });
                const setEntriesSpy = jest.fn();

                baseDurableStore.setEntries = setEntriesSpy.mockResolvedValue(undefined);
                baseDurableStore.getEntries = jest
                    .fn()
                    .mockResolvedValue({ [STORE_KEY_DRAFT_RECORD]: { data: durableRecord } });

                await durableStore.setEntries<any>(
                    {
                        [buildDraftDurableStoreKey(createAction.tag, createAction.id)]: {
                            data: createAction,
                        },
                    },
                    DRAFT_SEGMENT
                );

                expect(setEntriesSpy.mock.calls.length).toBe(3);

                const storedRecord = setEntriesSpy.mock.calls[2][0][STORE_KEY_DRAFT_RECORD].data;

                expect(storedRecord.drafts.created).toBe(true);
                expect(storedRecord.fields.Name.value).toEqual(DEFAULT_NAME_FIELD_VALUE);
                expect(storedRecord.fields.Name.displayValue).toEqual(DEFAULT_NAME_FIELD_VALUE);
            });

            it('persistDraftCreates not called on the records which are drafts in post action', async () => {
                const durableRecord = buildDurableRecordRepresentation(RECORD_ID, {
                    Name: NAME_VALUE,
                });
                const customAction: DraftAction<unknown, CustomActionData> = {
                    data: { mock: 'data' },
                    handler: 'CUSTOM',
                    id: '12345',
                    tag: '1234',
                    metadata: {},
                    targetId: '1234',
                    status: DraftActionStatus.Pending,
                    timestamp: Date.now(),
                };

                const { durableStore, baseDurableStore } = setupDraftStore({
                    [STORE_KEY_DRAFT_RECORD]: [customAction],
                });
                const setEntriesSpy = jest.fn();

                baseDurableStore.setEntries = setEntriesSpy.mockResolvedValue(undefined);
                baseDurableStore.getEntries = jest.fn().mockResolvedValue({
                    [STORE_KEY_DRAFT_RECORD]: { data: durableRecord },
                });

                await durableStore.setEntries<any>(
                    {
                        [buildDraftDurableStoreKey(customAction.tag, customAction.id)]: {
                            data: customAction,
                        },
                    },
                    DRAFT_SEGMENT
                );

                expect(setEntriesSpy.mock.calls.length).toBe(1);
                expect(setEntriesSpy.mock.calls[0][1]).toBe('DRAFT');
                const customData = setEntriesSpy.mock.calls[0][0]['1234__DraftAction__12345'].data;
                expect(customData.data).toStrictEqual({ mock: 'data' });
            });

            it('only calls persistDraftCreates on the LDS Action', async () => {
                const durableRecord = buildDurableRecordRepresentation(RECORD_ID, {
                    Name: NAME_VALUE,
                });
                const createAction = createPostDraftAction(STORE_KEY_DRAFT_RECORD, DRAFT_RECORD_ID);
                durableRecord.drafts = {
                    created: true,
                    edited: false,
                    deleted: false,
                    serverValues: {},
                    draftActionIds: [createAction.id],
                };
                const customAction: DraftAction<unknown, CustomActionData> = {
                    data: {
                        mock: 'data',
                    },
                    handler: 'CUSTOM',
                    id: '12345',
                    tag: 'Action::12345',
                    metadata: {},
                    targetId: '1234',
                    status: DraftActionStatus.Pending,
                    timestamp: Date.now(),
                };

                const { durableStore, baseDurableStore } = setupDraftStore({
                    [STORE_KEY_DRAFT_RECORD]: [createAction],
                    [customAction.tag]: [customAction],
                });
                const setEntriesSpy = jest.fn();

                baseDurableStore.setEntries = setEntriesSpy.mockResolvedValue(undefined);
                baseDurableStore.getEntries = jest.fn().mockResolvedValue({
                    [STORE_KEY_DRAFT_RECORD]: {
                        data: durableRecord,
                    },
                });

                await durableStore.setEntries<any>(
                    {
                        [buildDraftDurableStoreKey(createAction.tag, createAction.id)]: {
                            data: createAction,
                        },
                        [buildDraftDurableStoreKey(customAction.tag, customAction.id)]: {
                            data: customAction,
                        },
                    },
                    DRAFT_SEGMENT
                );

                expect(setEntriesSpy.mock.calls.length).toBe(3);

                //the persistDraftCreates only called with record
                expect(ObjectKeys(setEntriesSpy.mock.calls[2][0])).toStrictEqual([
                    STORE_KEY_DRAFT_RECORD,
                ]);
            });

            it('updates the record when an edit action is written', async () => {
                const durableRecord = buildDurableRecordRepresentation(RECORD_ID, {
                    Name: NAME_VALUE,
                });
                const editAction = createEditDraftAction(RECORD_ID, STORE_KEY_RECORD);

                const { durableStore, baseDurableStore } = setupDraftStore({
                    [STORE_KEY_RECORD]: [editAction],
                });
                const setEntriesSpy = jest.fn();

                baseDurableStore.setEntries = setEntriesSpy.mockResolvedValue(undefined);
                baseDurableStore.getEntries = jest
                    .fn()
                    .mockResolvedValue({ [STORE_KEY_RECORD]: { data: durableRecord } });

                await durableStore.setEntries<any>(
                    {
                        [buildDraftDurableStoreKey(editAction.tag, editAction.id)]: {
                            data: editAction,
                        },
                    },
                    DRAFT_SEGMENT
                );

                expect(setEntriesSpy.mock.calls.length).toBe(2);

                const storedRecord = setEntriesSpy.mock.calls[1][0][STORE_KEY_RECORD].data;

                expect(storedRecord.drafts.edited).toBe(true);
                expect(storedRecord.fields.Name.value).toEqual(DEFAULT_NAME_FIELD_VALUE);
                expect(storedRecord.fields.Name.displayValue).toEqual(DEFAULT_NAME_FIELD_VALUE);
                expect(storedRecord.drafts.serverValues.Name).toEqual(NAME_VALUE);
            });

            it('does not attempt to resolve drafts against an error', async () => {
                const editAction = createEditDraftAction(RECORD_ID, STORE_KEY_RECORD);

                const { durableStore, baseDurableStore } = setupDraftStore({
                    [STORE_KEY_RECORD]: [editAction],
                });
                const setEntriesSpy = jest.fn();

                baseDurableStore.setEntries = setEntriesSpy.mockResolvedValue(undefined);
                baseDurableStore.getEntries = jest.fn().mockResolvedValue({
                    [STORE_KEY_RECORD]: { data: { __type: 'error', status: 400 } },
                });

                await durableStore.setEntries<any>(
                    {
                        [buildDraftDurableStoreKey(editAction.tag, editAction.id)]: {
                            data: editAction,
                        },
                    },
                    DRAFT_SEGMENT
                );

                // there should be no writes to the default segment
                expect(setEntriesSpy).toBeCalledTimes(1);
                expect(setEntriesSpy.mock.calls[0][1]).toBe(DRAFT_SEGMENT);
            });

            it('updates the record when a delete action is written', async () => {
                const durableRecord = buildDurableRecordRepresentation(RECORD_ID, {
                    Name: NAME_VALUE,
                });
                const deleteAction = createDeleteDraftAction(RECORD_ID, STORE_KEY_RECORD);

                const { durableStore, baseDurableStore } = setupDraftStore({
                    [STORE_KEY_RECORD]: [deleteAction],
                });
                const setEntriesSpy = jest.fn();

                baseDurableStore.setEntries = setEntriesSpy.mockResolvedValue(undefined);
                baseDurableStore.getEntries = jest
                    .fn()
                    .mockResolvedValue({ [STORE_KEY_RECORD]: { data: durableRecord } });

                await durableStore.setEntries<any>(
                    {
                        [buildDraftDurableStoreKey(deleteAction.tag, deleteAction.id)]: {
                            data: deleteAction,
                        },
                    },
                    DRAFT_SEGMENT
                );

                expect(setEntriesSpy.mock.calls.length).toBe(2);

                const storedRecord = setEntriesSpy.mock.calls[1][0][STORE_KEY_RECORD].data;

                expect(storedRecord.drafts.deleted).toBe(true);
            });

            it('updates a record that was synthetically created', async () => {
                const updatedName = 'Foobar';
                const durableRecord = buildDurableRecordRepresentation(RECORD_ID, {
                    Name: NAME_VALUE,
                });
                const createAction = createPostDraftAction(STORE_KEY_DRAFT_RECORD, DRAFT_RECORD_ID);
                const updateAction = createEditDraftAction(
                    DRAFT_RECORD_ID,
                    STORE_KEY_DRAFT_RECORD,
                    updatedName
                );
                durableRecord.drafts = {
                    created: true,
                    edited: true,
                    deleted: false,
                    serverValues: {},
                    draftActionIds: [createAction.id, updateAction.id],
                };

                const { durableStore, baseDurableStore } = setupDraftStore({
                    [STORE_KEY_DRAFT_RECORD]: [createAction, updateAction],
                });
                const setEntriesSpy = jest.fn();

                baseDurableStore.setEntries = setEntriesSpy.mockResolvedValue(undefined);
                baseDurableStore.getEntries = jest
                    .fn()
                    .mockResolvedValue({ [STORE_KEY_DRAFT_RECORD]: { data: durableRecord } });

                await durableStore.setEntries<any>(
                    {
                        [buildDraftDurableStoreKey(createAction.tag, createAction.id)]: {
                            data: createAction,
                        },
                        [buildDraftDurableStoreKey(updateAction.tag, updateAction.id)]: {
                            data: updateAction,
                        },
                    },
                    DRAFT_SEGMENT
                );

                expect(setEntriesSpy.mock.calls.length).toBe(3);

                const storedRecord = setEntriesSpy.mock.calls[2][0][STORE_KEY_DRAFT_RECORD].data;

                expect(storedRecord.drafts.created).toBe(true);
                expect(storedRecord.drafts.edited).toBe(true);
                expect(storedRecord.fields.Name.value).toEqual(updatedName);
            });
        });
    });

    describe('evictEntries', () => {
        it('removes drafts node when all actions are evicted', async () => {
            const durableRecord = buildDurableRecordRepresentation(RECORD_ID, { Name: NAME_VALUE });

            const { durableStore, baseDurableStore } = setupDraftStore({
                [STORE_KEY_RECORD]: [],
            });
            const setEntriesSpy = jest.fn();
            const evictEntriesSpy = jest.fn();

            baseDurableStore.setEntries = setEntriesSpy.mockResolvedValue(undefined);
            baseDurableStore.evictEntries = evictEntriesSpy.mockResolvedValue(undefined);
            baseDurableStore.getEntries = jest
                .fn()
                .mockResolvedValue({ [STORE_KEY_RECORD]: { data: durableRecord } });

            const actionKey = buildDraftDurableStoreKey(STORE_KEY_RECORD, 'someotheractionid');

            await durableStore.evictEntries([actionKey], DRAFT_SEGMENT);

            expect(setEntriesSpy.mock.calls.length).toBe(1);
            expect(evictEntriesSpy.mock.calls.length).toBe(1);

            const storedRecord = setEntriesSpy.mock.calls[0][0][STORE_KEY_RECORD].data;

            expect(storedRecord.drafts).toBeUndefined();
        });

        it('applies rest of drafts after one is evicted', async () => {
            const durableRecord = buildDurableRecordRepresentation(RECORD_ID, { Name: NAME_VALUE });
            const editAction = createEditDraftAction(RECORD_ID, STORE_KEY_RECORD);

            const { durableStore, baseDurableStore } = setupDraftStore({
                [STORE_KEY_RECORD]: [editAction],
            });
            const setEntriesSpy = jest.fn();
            const evictEntriesSpy = jest.fn();

            baseDurableStore.setEntries = setEntriesSpy.mockResolvedValue(undefined);
            baseDurableStore.evictEntries = evictEntriesSpy.mockResolvedValue(undefined);
            baseDurableStore.getEntries = jest
                .fn()
                .mockResolvedValue({ [STORE_KEY_RECORD]: { data: durableRecord } });

            const actionKey = buildDraftDurableStoreKey(STORE_KEY_RECORD, editAction.id);

            await durableStore.evictEntries([actionKey], DRAFT_SEGMENT);

            expect(setEntriesSpy.mock.calls.length).toBe(1);
            expect(evictEntriesSpy.mock.calls.length).toBe(1);

            const storedRecord = setEntriesSpy.mock.calls[0][0][STORE_KEY_RECORD].data;

            expect(storedRecord.drafts.edited).toBe(true);
            expect(storedRecord.fields.Name.value).toEqual(DEFAULT_NAME_FIELD_VALUE);
            expect(storedRecord.fields.Name.displayValue).toEqual(DEFAULT_NAME_FIELD_VALUE);
            expect(storedRecord.drafts.serverValues.Name).toEqual(NAME_VALUE);
        });
    });

    describe('batchOperations', () => {
        it('including a draft create in a batch writes a synthetic record', async () => {
            const durableRecord = buildDurableRecordRepresentation(RECORD_ID, {
                Name: NAME_VALUE,
            });

            const createAction = createPostDraftAction(STORE_KEY_DRAFT_RECORD, DRAFT_RECORD_ID);

            durableRecord.drafts = {
                created: true,
                edited: false,
                deleted: false,
                serverValues: {},
                draftActionIds: [createAction.id],
            };

            const { durableStore, baseDurableStore } = setupDraftStore({
                [STORE_KEY_DRAFT_RECORD]: [createAction],
            });
            const batchSpy = jest.fn();
            const setSpy = jest.fn();

            baseDurableStore.batchOperations = batchSpy.mockResolvedValue(undefined);
            baseDurableStore.setEntries = setSpy.mockResolvedValue(undefined);
            baseDurableStore.getEntries = jest
                .fn()
                .mockResolvedValue({ [STORE_KEY_DRAFT_RECORD]: { data: durableRecord } });

            await durableStore.batchOperations([
                {
                    segment: DRAFT_SEGMENT,
                    type: DurableStoreOperationType.SetEntries,
                    entries: {
                        [buildDraftDurableStoreKey(createAction.tag, createAction.id)]: {
                            data: createAction,
                        },
                    },
                },
            ]);

            expect(batchSpy.mock.calls.length).toBe(1);
            expect(setSpy.mock.calls.length).toBe(2);

            const storedRecord = setSpy.mock.calls[1][0][STORE_KEY_DRAFT_RECORD].data;

            expect(storedRecord.drafts.created).toBe(true);
            expect(storedRecord.fields.Name.value).toEqual(DEFAULT_NAME_FIELD_VALUE);
            expect(storedRecord.fields.Name.displayValue).toEqual(DEFAULT_NAME_FIELD_VALUE);
        });

        it('does not persist creates to non records', async () => {
            const durableRecord = buildDurableRecordRepresentation(RECORD_ID, {
                Name: NAME_VALUE,
            });
            const customAction: DraftAction<unknown, CustomActionData> = {
                data: { mock: 'data' },
                handler: 'CUSTOM',
                id: '12345',
                tag: '1234',
                metadata: {},
                targetId: '1234',
                status: DraftActionStatus.Pending,
                timestamp: Date.now(),
            };

            const { durableStore, baseDurableStore } = setupDraftStore({
                [STORE_KEY_DRAFT_RECORD]: [customAction],
            });
            const batchSpy = jest.fn();
            const setSpy = jest.fn();

            baseDurableStore.batchOperations = batchSpy.mockResolvedValue(undefined);
            baseDurableStore.setEntries = setSpy.mockResolvedValue(undefined);
            baseDurableStore.getEntries = jest
                .fn()
                .mockResolvedValue({ [STORE_KEY_DRAFT_RECORD]: { data: durableRecord } });

            const operation: DurableStoreOperation<unknown> = {
                segment: DRAFT_SEGMENT,
                type: DurableStoreOperationType.SetEntries,
                entries: {
                    [buildDraftDurableStoreKey(customAction.tag, customAction.id)]: {
                        data: customAction,
                    },
                },
            };
            await durableStore.batchOperations([operation]);

            expect(batchSpy.mock.calls.length).toBe(1);
            expect(setSpy.mock.calls.length).toBe(0);

            const action = batchSpy.mock.calls[0][0][0].entries['1234__DraftAction__12345'].data;
            expect(action.handler).toBe('CUSTOM');
        });

        it('only calls persist creates to on records', async () => {
            const durableRecord = buildDurableRecordRepresentation(RECORD_ID, {
                Name: NAME_VALUE,
            });
            const createAction = createPostDraftAction(STORE_KEY_DRAFT_RECORD, DRAFT_RECORD_ID);
            const customAction: DraftAction<unknown, CustomActionData> = {
                data: {
                    mock: 'data',
                },
                handler: 'CUSTOM',
                id: '12345',
                tag: 'Action::12345',
                metadata: {},
                targetId: '1234',
                status: DraftActionStatus.Pending,
                timestamp: Date.now(),
            };

            const { durableStore, baseDurableStore } = setupDraftStore({
                [STORE_KEY_DRAFT_RECORD]: [createAction],
                [customAction.tag]: [customAction],
            });

            const batchSpy = jest.fn();
            const setSpy = jest.fn();

            baseDurableStore.batchOperations = batchSpy.mockResolvedValue(undefined);
            baseDurableStore.setEntries = setSpy.mockResolvedValue(undefined);
            baseDurableStore.getEntries = jest.fn().mockResolvedValue({
                [STORE_KEY_DRAFT_RECORD]: { data: durableRecord },
            });

            const operation: DurableStoreOperation<unknown> = {
                segment: DRAFT_SEGMENT,
                type: DurableStoreOperationType.SetEntries,
                entries: {
                    [buildDraftDurableStoreKey(customAction.tag, customAction.id)]: {
                        data: customAction,
                    },
                    [buildDraftDurableStoreKey(customAction.tag, customAction.id)]: {
                        data: customAction,
                    },
                },
            };
            await durableStore.batchOperations([operation]);

            expect(batchSpy.mock.calls.length).toBe(1);
            expect(setSpy.mock.calls.length).toBe(0);
        });

        it('updates the record when an edit action is written', async () => {
            const durableRecord = buildDurableRecordRepresentation(RECORD_ID, {
                Name: NAME_VALUE,
            });
            const editAction = createEditDraftAction(RECORD_ID, STORE_KEY_RECORD);

            const { durableStore, baseDurableStore } = setupDraftStore({
                [STORE_KEY_RECORD]: [editAction],
            });
            const setEntriesSpy = jest.fn();
            const batchOperations = jest.fn();

            baseDurableStore.setEntries = setEntriesSpy.mockResolvedValue(undefined);
            baseDurableStore.batchOperations = batchOperations.mockResolvedValue(undefined);
            baseDurableStore.getEntries = jest
                .fn()
                .mockResolvedValue({ [STORE_KEY_RECORD]: { data: durableRecord } });

            await durableStore.batchOperations<any>([
                {
                    segment: DRAFT_SEGMENT,
                    type: DurableStoreOperationType.SetEntries,
                    entries: {
                        [buildDraftDurableStoreKey(editAction.tag, editAction.id)]: {
                            data: editAction,
                        },
                    },
                },
            ]);

            expect(setEntriesSpy.mock.calls.length).toBe(1);

            const storedRecord = setEntriesSpy.mock.calls[0][0][STORE_KEY_RECORD].data;

            expect(storedRecord.drafts.edited).toBe(true);
            expect(storedRecord.fields.Name.value).toEqual(DEFAULT_NAME_FIELD_VALUE);
            expect(storedRecord.fields.Name.displayValue).toEqual(DEFAULT_NAME_FIELD_VALUE);
            expect(storedRecord.drafts.serverValues.Name).toEqual(NAME_VALUE);
        });
    });
});
