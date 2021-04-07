import { Environment, Store } from '@luvio/engine';
import { makeDurable } from '@luvio/environments';
import { keyBuilderRecord } from '@salesforce/lds-adapters-uiapi';
import { DraftActionStatus, PendingDraftAction, QueueOperationType } from '../../DraftQueue';
import {
    buildDurableRecordRepresentation,
    createDeleteRequest,
    createEditDraftAction,
    createPatchRequest,
    createPostRequest,
    DEFAULT_API_NAME,
    DEFAULT_NAME_FIELD_VALUE,
    DRAFT_RECORD_ID,
    RECORD_ID,
    STORE_KEY_RECORD,
    CURRENT_USER_ID,
    DEFAULT_TIME_STAMP,
    buildMockDurableStore,
    mockDurableStoreDraftResponse,
    STORE_KEY_DRAFT_RECORD,
    createCompletedDraftAction,
} from '../../__tests__/test-utils';
import {
    buildRecordFieldValueRepresentationsFromDraftFields,
    buildSyntheticRecordRepresentation,
    extractRecordApiNameFromStore,
    getRecordFieldsFromRecordRequest,
    getRecordIdFromRecordRequest,
    getRecordKeyForId,
    replayDraftsOnRecord,
    buildDraftDurableStoreKey,
    extractRecordKeyFromDraftDurableStoreKey,
    reviveRecordToStore,
    lookupRecordWithFields,
    markDraftRecordOptionalFieldsMissing,
    updateQueueOnPost,
} from '../records';

describe('draft environment record utilities', () => {
    describe('buildRecordFieldValueRepresentationsFromDraftFields', () => {
        it('converts DraftFields into FieldValueRepresentations', () => {
            const fields = buildRecordFieldValueRepresentationsFromDraftFields({
                Name: 'Justin',
                Color: 'Blue',
                Friends: null,
            });

            expect(fields['Name']).toEqual({
                value: 'Justin',
                displayValue: 'Justin',
            });

            expect(fields['Color']).toEqual({
                value: 'Blue',
                displayValue: 'Blue',
            });

            expect(fields['Friends']).toEqual({
                value: null,
                displayValue: null,
            });
        });
    });

    describe('buildSyntheticRecordRepresentation', () => {
        it('builds sythetic record with fields', () => {
            const lastModDate = 'lastModDate';
            const createdDate = 'createdDate';
            const syntheticRecord = buildSyntheticRecordRepresentation(
                CURRENT_USER_ID,
                DRAFT_RECORD_ID,
                DEFAULT_API_NAME,
                { Name: DEFAULT_NAME_FIELD_VALUE },
                lastModDate,
                createdDate
            );

            expect(syntheticRecord).toEqual({
                id: DRAFT_RECORD_ID,
                apiName: DEFAULT_API_NAME,
                childRelationships: {},
                eTag: '',
                lastModifiedById: CURRENT_USER_ID,
                lastModifiedDate: lastModDate,
                recordTypeId: null,
                recordTypeInfo: null,
                systemModstamp: createdDate,
                weakEtag: -1,
                fields: {
                    Name: {
                        value: DEFAULT_NAME_FIELD_VALUE,
                        displayValue: DEFAULT_NAME_FIELD_VALUE,
                    },
                    CreatedById: {
                        value: CURRENT_USER_ID,
                        displayValue: null,
                    },
                    CreatedDate: {
                        value: createdDate,
                        displayValue: null,
                    },
                    LastModifiedById: {
                        value: CURRENT_USER_ID,
                        displayValue: null,
                    },
                    LastModifiedDate: {
                        value: lastModDate,
                        displayValue: null,
                    },
                    OwnerId: {
                        value: CURRENT_USER_ID,
                        displayValue: null,
                    },
                    Id: {
                        value: DRAFT_RECORD_ID,
                        displayValue: null,
                    },
                },
            });
        });
    });

    describe('getRecordIdFromRequest', () => {
        it('returns undefined if apiName is not in post request', () => {
            const request = createPostRequest();
            delete request.body.apiName;
            const id = getRecordIdFromRecordRequest(request);
            expect(id).toBe(undefined);
        });

        it('gets record id from patch request', () => {
            const request = createPatchRequest();
            const id = getRecordIdFromRecordRequest(request);
            expect(id).toBe(RECORD_ID);
        });

        it('gets record id from a delete request', () => {
            const request = createDeleteRequest();
            const id = getRecordIdFromRecordRequest(request);
            expect(id).toBe(RECORD_ID);
        });

        it('returns undefined if method not recognized', () => {
            const request = {
                baseUri: '/services/data/v53.0',
                basePath: `/ui-api/records/${RECORD_ID}`,
                method: 'put',
                body: {
                    fields: {
                        Name: DEFAULT_NAME_FIELD_VALUE,
                    },
                },
                urlParams: {},
                queryParams: {},
                headers: {},
            };
            const id = getRecordIdFromRecordRequest(request);
            expect(id).toBeUndefined();
        });

        it('returns undefined if not record cud endpoint', () => {
            const request = {
                baseUri: '/services/data/v53.0',
                basePath: `/ui-api/records/somethingelse/${RECORD_ID}`,
                method: 'delete',
                body: {},
                urlParams: {},
                queryParams: {},
                headers: {},
            };
            const id = getRecordIdFromRecordRequest(request);
            expect(id).toBeUndefined();
        });

        it('returns undefined if base path is unexpected', () => {
            const request = {
                baseUri: '/services/data/v53.0',
                basePath: `/ui-api/records/${RECORD_ID}/something`,
                method: 'delete',
                body: {},
                urlParams: {},
                queryParams: {},
                headers: {},
            };
            const id = getRecordIdFromRecordRequest(request);
            expect(id).toBeUndefined();
        });
    });

    describe('getRecordKeyForId', () => {
        it('generates expected key format', () => {
            const key = getRecordKeyForId(RECORD_ID);
            expect(key).toEqual(STORE_KEY_RECORD);
        });
    });

    describe('getRecordFieldsFromRecordRequest', () => {
        it('returns fields for post request', () => {
            const fields = getRecordFieldsFromRecordRequest(createPostRequest());
            expect(fields.fields).toEqual(['Name']);
            expect(fields.optionalFields).toEqual([]);
        });
        it('returns fields for patch request', () => {
            const fields = getRecordFieldsFromRecordRequest(createPatchRequest());
            expect(fields.fields).toEqual(['Name']);
            expect(fields.optionalFields).toEqual([]);
        });
        it('returns undefined for unsupported method', () => {
            const fields = getRecordFieldsFromRecordRequest(createDeleteRequest());
            expect(fields.fields).toEqual([]);
            expect(fields.optionalFields).toEqual([]);
        });

        it('returns fields and optional fields for get request', () => {
            const request = {
                baseUri: '/services/data/v53.0',
                basePath: `/ui-api/records/${RECORD_ID}`,
                method: 'get',
                body: {},
                urlParams: {},
                queryParams: {
                    fields: ['Account.Name'],
                    optionalFields: ['Account.Id'],
                },
                headers: {},
            };
            const fields = getRecordFieldsFromRecordRequest(request);
            expect(fields.fields).toEqual(['Name']);
            expect(fields.optionalFields).toEqual(['Id']);
        });

        it('returns undefined for missing body', () => {
            const request = createPostRequest();
            delete request.body;
            const fields = getRecordFieldsFromRecordRequest(request);
            expect(fields.fields).toEqual([]);
            expect(fields.optionalFields).toEqual([]);
        });
    });

    describe('extractRecordApiNameFromStore', () => {
        it('gets apiName from record in store', () => {
            const store = new Store();
            store.publish(STORE_KEY_RECORD, { apiName: DEFAULT_API_NAME });
            const apiName = extractRecordApiNameFromStore(
                STORE_KEY_RECORD,
                new Environment(store, jest.fn())
            );
            expect(apiName).toBe(DEFAULT_API_NAME);
        });
        it('returns undefined if missing in store', () => {
            const store = new Store();
            const apiName = extractRecordApiNameFromStore(
                STORE_KEY_RECORD,
                new Environment(store, jest.fn())
            );
            expect(apiName).toBeUndefined();
        });
    });

    describe('replayDraftsOnRecord', () => {
        it('returns unmodified record if no draft actions', () => {
            const record = {} as any;
            const result = replayDraftsOnRecord(record, [], CURRENT_USER_ID);

            expect(result).toBe(record);
        });

        it('returns unmodified record if draft action undefined', () => {
            const record = {} as any;
            const result = replayDraftsOnRecord(record, [undefined], CURRENT_USER_ID);

            expect(result).toBe(record);
        });

        it('throws error on POST', () => {
            expect(() =>
                replayDraftsOnRecord(
                    {} as any,
                    [{ request: { method: 'post' } } as any],
                    CURRENT_USER_ID
                )
            ).toThrowError();
        });

        it('throws if draft action after a delete is present', () => {
            expect(() =>
                replayDraftsOnRecord(
                    {} as any,
                    [{ request: { method: 'delete' } } as any, {} as any],
                    CURRENT_USER_ID
                )
            ).toThrowError();
        });

        it('adds drafts node and fields for delete', () => {
            const record = {} as any;

            const result = replayDraftsOnRecord(
                record,
                [{ id: '123', request: { method: 'delete' } } as any],
                CURRENT_USER_ID
            );

            expect(result).toStrictEqual({
                drafts: {
                    created: false,
                    edited: false,
                    deleted: true,
                    serverValues: {},
                    draftActionIds: ['123'],
                },
            });
        });

        it('adds drafts node and denormalized fields for patch', () => {
            const record = {
                id: '123',
                fields: { Name: { value: 'oldName', displayValue: null } },
                lastModifiedById: null,
                lastModifiedDate: null,
            } as any;

            const editAction = createEditDraftAction(
                '123',
                'UiApi::RecordRepresentation:123',
                'newName'
            );
            const result = replayDraftsOnRecord(record, [editAction], CURRENT_USER_ID);

            const expectedLastModifiedDate = new Date(DEFAULT_TIME_STAMP).toISOString();
            expect(result).toStrictEqual({
                id: '123',
                fields: {
                    Name: { value: 'newName', displayValue: 'newName' },
                    LastModifiedById: { value: CURRENT_USER_ID, displayValue: null },
                    LastModifiedDate: {
                        value: expectedLastModifiedDate,
                        displayValue: expectedLastModifiedDate,
                    },
                },
                drafts: {
                    created: false,
                    deleted: false,
                    edited: true,
                    serverValues: {
                        Name: {
                            value: 'oldName',
                            displayValue: null,
                        },
                    },
                    draftActionIds: [editAction.id],
                },
                lastModifiedById: CURRENT_USER_ID,
                lastModifiedDate: expectedLastModifiedDate,
            });
        });

        it('adds drafts node and linked fields for patch', () => {
            const record = buildDurableRecordRepresentation('123', {
                Name: { value: 'oldName', displayValue: null },
                LastModifiedById: { value: null, displayValue: null },
                LastModifiedDate: { value: null, displayValue: null },
            });

            const editAction = createEditDraftAction(
                '123',
                'UiApi::RecordRepresentation:123',
                'newName'
            );
            const result = replayDraftsOnRecord(record, [editAction], CURRENT_USER_ID);

            const expectedLastModifiedDate = new Date(DEFAULT_TIME_STAMP).toISOString();
            const expected = {
                ...buildDurableRecordRepresentation('123', {
                    Name: { value: 'newName', displayValue: 'newName' },
                    LastModifiedById: { value: CURRENT_USER_ID, displayValue: null },
                    LastModifiedDate: {
                        value: expectedLastModifiedDate,
                        displayValue: expectedLastModifiedDate,
                    },
                }),
                drafts: {
                    created: false,
                    deleted: false,
                    edited: true,
                    serverValues: {
                        Name: {
                            value: 'oldName',
                            displayValue: null,
                        },
                    },
                    draftActionIds: [editAction.id],
                },
            };

            expected.lastModifiedById = CURRENT_USER_ID;
            expected.lastModifiedDate = expectedLastModifiedDate;
            expect(result).toStrictEqual(expected);
        });

        it('adds draft action id array in drafts node', () => {
            const record = buildDurableRecordRepresentation('123', {
                Name: { value: 'oldName', displayValue: null },
            });
            const result = replayDraftsOnRecord(
                record,
                [
                    createEditDraftAction('123', 'UiApi::RecordRepresentation:123', 'newName'),
                    createEditDraftAction('123', 'UiApi::RecordRepresentation:123', 'newerName'),
                    createEditDraftAction('123', 'UiApi::RecordRepresentation:123', 'newestName'),
                ],
                CURRENT_USER_ID
            );
            expect(result.drafts.draftActionIds.length).toBe(3);
        });
    });

    describe('buildDraftActionKey', () => {
        it('builds draft action key in expected format', () => {
            const recordKey = 'RANDOM::RECORD';
            const draftActionId = 'draftActionId';
            expect(buildDraftDurableStoreKey(recordKey, draftActionId)).toBe(
                `${recordKey}__DraftAction__${draftActionId}`
            );
        });
    });

    describe('extractRecordKeyFromDraftActionKey', () => {
        it('extracts record key from draft action key', () => {
            const recordKey = 'RANDOM::RECORD';
            const draftActionId = 'draftActionId';
            const draftActionKey = buildDraftDurableStoreKey(recordKey, draftActionId);

            expect(extractRecordKeyFromDraftDurableStoreKey(draftActionKey)).toEqual(recordKey);
        });

        it('returns undefined for unexpected key format', () => {
            expect(
                extractRecordKeyFromDraftDurableStoreKey('UiApi::RecordRepresentation::foo')
            ).toBeUndefined();
        });

        it('returns undefined for undefined input', () => {
            expect(extractRecordKeyFromDraftDurableStoreKey(undefined)).toBeUndefined();
        });
    });

    describe('reviveRecordToStore', () => {
        it('revives and marks missing optionalFields missing', async () => {
            const durableStore = buildMockDurableStore();
            mockDurableStoreDraftResponse(durableStore);
            const env = makeDurable(new Environment(new Store(), jest.fn()), {
                durableStore,
            });

            const record = await reviveRecordToStore(
                STORE_KEY_DRAFT_RECORD,
                { fields: ['Name'], optionalFields: ['Birthday'] },
                env
            );

            expect(record).toBeDefined();
            expect(record.fields['Name']).toBeDefined();
            expect(record.fields['Birthday']).toBeUndefined();
        });
        it('returns undefined if required field is missing', async () => {
            const durableStore = buildMockDurableStore();
            mockDurableStoreDraftResponse(durableStore);
            const env = makeDurable(new Environment(new Store(), jest.fn()), {
                durableStore,
            });

            const record = await reviveRecordToStore(
                STORE_KEY_DRAFT_RECORD,
                { fields: ['Name', 'Birthday'], optionalFields: [] },
                env
            );

            expect(record).toBeUndefined();
        });
    });

    describe('lookupRecordWithFields', () => {
        async function setup() {
            const durableStore = buildMockDurableStore();
            mockDurableStoreDraftResponse(durableStore);
            const env = makeDurable(new Environment(new Store(), jest.fn()), {
                durableStore,
            });

            const record = await reviveRecordToStore(
                STORE_KEY_DRAFT_RECORD,
                { fields: ['Name'], optionalFields: ['Birthday'] },
                env
            );

            return { record, env, durableStore };
        }

        it('returns fulfilled data', async () => {
            const { env } = await setup();
            const record = lookupRecordWithFields(
                STORE_KEY_DRAFT_RECORD,
                { fields: ['Name'], optionalFields: [] },
                env
            );
            expect(record).toBeDefined();
        });
        it('returns stale data', async () => {
            const { env } = await setup();
            // expire the record
            env.storeSetExpiration(STORE_KEY_DRAFT_RECORD, 5, Number.MAX_SAFE_INTEGER);
            const record = lookupRecordWithFields(
                STORE_KEY_DRAFT_RECORD,
                { fields: ['Name'], optionalFields: [] },
                env
            );
            expect(record).toBeDefined();
        });

        it('returns mutable data', async () => {
            const { env } = await setup();
            const record = lookupRecordWithFields(
                STORE_KEY_DRAFT_RECORD,
                { fields: ['Name'], optionalFields: [] },
                env
            );
            record.apiName = 'foo';
            expect(record.apiName).toBe('foo');
        });
    });

    describe('markDraftRecordOptionalFieldsMissing', () => {
        it('only applies to draft records', () => {
            const mockRecord = {
                id: 'foo',
                fields: { Name: {} },
            };
            const env = new Environment(new Store(), jest.fn());
            env.storePublish('foo', mockRecord);
            markDraftRecordOptionalFieldsMissing('foo', ['Birthday'], env);
            const records = env.getStoreRecords();
            const storeRecord = records['foo'];
            expect(storeRecord.fields.Birthday).toBeUndefined();
        });

        it('marks missing optional fields missing', () => {
            const mockRecord = {
                id: 'foo',
                drafts: {},
                fields: { Name: {} },
            };
            const env = new Environment(new Store(), jest.fn());
            env.storePublish('foo', mockRecord);
            markDraftRecordOptionalFieldsMissing('foo', ['Birthday'], env);
            const records = env.getStoreRecords();
            const storeRecord = records['foo'];
            expect(storeRecord.fields.Birthday.isMissing).toBe(true);
            expect(Object.prototype.hasOwnProperty.call(storeRecord.fields.Birthday, '__ref')).toBe(
                true
            );
            expect(storeRecord.fields.Birthday.__ref).toBe(undefined);
        });

        it('does not impact non-missing optional fields', () => {
            const mockRecord = {
                id: 'foo',
                drafts: {},
                fields: { Name: {}, Color: 'green' },
            };
            const env = new Environment(new Store(), jest.fn());
            env.storePublish('foo', mockRecord);
            markDraftRecordOptionalFieldsMissing('foo', ['Birthday', 'Color'], env);
            const records = env.getStoreRecords();
            const storeRecord = records['foo'];
            expect(storeRecord.fields.Color).toBe('green');
        });
    });
    describe('updateQueueOnPost', () => {
        it('replaces actions in the queue on the draft-created record', () => {
            const draftId = 'foo';
            const canonicalId = 'bar';
            const draftKey = keyBuilderRecord({ recordId: draftId });
            const canonicalKey = keyBuilderRecord({ recordId: canonicalId });

            const completedAction = {
                ...createCompletedDraftAction(canonicalId, canonicalKey),
                tag: draftKey,
            };

            const queue = [
                createEditDraftAction(draftId, draftKey),
                createEditDraftAction(draftId, draftKey),
            ];
            const operations = updateQueueOnPost(completedAction, queue);
            expect(operations.length).toBe(4);
            expect(operations[0].type).toBe(QueueOperationType.Delete);
            expect(operations[1].type).toBe(QueueOperationType.Add);
            expect((operations[1] as any).action.request.basePath).toBe(
                completedAction.request.basePath
            );
            expect(operations[2].type).toBe(QueueOperationType.Delete);
            expect((operations[3] as any).action.request.basePath).toBe(
                completedAction.request.basePath
            );
        });

        it('replaces draft id references in the body', () => {
            const draftId = 'foo';
            const canonicalId = 'bar';
            const draftKey = keyBuilderRecord({ recordId: draftId });
            const canonicalKey = keyBuilderRecord({ recordId: canonicalId });
            const record2Id = 'baz';
            const record2Key = keyBuilderRecord({ recordId: record2Id });

            const completedAction = {
                ...createCompletedDraftAction(canonicalId, canonicalKey),
                tag: draftKey,
            };

            const actionWithBodyDraftReference: PendingDraftAction<unknown> = {
                id: new Date().getUTCMilliseconds().toString(),
                targetId: 'targetId',
                metadata: {},
                status: DraftActionStatus.Pending,
                tag: record2Key,
                timestamp: 12345,
                request: {
                    baseUri: '/services/data/v53.0',
                    basePath: `/ui-api/records/${record2Id}`,
                    method: 'patch',
                    body: { fields: { FriendId: draftId } },
                    urlParams: { recordId: record2Id },
                    queryParams: {},
                    headers: {},
                },
            };

            const queue = [actionWithBodyDraftReference];
            const operations = updateQueueOnPost(completedAction, queue);
            expect(operations.length).toBe(1);
            expect(operations[0].type).toBe(QueueOperationType.Update);
            expect((operations[0] as any).action.request.body).toEqual({
                fields: { FriendId: canonicalId },
            });
        });

        it('returns no queue operations if no future references to the draft id exist', () => {
            const record2Id = 'foo';
            const canonicalId = 'bar';
            const record2Key = keyBuilderRecord({ recordId: record2Id });
            const canonicalKey = keyBuilderRecord({ recordId: canonicalId });

            const completedAction = createCompletedDraftAction(canonicalId, canonicalKey);
            const queue = [createEditDraftAction(record2Id, record2Key)];

            const operations = updateQueueOnPost(completedAction, queue);
            expect(operations.length).toBe(0);
        });
    });
});
