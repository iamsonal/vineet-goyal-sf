import { ResourceRequest, StoreLink } from '@luvio/engine';
import { DurableStoreEntry } from '@luvio/environments';
import {
    keyBuilderObjectInfo,
    keyBuilderRecord,
    RecordRepresentation,
} from '@salesforce/lds-adapters-uiapi';
import { LDS_ACTION_HANDLER_ID } from '../../actionHandlers/LDSActionHandler';
import {
    AddQueueOperation,
    DraftAction,
    DraftActionStatus,
    PendingDraftAction,
    QueueOperationType,
    UpdateQueueOperation,
} from '../../DraftQueue';
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
    createCompletedDraftAction,
    STORE_KEY_DRAFT_RECORD,
    createPostDraftAction,
    DEFAULT_DRAFT_TIMESTAMP_FORMATTED,
} from '../../__tests__/test-utils';
import {
    buildRecordFieldValueRepresentationsFromDraftFields,
    buildSyntheticRecordRepresentation,
    getRecordFieldsFromRecordRequest,
    getRecordIdFromRecordRequest,
    getRecordKeyForId,
    replayDraftsOnRecord,
    buildDraftDurableStoreKey,
    extractRecordKeyFromDraftDurableStoreKey,
    updateQueueOnPost,
    DurableRecordRepresentation,
    durableMerge,
    DraftRecordRepresentation,
    removeDrafts,
    getDraftResolutionInfoForRecordSet,
    getObjectApiNamesFromDraftCreateEntries,
} from '../records';
import OpportunityObjectInfo from './data/object-Opportunity.json';

const OPPORTUNITY_OBJECT_INFO_KEY = keyBuilderObjectInfo({
    apiName: OpportunityObjectInfo.apiName,
});

describe('draft environment record utilities', () => {
    describe('buildRecordFieldValueRepresentationsFromDraftFields', () => {
        it('converts DraftFields into FieldValueRepresentations', () => {
            const fields = buildRecordFieldValueRepresentationsFromDraftFields(
                {
                    Name: 'Justin',
                    Color: 'Blue',
                    Friends: null,
                },
                OpportunityObjectInfo
            );

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

        it('updates reference field', () => {
            const Name = 'Justin';
            const OwnerId = '12345';
            const fields = buildRecordFieldValueRepresentationsFromDraftFields(
                {
                    Name,
                    OwnerId,
                },
                OpportunityObjectInfo
            );

            expect(fields['Name']).toEqual({
                value: Name,
                displayValue: Name,
            });

            expect(fields['OwnerId']).toEqual({
                value: OwnerId,
                displayValue: OwnerId,
            });

            expect(fields['Owner']).toEqual({
                value: {
                    __ref: `UiApi::RecordRepresentation:${OwnerId}`,
                },
                displayValue: null,
            });
        });
    });

    describe('buildSyntheticRecordRepresentation', () => {
        it('builds sythetic record with fields', () => {
            const timestamp = Date.now();
            const actionId = 'foo';
            const action: DraftAction<RecordRepresentation, any> = {
                tag: STORE_KEY_DRAFT_RECORD,
                targetId: DRAFT_RECORD_ID,
                timestamp,
                id: actionId,
                metadata: {},
                status: DraftActionStatus.Pending,
                handler: LDS_ACTION_HANDLER_ID,
                data: {
                    method: 'post',
                    body: {
                        apiName: 'Account',
                        fields: {
                            Name: DEFAULT_NAME_FIELD_VALUE,
                        },
                    },
                } as any,
            };

            const syntheticRecord = buildSyntheticRecordRepresentation(
                action,
                CURRENT_USER_ID,
                undefined
            );

            expect(syntheticRecord).toEqual({
                id: DRAFT_RECORD_ID,
                apiName: DEFAULT_API_NAME,
                childRelationships: {},
                drafts: {
                    created: true,
                    deleted: false,
                    draftActionIds: [actionId],
                    edited: false,
                    serverValues: {},
                },
                eTag: '',
                lastModifiedById: CURRENT_USER_ID,
                lastModifiedDate: timestamp.toString(),
                recordTypeId: null,
                recordTypeInfo: null,
                systemModstamp: timestamp.toString(),
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
                        value: timestamp,
                        displayValue: null,
                    },
                    LastModifiedById: {
                        value: CURRENT_USER_ID,
                        displayValue: null,
                    },
                    LastModifiedDate: {
                        value: timestamp,
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
                links: {
                    CreatedById: {
                        __ref: 'UiApi::RecordRepresentation:DRAxx000001XL1tAAG__fields__CreatedById',
                    },
                    CreatedDate: {
                        __ref: 'UiApi::RecordRepresentation:DRAxx000001XL1tAAG__fields__CreatedDate',
                    },
                    Id: { __ref: 'UiApi::RecordRepresentation:DRAxx000001XL1tAAG__fields__Id' },
                    LastModifiedById: {
                        __ref: 'UiApi::RecordRepresentation:DRAxx000001XL1tAAG__fields__LastModifiedById',
                    },
                    LastModifiedDate: {
                        __ref: 'UiApi::RecordRepresentation:DRAxx000001XL1tAAG__fields__LastModifiedDate',
                    },
                    Name: { __ref: 'UiApi::RecordRepresentation:DRAxx000001XL1tAAG__fields__Name' },
                    OwnerId: {
                        __ref: 'UiApi::RecordRepresentation:DRAxx000001XL1tAAG__fields__OwnerId',
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

    describe('replayDraftsOnRecord', () => {
        it('returns unmodified record if no draft actions', () => {
            const record = {} as any;
            const result = replayDraftsOnRecord(record, [], undefined, CURRENT_USER_ID);

            expect(result).toBe(record);
        });

        it('returns unmodified record if draft action undefined', () => {
            const record = {} as any;
            const result = replayDraftsOnRecord(record, [undefined], undefined, CURRENT_USER_ID);

            expect(result).toBe(record);
        });

        it('throws error on POST', () => {
            expect(() =>
                replayDraftsOnRecord(
                    {} as any,
                    [{ request: { method: 'post' } } as any],
                    undefined,
                    CURRENT_USER_ID
                )
            ).toThrowError();
        });

        it('throws if draft action after a delete is present', () => {
            expect(() =>
                replayDraftsOnRecord(
                    {} as any,
                    [{ request: { method: 'delete' } } as any, {} as any],
                    undefined,
                    CURRENT_USER_ID
                )
            ).toThrowError();
        });

        it('adds drafts node and fields for delete', () => {
            const record = {} as any;

            const result = replayDraftsOnRecord(
                record,
                [{ id: '123', data: { method: 'delete' } } as any],
                undefined,
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
            const result = replayDraftsOnRecord(record, [editAction], undefined, CURRENT_USER_ID);

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
            const result = replayDraftsOnRecord(record, [editAction], undefined, CURRENT_USER_ID);

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
                undefined,
                CURRENT_USER_ID
            );
            expect(result.drafts.draftActionIds.length).toBe(3);
        });

        it('synthesizes record for draft create', () => {
            const result = replayDraftsOnRecord(
                undefined,
                [createPostDraftAction(STORE_KEY_DRAFT_RECORD, DRAFT_RECORD_ID)],
                undefined,
                ''
            );
            expect(result.drafts.created).toBe(true);
            expect(result.drafts.draftActionIds.length).toBe(1);
        });

        it('throws if encountering a draft create as non first element', () => {
            const record = buildDurableRecordRepresentation('123', {
                Name: { value: 'oldName', displayValue: null },
            });
            expect(() => {
                replayDraftsOnRecord(
                    record,
                    [createPostDraftAction(STORE_KEY_DRAFT_RECORD, DRAFT_RECORD_ID)],
                    undefined,
                    CURRENT_USER_ID
                );
            }).toThrowError();
        });

        it('throws if two posts are found', () => {
            expect(() => {
                replayDraftsOnRecord(
                    undefined,
                    [
                        createPostDraftAction(STORE_KEY_DRAFT_RECORD, DRAFT_RECORD_ID),
                        createEditDraftAction(DRAFT_RECORD_ID, STORE_KEY_DRAFT_RECORD, 'newName'),
                        createPostDraftAction(STORE_KEY_DRAFT_RECORD, DRAFT_RECORD_ID),
                    ],
                    undefined,
                    ''
                );
            }).toThrowError();
        });

        it('replays drafts on draft create', () => {
            const result: DraftRecordRepresentation = replayDraftsOnRecord(
                undefined,
                [
                    createPostDraftAction(STORE_KEY_DRAFT_RECORD, DRAFT_RECORD_ID),
                    createEditDraftAction(DRAFT_RECORD_ID, STORE_KEY_DRAFT_RECORD, 'newName'),
                ],
                undefined,
                ''
            );
            expect(result.drafts.created).toBe(true);
            expect(result.drafts.edited).toBe(true);
            expect(result.drafts.draftActionIds.length).toBe(2);
        });

        describe('draft relationships', () => {
            it('update lookup field link', () => {
                const objectInfo = OpportunityObjectInfo;
                const originalOwnerId = 'ORIGINAL_OWNER';
                const draftOwnerId = 'DRAFT_OWNER';
                const draftNameValue = 'Jason';
                const originalRecord = buildDurableRecordRepresentation('123', {
                    Name: { value: 'oldName', displayValue: null },
                    OwnerId: { value: originalOwnerId, displayValue: null },
                });

                const draftLink = keyBuilderRecord({ recordId: draftOwnerId });

                const action = createEditDraftAction(RECORD_ID, STORE_KEY_RECORD, draftNameValue);
                action.data.body.fields = { ...action.data.body.fields, OwnerId: draftOwnerId };

                const recordWithDrafts = replayDraftsOnRecord(
                    originalRecord,
                    [action],
                    objectInfo,
                    ''
                );
                expect(recordWithDrafts.drafts).toBeDefined();
                // expect OwnerId field is updated
                expect(recordWithDrafts.fields.OwnerId.value).toEqual(draftOwnerId);

                // expect Owner lookup field link is updated
                expect(recordWithDrafts.fields.Owner).toBeDefined();
                expect((recordWithDrafts.fields.Owner.value as StoreLink).__ref).toEqual(draftLink);
            });

            it('throws if draft lookup field is not a string', () => {
                const objectInfo = OpportunityObjectInfo;
                const draftOwnerId = 123;
                const draftNameValue = 'Jason';
                const originalRecord = buildDurableRecordRepresentation('123', {
                    Name: { value: 'oldName', displayValue: null },
                    OwnerId: { value: 'ORIGINAL_OWNER', displayValue: null },
                });

                const action = createEditDraftAction(RECORD_ID, STORE_KEY_RECORD, draftNameValue);
                action.data.body.fields = { ...action.data.body.fields, OwnerId: draftOwnerId };

                expect(() =>
                    replayDraftsOnRecord(originalRecord, [action], objectInfo, '')
                ).toThrow();
            });
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
            expect(
                (
                    (operations[1] as AddQueueOperation).action as DraftAction<
                        unknown,
                        ResourceRequest
                    >
                ).data.basePath
            ).toBe(completedAction.data.basePath);
            expect(operations[2].type).toBe(QueueOperationType.Delete);
            expect(operations[3].type).toBe(QueueOperationType.Add);
            expect(
                (
                    (operations[3] as AddQueueOperation).action as DraftAction<
                        unknown,
                        ResourceRequest
                    >
                ).data.basePath
            ).toBe(completedAction.data.basePath);
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

            const actionWithBodyDraftReference: PendingDraftAction<unknown, ResourceRequest> = {
                id: new Date().getUTCMilliseconds().toString(),
                targetId: 'targetId',
                metadata: {},
                status: DraftActionStatus.Pending,
                tag: record2Key,
                timestamp: 12345,
                handler: LDS_ACTION_HANDLER_ID,
                data: {
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
            expect(
                (
                    (operations[0] as UpdateQueueOperation).action as DraftAction<
                        unknown,
                        ResourceRequest
                    >
                ).data.body
            ).toEqual({
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

    describe('durableMerge', () => {
        const draftName = 'Jason';
        const draftId = 'draft-foo';
        const draftTimetamp = Date.now();
        const draftTimestampString = new Date(draftTimetamp).toISOString();

        const draftEdit: DraftAction<RecordRepresentation, ResourceRequest> = {
            id: draftId,
            targetId: RECORD_ID,
            status: DraftActionStatus.Pending,
            tag: keyBuilderRecord({ recordId: RECORD_ID }),
            timestamp: draftTimetamp,
            handler: LDS_ACTION_HANDLER_ID,
            data: {
                baseUri: '/services/data/v53.0',
                basePath: `/ui-api/records/${RECORD_ID}`,
                method: 'patch',
                body: { fields: { Name: draftName } },
                urlParams: { recordId: RECORD_ID },
                queryParams: {},
                headers: {},
            },
            metadata: {},
        };
        it('merges fields and links for same weakEtag', () => {
            const refreshSpy = jest.fn();
            const existing: DurableStoreEntry<DurableRecordRepresentation> = {
                data: {
                    apiName: 'Account',
                    childRelationships: {},
                    eTag: '',
                    weakEtag: 1,
                    id: 'foo',
                    fields: {
                        Name: {
                            value: 'Justin',
                            displayValue: 'Justin',
                        },
                    },
                    lastModifiedById: null,
                    lastModifiedDate: null,
                    recordTypeId: null,
                    recordTypeInfo: null,
                    systemModstamp: null,
                    links: {
                        Name: {
                            __ref: 'UiApi::RecordRepresentation:DRAxx000001XL1tAAG__fields__Name',
                        },
                    },
                },
            };
            const incoming: DurableStoreEntry<DurableRecordRepresentation> = {
                data: {
                    apiName: 'Account',
                    childRelationships: {},
                    eTag: '',
                    weakEtag: 1,
                    id: 'foo',
                    fields: {
                        Name: {
                            value: 'Justin',
                            displayValue: 'Justin',
                        },
                        Birthday: {
                            value: '09-17-1988',
                            displayValue: null,
                        },
                    },
                    lastModifiedById: null,
                    lastModifiedDate: null,
                    recordTypeId: null,
                    recordTypeInfo: null,
                    systemModstamp: null,
                    links: {
                        Name: {
                            __ref: 'UiApi::RecordRepresentation:DRAxx000001XL1tAAG__fields__Name',
                        },
                        Birthday: {
                            __ref: 'UiApi::RecordRepresentation:DRAxx000001XL1tAAG__fields__Birthday',
                        },
                    },
                },
            };

            const expected: DurableStoreEntry<DurableRecordRepresentation> = {
                data: {
                    apiName: 'Account',
                    childRelationships: {},
                    eTag: '',
                    weakEtag: 1,
                    id: 'foo',
                    fields: {
                        Name: {
                            value: 'Justin',
                            displayValue: 'Justin',
                        },
                        Birthday: {
                            value: '09-17-1988',
                            displayValue: null,
                        },
                    },
                    lastModifiedById: null,
                    lastModifiedDate: null,
                    recordTypeId: null,
                    recordTypeInfo: null,
                    systemModstamp: null,
                    links: {
                        Name: {
                            __ref: 'UiApi::RecordRepresentation:DRAxx000001XL1tAAG__fields__Name',
                        },
                        Birthday: {
                            __ref: 'UiApi::RecordRepresentation:DRAxx000001XL1tAAG__fields__Birthday',
                        },
                    },
                },
            };

            const result = durableMerge(existing, incoming, [], undefined, '', refreshSpy);
            expect(result).toEqual(expected);
            expect(refreshSpy).toBeCalledTimes(0);
        });
        it('merges fields for same weakEtag keeps drafts', () => {
            const refreshSpy = jest.fn();
            const serverName = 'Justin';

            const existing: DurableStoreEntry<DurableRecordRepresentation> = {
                data: {
                    apiName: 'Account',
                    childRelationships: {},
                    eTag: '',
                    weakEtag: 1,
                    id: RECORD_ID,
                    fields: {
                        Name: {
                            value: draftName,
                            displayValue: draftName,
                        },
                    },
                    drafts: {
                        created: false,
                        edited: true,
                        deleted: true,
                        serverValues: {
                            Name: {
                                value: serverName,
                                displayValue: serverName,
                            },
                        },
                        draftActionIds: [draftId],
                    },
                    lastModifiedById: null,
                    lastModifiedDate: null,
                    recordTypeId: null,
                    recordTypeInfo: null,
                    systemModstamp: null,
                    links: {},
                },
            };

            const incoming: DurableStoreEntry<DurableRecordRepresentation> = {
                data: {
                    apiName: 'Account',
                    childRelationships: {},
                    eTag: '',
                    weakEtag: 1,
                    id: RECORD_ID,
                    fields: {
                        Name: {
                            value: serverName,
                            displayValue: serverName,
                        },
                        Birthday: {
                            value: '09-17-1988',
                            displayValue: null,
                        },
                    },
                    lastModifiedById: null,
                    lastModifiedDate: null,
                    recordTypeId: null,
                    recordTypeInfo: null,
                    systemModstamp: null,
                    links: {},
                },
            };

            const expected: DurableStoreEntry<DurableRecordRepresentation> = {
                data: {
                    apiName: 'Account',
                    childRelationships: {},
                    eTag: '',
                    weakEtag: 1,
                    id: RECORD_ID,
                    fields: {
                        Name: {
                            value: draftName,
                            displayValue: draftName,
                        },
                        Birthday: {
                            value: '09-17-1988',
                            displayValue: null,
                        },
                        LastModifiedById: {
                            displayValue: null,
                            value: '',
                        },
                        LastModifiedDate: {
                            displayValue: draftTimestampString,
                            value: draftTimestampString,
                        },
                    },
                    drafts: {
                        created: false,
                        edited: true,
                        deleted: false,
                        serverValues: {
                            Name: {
                                value: serverName,
                                displayValue: serverName,
                            },
                        },
                        draftActionIds: [draftId],
                    },
                    lastModifiedById: '',
                    lastModifiedDate: draftTimestampString,
                    recordTypeId: null,
                    recordTypeInfo: null,
                    systemModstamp: null,
                    links: {},
                },
            };

            const result = durableMerge(existing, incoming, [draftEdit], undefined, '', refreshSpy);
            expect(result).toEqual(expected);
            expect(refreshSpy).toBeCalledTimes(0);
        });
        it('newer incoming overwrites existing and kicks off unionized field refresh', () => {
            const refreshSpy = jest.fn();
            const existing: DurableStoreEntry<DurableRecordRepresentation> = {
                data: {
                    apiName: 'Account',
                    childRelationships: {},
                    eTag: '',
                    weakEtag: 1,
                    id: 'foo',
                    fields: {
                        Name: {
                            value: 'Justin',
                            displayValue: 'Justin',
                        },
                        IsMad: {
                            value: true,
                            displayValue: '',
                        },
                    },
                    lastModifiedById: null,
                    lastModifiedDate: null,
                    recordTypeId: null,
                    recordTypeInfo: null,
                    systemModstamp: null,
                    links: {},
                },
            };
            const incoming: DurableStoreEntry<DurableRecordRepresentation> = {
                data: {
                    apiName: 'Account',
                    childRelationships: {},
                    eTag: '',
                    weakEtag: 2,
                    id: 'foo',
                    fields: {
                        Name: {
                            value: 'Jason',
                            displayValue: 'Jason',
                        },
                        Birthday: {
                            value: '09-17-1988',
                            displayValue: null,
                        },
                    },
                    lastModifiedById: null,
                    lastModifiedDate: null,
                    recordTypeId: null,
                    recordTypeInfo: null,
                    systemModstamp: null,
                    links: {},
                },
            };

            const expected: DurableStoreEntry<DurableRecordRepresentation> = {
                data: {
                    apiName: 'Account',
                    childRelationships: {},
                    eTag: '',
                    weakEtag: 2,
                    id: 'foo',
                    fields: {
                        Name: {
                            value: 'Jason',
                            displayValue: 'Jason',
                        },
                        Birthday: {
                            value: '09-17-1988',
                            displayValue: null,
                        },
                    },
                    lastModifiedById: null,
                    lastModifiedDate: null,
                    recordTypeId: null,
                    recordTypeInfo: null,
                    systemModstamp: null,
                    links: {},
                },
            };

            const result = durableMerge(existing, incoming, [], undefined, '', refreshSpy);
            expect(result).toEqual(expected);
            expect(refreshSpy).toBeCalledTimes(1);
            expect(refreshSpy.mock.calls[0][0]).toStrictEqual({
                optionalFields: ['Account.Name', 'Account.Birthday', 'Account.IsMad'],
                recordId: 'foo',
            });
        });
        it('newer incoming overwrites existing but does not kick off refresh if fields are superset', () => {
            const refreshSpy = jest.fn();
            const existing: DurableStoreEntry<DurableRecordRepresentation> = {
                data: {
                    apiName: 'Account',
                    childRelationships: {},
                    eTag: '',
                    weakEtag: 1,
                    id: 'foo',
                    fields: {
                        Name: {
                            value: 'Justin',
                            displayValue: 'Justin',
                        },
                    },
                    lastModifiedById: null,
                    lastModifiedDate: null,
                    recordTypeId: null,
                    recordTypeInfo: null,
                    systemModstamp: null,
                    links: {},
                },
            };
            const incoming: DurableStoreEntry<DurableRecordRepresentation> = {
                data: {
                    apiName: 'Account',
                    childRelationships: {},
                    eTag: '',
                    weakEtag: 2,
                    id: 'foo',
                    fields: {
                        Name: {
                            value: 'Jason',
                            displayValue: 'Jason',
                        },
                        Birthday: {
                            value: '09-17-1988',
                            displayValue: null,
                        },
                    },
                    lastModifiedById: null,
                    lastModifiedDate: null,
                    recordTypeId: null,
                    recordTypeInfo: null,
                    systemModstamp: null,
                    links: {},
                },
            };

            const expected: DurableStoreEntry<DurableRecordRepresentation> = {
                data: {
                    apiName: 'Account',
                    childRelationships: {},
                    eTag: '',
                    weakEtag: 2,
                    id: 'foo',
                    fields: {
                        Name: {
                            value: 'Jason',
                            displayValue: 'Jason',
                        },
                        Birthday: {
                            value: '09-17-1988',
                            displayValue: null,
                        },
                    },
                    lastModifiedById: null,
                    lastModifiedDate: null,
                    recordTypeId: null,
                    recordTypeInfo: null,
                    systemModstamp: null,
                    links: {},
                },
            };

            const result = durableMerge(existing, incoming, [], undefined, '', refreshSpy);
            expect(result).toEqual(expected);
            expect(refreshSpy).toBeCalledTimes(0);
        });
        it('newer incoming overwrites existing and applies drafts', () => {
            const refreshSpy = jest.fn();
            const existingServerName = 'Justin';
            const incomingServerName = 'Wes';

            const existing: DurableStoreEntry<DurableRecordRepresentation> = {
                data: {
                    apiName: 'Account',
                    childRelationships: {},
                    eTag: '',
                    weakEtag: 1,
                    id: RECORD_ID,
                    fields: {
                        Name: {
                            value: draftName,
                            displayValue: draftName,
                        },
                        IsMad: {
                            value: true,
                            displayValue: '',
                        },
                    },
                    drafts: {
                        created: false,
                        edited: true,
                        deleted: true,
                        serverValues: {
                            Name: {
                                value: existingServerName,
                                displayValue: existingServerName,
                            },
                        },
                        draftActionIds: [draftId],
                    },
                    lastModifiedById: '',
                    lastModifiedDate: draftTimestampString,
                    recordTypeId: null,
                    recordTypeInfo: null,
                    systemModstamp: null,
                    links: {},
                },
            };
            const incoming: DurableStoreEntry<DurableRecordRepresentation> = {
                data: {
                    apiName: 'Account',
                    childRelationships: {},
                    eTag: '',
                    weakEtag: 2,
                    id: RECORD_ID,
                    fields: {
                        Name: {
                            value: incomingServerName,
                            displayValue: incomingServerName,
                        },
                        Birthday: {
                            value: '09-17-1988',
                            displayValue: null,
                        },
                    },
                    lastModifiedById: null,
                    lastModifiedDate: null,
                    recordTypeId: null,
                    recordTypeInfo: null,
                    systemModstamp: null,
                    links: {},
                },
            };

            const expected: DurableStoreEntry<DurableRecordRepresentation> = {
                data: {
                    apiName: 'Account',
                    childRelationships: {},
                    eTag: '',
                    weakEtag: 2,
                    id: RECORD_ID,
                    fields: {
                        Name: {
                            value: draftName,
                            displayValue: draftName,
                        },
                        Birthday: {
                            value: '09-17-1988',
                            displayValue: null,
                        },
                        LastModifiedById: {
                            displayValue: null,
                            value: '',
                        },
                        LastModifiedDate: {
                            displayValue: draftTimestampString,
                            value: draftTimestampString,
                        },
                    },
                    drafts: {
                        created: false,
                        edited: true,
                        deleted: false,
                        serverValues: {
                            Name: {
                                value: incomingServerName,
                                displayValue: incomingServerName,
                            },
                        },
                        draftActionIds: [draftId],
                    },
                    lastModifiedById: '',
                    lastModifiedDate: draftTimestampString,
                    recordTypeId: null,
                    recordTypeInfo: null,
                    systemModstamp: null,
                    links: {},
                },
            };

            const result = durableMerge(existing, incoming, [draftEdit], undefined, '', refreshSpy);
            expect(result).toEqual(expected);
            expect(refreshSpy).toBeCalledTimes(1);
            expect(refreshSpy).toBeCalledWith({
                optionalFields: ['Account.Name', 'Account.Birthday', 'Account.IsMad'],
                recordId: RECORD_ID,
            });
        });
        it('older incoming gets discarded and kicks off a unionized field refresh', () => {
            const refreshSpy = jest.fn();
            const originalName = 'Justin';

            const existing: DurableStoreEntry<DurableRecordRepresentation> = {
                data: {
                    apiName: 'Account',
                    childRelationships: {},
                    eTag: '',
                    weakEtag: 2,
                    id: RECORD_ID,
                    fields: {
                        Name: {
                            value: draftName,
                            displayValue: draftName,
                        },
                        IsMad: {
                            value: true,
                            displayValue: '',
                        },
                        LastModifiedById: {
                            displayValue: null,
                            value: '',
                        },
                        LastModifiedDate: {
                            displayValue: draftTimestampString,
                            value: draftTimestampString,
                        },
                    },
                    drafts: {
                        created: false,
                        edited: true,
                        deleted: true,
                        serverValues: {
                            Name: {
                                value: originalName,
                                displayValue: originalName,
                            },
                        },
                        draftActionIds: [draftId],
                    },
                    lastModifiedById: '',
                    lastModifiedDate: draftTimestampString,
                    recordTypeId: null,
                    recordTypeInfo: null,
                    systemModstamp: null,
                    links: {},
                },
            };
            const incoming: DurableStoreEntry<DurableRecordRepresentation> = {
                data: {
                    apiName: 'Account',
                    childRelationships: {},
                    eTag: '',
                    weakEtag: 1,
                    id: RECORD_ID,
                    fields: {
                        Name: {
                            value: 'Jason',
                            displayValue: 'Jason',
                        },
                        Birthday: {
                            value: '09-17-1988',
                            displayValue: null,
                        },
                    },
                    lastModifiedById: null,
                    lastModifiedDate: null,
                    recordTypeId: null,
                    recordTypeInfo: null,
                    systemModstamp: null,
                    links: {},
                },
            };

            const expected: DurableStoreEntry<DurableRecordRepresentation> = {
                data: {
                    apiName: 'Account',
                    childRelationships: {},
                    eTag: '',
                    weakEtag: 2,
                    id: RECORD_ID,
                    fields: {
                        Name: {
                            value: draftName,
                            displayValue: draftName,
                        },
                        IsMad: {
                            value: true,
                            displayValue: '',
                        },
                        LastModifiedById: {
                            displayValue: null,
                            value: '',
                        },
                        LastModifiedDate: {
                            displayValue: draftTimestampString,
                            value: draftTimestampString,
                        },
                    },
                    drafts: {
                        created: false,
                        edited: true,
                        deleted: false,
                        serverValues: {
                            Name: {
                                value: originalName,
                                displayValue: originalName,
                            },
                        },
                        draftActionIds: [draftId],
                    },
                    lastModifiedById: '',
                    lastModifiedDate: draftTimestampString,
                    recordTypeId: null,
                    recordTypeInfo: null,
                    systemModstamp: null,
                    links: {},
                },
            };

            const result = durableMerge(existing, incoming, [draftEdit], undefined, '', refreshSpy);
            expect(result).toEqual(expected);
            expect(refreshSpy).toBeCalledTimes(1);
            expect(refreshSpy).toBeCalledWith({
                recordId: RECORD_ID,
                optionalFields: [
                    'Account.Name',
                    'Account.Birthday',
                    'Account.IsMad',
                    'Account.LastModifiedById',
                    'Account.LastModifiedDate',
                ],
            });
        });
        it('older incoming gets discarded and does not kick of network refresh if fields are superset', () => {
            const refreshSpy = jest.fn();
            const serverName = 'Justin';

            const existing: DurableStoreEntry<DurableRecordRepresentation> = {
                data: {
                    apiName: 'Account',
                    childRelationships: {},
                    eTag: '',
                    weakEtag: 2,
                    id: RECORD_ID,
                    fields: {
                        Name: {
                            value: draftName,
                            displayValue: draftName,
                        },
                        IsMad: {
                            value: true,
                            displayValue: '',
                        },
                        LastModifiedById: {
                            displayValue: null,
                            value: '',
                        },
                        LastModifiedDate: {
                            displayValue: draftTimestampString,
                            value: draftTimestampString,
                        },
                    },
                    drafts: {
                        created: false,
                        edited: true,
                        deleted: false,
                        serverValues: {
                            Name: {
                                value: serverName,
                                displayValue: serverName,
                            },
                        },
                        draftActionIds: [draftId],
                    },
                    lastModifiedById: '',
                    lastModifiedDate: draftTimestampString,
                    recordTypeId: null,
                    recordTypeInfo: null,
                    systemModstamp: null,
                    links: {},
                },
            };
            const incoming: DurableStoreEntry<DurableRecordRepresentation> = {
                data: {
                    apiName: 'Account',
                    childRelationships: {},
                    eTag: '',
                    weakEtag: 1,
                    id: RECORD_ID,
                    fields: {
                        Name: {
                            value: 'Wes',
                            displayValue: 'Wes',
                        },
                    },
                    lastModifiedById: null,
                    lastModifiedDate: null,
                    recordTypeId: null,
                    recordTypeInfo: null,
                    systemModstamp: null,
                    links: {},
                },
            };

            const expected: DurableStoreEntry<DurableRecordRepresentation> = {
                data: {
                    apiName: 'Account',
                    childRelationships: {},
                    eTag: '',
                    weakEtag: 2,
                    id: RECORD_ID,
                    fields: {
                        Name: {
                            value: draftName,
                            displayValue: draftName,
                        },
                        IsMad: {
                            value: true,
                            displayValue: '',
                        },
                        LastModifiedById: {
                            displayValue: null,
                            value: '',
                        },
                        LastModifiedDate: {
                            displayValue: draftTimestampString,
                            value: draftTimestampString,
                        },
                    },
                    drafts: {
                        created: false,
                        edited: true,
                        deleted: false,
                        serverValues: {
                            Name: {
                                value: serverName,
                                displayValue: serverName,
                            },
                        },
                        draftActionIds: [draftId],
                    },
                    lastModifiedById: '',
                    lastModifiedDate: draftTimestampString,
                    recordTypeId: null,
                    recordTypeInfo: null,
                    systemModstamp: null,
                    links: {},
                },
            };

            const result = durableMerge(existing, incoming, [draftEdit], undefined, '', refreshSpy);
            expect(result).toEqual(expected);
            expect(refreshSpy).toBeCalledTimes(0);
        });
        it('refresh contains spanning id fields', () => {
            const refreshSpy = jest.fn();
            const existing: DurableStoreEntry<DurableRecordRepresentation> = {
                data: {
                    apiName: 'Account',
                    childRelationships: {},
                    eTag: '',
                    weakEtag: 1,
                    id: 'foo',
                    fields: {
                        Name: {
                            value: 'Justin',
                            displayValue: 'Justin',
                        },
                        IsMad: {
                            value: true,
                            displayValue: '',
                        },
                    },
                    lastModifiedById: null,
                    lastModifiedDate: null,
                    recordTypeId: null,
                    recordTypeInfo: null,
                    systemModstamp: null,
                    links: {},
                },
            };
            const incoming: DurableStoreEntry<DurableRecordRepresentation> = {
                data: {
                    apiName: 'Account',
                    childRelationships: {},
                    eTag: '',
                    weakEtag: 2,
                    id: 'foo',
                    fields: {
                        Name: {
                            value: 'Jason',
                            displayValue: 'Jason',
                        },
                        Birthday: {
                            value: '09-17-1988',
                            displayValue: null,
                        },
                        Owner: {
                            __ref: 'SomeOtherRecord',
                        },
                    },
                    lastModifiedById: null,
                    lastModifiedDate: null,
                    recordTypeId: null,
                    recordTypeInfo: null,
                    systemModstamp: null,
                    links: {},
                },
            };

            const expected: DurableStoreEntry<DurableRecordRepresentation> = {
                data: {
                    apiName: 'Account',
                    childRelationships: {},
                    eTag: '',
                    weakEtag: 2,
                    id: 'foo',
                    fields: {
                        Name: {
                            value: 'Jason',
                            displayValue: 'Jason',
                        },
                        Birthday: {
                            value: '09-17-1988',
                            displayValue: null,
                        },
                        Owner: {
                            __ref: 'SomeOtherRecord',
                        },
                    },
                    lastModifiedById: null,
                    lastModifiedDate: null,
                    recordTypeId: null,
                    recordTypeInfo: null,
                    systemModstamp: null,
                    links: {},
                },
            };

            const result = durableMerge(existing, incoming, [], undefined, '', refreshSpy);
            expect(result).toEqual(expected);
            expect(refreshSpy).toBeCalledTimes(1);

            expect(refreshSpy).toBeCalledWith({
                recordId: 'foo',
                optionalFields: [
                    'Account.Name',
                    'Account.Birthday',
                    'Account.Owner.Id',
                    'Account.IsMad',
                ],
            });
        });
        it('merged data gets incoming expiration applied', () => {
            const refreshSpy = jest.fn();
            const existing: DurableStoreEntry<DurableRecordRepresentation> = {
                data: {
                    apiName: 'Account',
                    childRelationships: {},
                    eTag: '',
                    weakEtag: 1,
                    id: 'foo',
                    fields: {
                        Name: {
                            value: 'Justin',
                            displayValue: 'Justin',
                        },
                    },
                    lastModifiedById: null,
                    lastModifiedDate: null,
                    recordTypeId: null,
                    recordTypeInfo: null,
                    systemModstamp: null,
                    links: {},
                },
                expiration: { stale: 1, fresh: 1 },
            };
            const incoming: DurableStoreEntry<DurableRecordRepresentation> = {
                data: {
                    apiName: 'Account',
                    childRelationships: {},
                    eTag: '',
                    weakEtag: 1,
                    id: 'foo',
                    fields: {
                        Name: {
                            value: 'Justin',
                            displayValue: 'Justin',
                        },
                        Birthday: {
                            value: '09-17-1988',
                            displayValue: null,
                        },
                    },
                    lastModifiedById: null,
                    lastModifiedDate: null,
                    recordTypeId: null,
                    recordTypeInfo: null,
                    systemModstamp: null,
                    links: {},
                },
                expiration: { stale: 2, fresh: 2 },
            };

            const expected: DurableStoreEntry<DurableRecordRepresentation> = {
                data: {
                    apiName: 'Account',
                    childRelationships: {},
                    eTag: '',
                    weakEtag: 1,
                    id: 'foo',
                    fields: {
                        Name: {
                            value: 'Justin',
                            displayValue: 'Justin',
                        },
                        Birthday: {
                            value: '09-17-1988',
                            displayValue: null,
                        },
                    },
                    lastModifiedById: null,
                    lastModifiedDate: null,
                    recordTypeId: null,
                    recordTypeInfo: null,
                    systemModstamp: null,
                    links: {},
                },
                expiration: { stale: 2, fresh: 2 },
            };

            const result = durableMerge(existing, incoming, [], undefined, '', refreshSpy);
            expect(result).toEqual(expected);
        });

        it('merge incoming record with drafts on it', () => {
            const refreshSpy = jest.fn();
            const existingServerName = 'Justin';
            const incomingServerName = 'Wes';
            const oldDraftName = 'DratName';

            // existing has drafts on it
            const existing: DurableStoreEntry<DurableRecordRepresentation> = {
                data: {
                    apiName: 'Account',
                    childRelationships: {},
                    eTag: '',
                    weakEtag: 1,
                    id: RECORD_ID,
                    fields: {
                        Name: {
                            value: oldDraftName,
                            displayValue: oldDraftName,
                        },
                        IsMad: {
                            value: true,
                            displayValue: '',
                        },
                    },
                    drafts: {
                        created: false,
                        edited: true,
                        deleted: true,
                        serverValues: {
                            Name: {
                                value: existingServerName,
                                displayValue: existingServerName,
                            },
                        },
                        draftActionIds: ['some-old-draft'],
                    },
                    lastModifiedById: '',
                    lastModifiedDate: draftTimestampString,
                    recordTypeId: null,
                    recordTypeInfo: null,
                    systemModstamp: null,
                    links: {},
                },
            };

            // incoming has drafts on it
            const incoming: DurableStoreEntry<DurableRecordRepresentation> = {
                data: {
                    apiName: 'Account',
                    childRelationships: {},
                    eTag: '',
                    weakEtag: 2,
                    id: RECORD_ID,
                    fields: {
                        Name: {
                            value: draftName,
                            displayValue: draftName,
                        },
                        Birthday: {
                            value: '09-17-1988',
                            displayValue: null,
                        },
                    },
                    drafts: {
                        created: false,
                        edited: true,
                        deleted: true,
                        serverValues: {
                            Name: {
                                value: incomingServerName,
                                displayValue: incomingServerName,
                            },
                        },
                        draftActionIds: [draftId],
                    },
                    lastModifiedById: null,
                    lastModifiedDate: null,
                    recordTypeId: null,
                    recordTypeInfo: null,
                    systemModstamp: null,
                    links: {},
                },
            };

            const expected: DurableStoreEntry<DurableRecordRepresentation> = {
                data: {
                    apiName: 'Account',
                    childRelationships: {},
                    eTag: '',
                    weakEtag: 2,
                    id: RECORD_ID,
                    fields: {
                        Name: {
                            value: draftName,
                            displayValue: draftName,
                        },
                        Birthday: {
                            value: '09-17-1988',
                            displayValue: null,
                        },
                        LastModifiedById: {
                            displayValue: null,
                            value: '',
                        },
                        LastModifiedDate: {
                            displayValue: draftTimestampString,
                            value: draftTimestampString,
                        },
                    },
                    drafts: {
                        created: false,
                        edited: true,
                        deleted: false,
                        serverValues: {
                            Name: {
                                value: incomingServerName,
                                displayValue: incomingServerName,
                            },
                        },
                        draftActionIds: [draftId],
                    },
                    lastModifiedById: '',
                    lastModifiedDate: draftTimestampString,
                    recordTypeId: null,
                    recordTypeInfo: null,
                    systemModstamp: null,
                    links: {},
                },
            };

            const result = durableMerge(existing, incoming, [draftEdit], undefined, '', refreshSpy);
            expect(result).toEqual(expected);
            expect(refreshSpy).toBeCalledTimes(1);

            expect(refreshSpy).toBeCalledWith({
                recordId: RECORD_ID,
                optionalFields: ['Account.Name', 'Account.Birthday', 'Account.IsMad'],
            });
        });

        it('newer incoming record with missing field but field has draft applied', () => {
            const refreshSpy = jest.fn();
            const serverName = 'Justin';

            // existing has drafts on it
            const existing: DurableStoreEntry<DurableRecordRepresentation> = {
                data: {
                    apiName: 'Account',
                    childRelationships: {},
                    eTag: '',
                    weakEtag: 1,
                    id: RECORD_ID,
                    fields: {
                        Name: {
                            value: draftName,
                            displayValue: draftName,
                        },
                        IsMad: {
                            value: true,
                            displayValue: '',
                        },
                        LastModifiedById: {
                            displayValue: null,
                            value: '',
                        },
                        LastModifiedDate: {
                            displayValue: draftTimestampString,
                            value: draftTimestampString,
                        },
                    },
                    drafts: {
                        created: false,
                        edited: true,
                        deleted: true,
                        serverValues: {
                            Name: {
                                value: serverName,
                                displayValue: serverName,
                            },
                        },
                        draftActionIds: [draftId],
                    },
                    lastModifiedById: '',
                    lastModifiedDate: draftTimestampString,
                    recordTypeId: null,
                    recordTypeInfo: null,
                    systemModstamp: null,
                    links: {},
                },
            };

            // incoming does not have the Name field
            const incoming: DurableStoreEntry<DurableRecordRepresentation> = {
                data: {
                    apiName: 'Account',
                    childRelationships: {},
                    eTag: '',
                    weakEtag: 2,
                    id: RECORD_ID,
                    fields: {
                        Birthday: {
                            value: '09-17-1988',
                            displayValue: null,
                        },
                    },
                    lastModifiedById: null,
                    lastModifiedDate: null,
                    recordTypeId: null,
                    recordTypeInfo: null,
                    systemModstamp: null,
                    links: {},
                },
            };

            // since we don't have an up to date Name field, it gets removed from serverValues
            const expected: DurableStoreEntry<DurableRecordRepresentation> = {
                data: {
                    apiName: 'Account',
                    childRelationships: {},
                    eTag: '',
                    weakEtag: 2,
                    id: RECORD_ID,
                    fields: {
                        Name: {
                            value: draftName,
                            displayValue: draftName,
                        },
                        Birthday: {
                            value: '09-17-1988',
                            displayValue: null,
                        },
                        LastModifiedById: {
                            displayValue: null,
                            value: '',
                        },
                        LastModifiedDate: {
                            displayValue: draftTimestampString,
                            value: draftTimestampString,
                        },
                    },
                    drafts: {
                        created: false,
                        edited: true,
                        deleted: false,
                        serverValues: {},
                        draftActionIds: [draftId],
                    },
                    lastModifiedById: '',
                    lastModifiedDate: draftTimestampString,
                    recordTypeId: null,
                    recordTypeInfo: null,
                    systemModstamp: null,
                    links: {},
                },
            };

            const result = durableMerge(existing, incoming, [draftEdit], undefined, '', refreshSpy);
            expect(result).toEqual(expected);
            expect(refreshSpy).toBeCalledTimes(1);
            expect(refreshSpy).toBeCalledWith({
                recordId: RECORD_ID,
                optionalFields: [
                    'Account.Birthday',
                    'Account.Name',
                    'Account.IsMad',
                    'Account.LastModifiedById',
                    'Account.LastModifiedDate',
                ],
            });
        });

        it('merges draft created data properly', () => {
            const refreshSpy = jest.fn();
            const draftName = 'Justin';
            const updatedDraftName = 'Jason';
            const createDraft = createPostDraftAction(
                STORE_KEY_DRAFT_RECORD,
                DRAFT_RECORD_ID,
                draftName
            );
            const updateDraft = createEditDraftAction(
                DRAFT_RECORD_ID,
                STORE_KEY_DRAFT_RECORD,
                updatedDraftName
            );

            // existing is a draft create
            const existing: DurableStoreEntry<DurableRecordRepresentation> = {
                data: {
                    apiName: 'Account',
                    childRelationships: {},
                    eTag: '',
                    weakEtag: -1,
                    id: DRAFT_RECORD_ID,
                    fields: {
                        Name: {
                            value: draftName,
                            displayValue: draftName,
                        },
                        LastModifiedById: {
                            displayValue: null,
                            value: '',
                        },
                        LastModifiedDate: {
                            displayValue: DEFAULT_DRAFT_TIMESTAMP_FORMATTED,
                            value: DEFAULT_DRAFT_TIMESTAMP_FORMATTED,
                        },
                    },
                    drafts: {
                        created: true,
                        edited: false,
                        deleted: false,
                        serverValues: {},
                        draftActionIds: [createDraft.id],
                    },
                    lastModifiedById: '',
                    lastModifiedDate: DEFAULT_DRAFT_TIMESTAMP_FORMATTED,
                    recordTypeId: null,
                    recordTypeInfo: null,
                    systemModstamp: null,
                    links: {},
                },
            };

            // incoming is the draft create with edit
            const incoming: DurableStoreEntry<DurableRecordRepresentation> = {
                data: {
                    apiName: 'Account',
                    childRelationships: {},
                    eTag: '',
                    weakEtag: -1,
                    id: DRAFT_RECORD_ID,
                    fields: {
                        Name: {
                            value: updatedDraftName,
                            displayValue: updatedDraftName,
                        },
                        LastModifiedById: {
                            displayValue: null,
                            value: '',
                        },
                        LastModifiedDate: {
                            displayValue: DEFAULT_DRAFT_TIMESTAMP_FORMATTED,
                            value: DEFAULT_DRAFT_TIMESTAMP_FORMATTED,
                        },
                    },
                    drafts: {
                        created: true,
                        edited: true,
                        deleted: false,
                        serverValues: {},
                        draftActionIds: [createDraft.id, updateDraft.id],
                    },
                    lastModifiedById: null,
                    lastModifiedDate: DEFAULT_DRAFT_TIMESTAMP_FORMATTED,
                    recordTypeId: '',
                    recordTypeInfo: null,
                    systemModstamp: null,
                    links: {},
                },
            };

            // since we don't have an up to date Name field, it gets removed from serverValues
            const expected: DurableStoreEntry<DurableRecordRepresentation> = {
                data: {
                    apiName: 'Account',
                    childRelationships: {},
                    eTag: '',
                    weakEtag: -1,
                    id: DRAFT_RECORD_ID,
                    fields: {
                        CreatedById: { value: '', displayValue: null },
                        CreatedDate: { value: 12345, displayValue: null },
                        Id: { value: 'DRAxx000001XL1tAAG', displayValue: null },
                        LastModifiedById: {
                            displayValue: null,
                            value: '',
                        },
                        LastModifiedDate: {
                            displayValue: DEFAULT_DRAFT_TIMESTAMP_FORMATTED,
                            value: DEFAULT_DRAFT_TIMESTAMP_FORMATTED,
                        },
                        Name: {
                            value: updatedDraftName,
                            displayValue: updatedDraftName,
                        },
                        OwnerId: { value: '', displayValue: null },
                    },
                    drafts: {
                        created: true,
                        edited: true,
                        deleted: false,
                        serverValues: {},
                        draftActionIds: [createDraft.id, updateDraft.id],
                    },
                    lastModifiedById: '',
                    lastModifiedDate: DEFAULT_DRAFT_TIMESTAMP_FORMATTED,
                    recordTypeId: null,
                    recordTypeInfo: null,
                    systemModstamp: DEFAULT_TIME_STAMP.toString(),
                    links: {
                        CreatedById: {
                            __ref: 'UiApi::RecordRepresentation:DRAxx000001XL1tAAG__fields__CreatedById',
                        },
                        CreatedDate: {
                            __ref: 'UiApi::RecordRepresentation:DRAxx000001XL1tAAG__fields__CreatedDate',
                        },
                        Id: { __ref: 'UiApi::RecordRepresentation:DRAxx000001XL1tAAG__fields__Id' },
                        LastModifiedById: {
                            __ref: 'UiApi::RecordRepresentation:DRAxx000001XL1tAAG__fields__LastModifiedById',
                        },
                        LastModifiedDate: {
                            __ref: 'UiApi::RecordRepresentation:DRAxx000001XL1tAAG__fields__LastModifiedDate',
                        },
                        Name: {
                            __ref: 'UiApi::RecordRepresentation:DRAxx000001XL1tAAG__fields__Name',
                        },
                        OwnerId: {
                            __ref: 'UiApi::RecordRepresentation:DRAxx000001XL1tAAG__fields__OwnerId',
                        },
                    },
                },
            };

            const result = durableMerge(
                existing,
                incoming,
                [createDraft, updateDraft],
                undefined,
                '',
                refreshSpy
            );
            expect(result).toEqual(expected);
        });
    });

    describe('removeDrafts', () => {
        it('restores server values from drafts node', () => {
            const record: DurableRecordRepresentation = {
                apiName: 'Account',
                childRelationships: {},
                eTag: '',
                weakEtag: 1,
                id: 'foo',
                fields: {
                    Name: {
                        value: 'Justin',
                        displayValue: 'Justin',
                    },
                },
                drafts: {
                    created: false,
                    edited: true,
                    deleted: false,
                    serverValues: {
                        Name: {
                            value: 'Jason',
                            displayValue: 'Jason',
                        },
                    },
                    draftActionIds: ['foo'],
                },
                lastModifiedById: null,
                lastModifiedDate: null,
                recordTypeId: null,
                recordTypeInfo: null,
                systemModstamp: null,
                links: {
                    Name: {
                        __ref: 'UiApi::RecordRepresentation:DRAxx000001XL1tAAG__fields__Name',
                    },
                },
            };

            const draftless = removeDrafts(record);
            expect(draftless.drafts).toBeUndefined();
            expect((draftless.fields.Name as any).value).toBe('Jason');
            expect((draftless.fields.Name as any).displayValue).toBe('Jason');
        });
        it('returns undefined for draft created record', () => {
            const record: DurableRecordRepresentation = {
                apiName: 'Account',
                childRelationships: {},
                eTag: '',
                weakEtag: 1,
                id: 'foo',
                fields: {
                    Name: {
                        value: 'Justin',
                        displayValue: 'Justin',
                    },
                },
                drafts: {
                    created: true,
                    edited: true,
                    deleted: false,
                    serverValues: {
                        Name: {
                            value: 'Jason',
                            displayValue: 'Jason',
                        },
                    },
                    draftActionIds: ['foo'],
                },
                lastModifiedById: null,
                lastModifiedDate: null,
                recordTypeId: null,
                recordTypeInfo: null,
                systemModstamp: null,
                links: {
                    Name: {
                        __ref: 'UiApi::RecordRepresentation:DRAxx000001XL1tAAG__fields__Name',
                    },
                },
            };

            const draftless = removeDrafts(record);
            expect(draftless).toBeUndefined();
        });

        it('returns record unmodified if no drafts applied', () => {
            const record: DurableRecordRepresentation = {
                apiName: 'Account',
                childRelationships: {},
                eTag: '',
                weakEtag: 1,
                id: 'foo',
                fields: {
                    Name: {
                        value: 'Justin',
                        displayValue: 'Justin',
                    },
                },
                lastModifiedById: null,
                lastModifiedDate: null,
                recordTypeId: null,
                recordTypeInfo: null,
                systemModstamp: null,
                links: {
                    Name: {
                        __ref: 'UiApi::RecordRepresentation:DRAxx000001XL1tAAG__fields__Name',
                    },
                },
            };

            const draftless = removeDrafts(record);
            expect(draftless.drafts).toBeUndefined();
            expect((draftless.fields.Name as any).value).toBe('Justin');
            expect((draftless.fields.Name as any).displayValue).toBe('Justin');
        });

        it('does not modify a field that does not contain a draft change', () => {
            const record: DurableRecordRepresentation = {
                apiName: 'Account',
                childRelationships: {},
                eTag: '',
                weakEtag: 1,
                id: 'foo',
                fields: {
                    Name: {
                        value: 'Justin',
                        displayValue: 'Justin',
                    },
                    IsMad: {
                        value: true,
                        displayValue: null,
                    },
                },
                drafts: {
                    created: false,
                    edited: true,
                    deleted: false,
                    serverValues: {
                        Name: {
                            value: 'Jason',
                            displayValue: 'Jason',
                        },
                    },
                    draftActionIds: ['foo'],
                },
                lastModifiedById: null,
                lastModifiedDate: null,
                recordTypeId: null,
                recordTypeInfo: null,
                systemModstamp: null,
                links: {
                    Name: {
                        __ref: 'UiApi::RecordRepresentation:DRAxx000001XL1tAAG__fields__Name',
                    },
                    IsMad: {
                        __ref: 'UiApi::RecordRepresentation:DRAxx000001XL1tAAG__fields__IsMad',
                    },
                },
            };

            const draftless = removeDrafts(record);
            expect(draftless.drafts).toBeUndefined();
            expect((draftless.fields.Name as any).value).toBe('Jason');
            expect((draftless.fields.IsMad as any).value).toBe(true);
        });

        it('handles draft deleted', () => {
            const record: DurableRecordRepresentation = {
                apiName: 'Account',
                childRelationships: {},
                eTag: '',
                weakEtag: 1,
                id: 'foo',
                fields: {
                    Name: {
                        value: 'Justin',
                        displayValue: 'Justin',
                    },
                },
                drafts: {
                    created: false,
                    edited: true,
                    deleted: true,
                    serverValues: {},
                    draftActionIds: ['foo'],
                },
                lastModifiedById: null,
                lastModifiedDate: null,
                recordTypeId: null,
                recordTypeInfo: null,
                systemModstamp: null,
                links: {
                    Name: {
                        __ref: 'UiApi::RecordRepresentation:DRAxx000001XL1tAAG__fields__Name',
                    },
                },
            };

            const draftless = removeDrafts(record);
            expect(draftless.drafts).toBeUndefined();
            expect((draftless.fields.Name as any).value).toBe('Justin');
            expect((draftless.fields.Name as any).displayValue).toBe('Justin');
        });
    });

    describe('getDraftResolutionInfoForRecordSet', () => {
        it('returns draft resolution info when present', async () => {
            const mockRecordId = 'Record1';
            const mockRecord = { data: { apiName: OpportunityObjectInfo.apiName } };
            const opportunityEntry = { data: OpportunityObjectInfo };
            const mockDraft = { mockDraft: true, handler: LDS_ACTION_HANDLER_ID };

            const recordSet = {
                [mockRecordId]: mockRecord,
            } as any;

            const durableStore = {
                getEntries: jest.fn().mockResolvedValue({
                    [OPPORTUNITY_OBJECT_INFO_KEY]: opportunityEntry,
                }),
            } as any;

            const getDraftActions = jest.fn().mockResolvedValue({
                [mockRecordId]: [mockDraft],
            });

            const info = await getDraftResolutionInfoForRecordSet(
                recordSet,
                durableStore,
                getDraftActions
            );
            expect(info).toBeDefined();
            const { record, objectInfo, drafts } = info[mockRecordId];
            expect(record).toEqual(mockRecord);
            expect(objectInfo).toEqual(objectInfo);
            expect(drafts.length).toEqual(1);
            expect(drafts[0]).toEqual(mockDraft);
        });
        it('does not return non lds drafts', async () => {
            const mockRecordId = 'Record1';
            const mockRecord = { data: { apiName: OpportunityObjectInfo.apiName } };
            const opportunityEntry = { data: OpportunityObjectInfo };
            const mockDraft = { mockDraft: true, handler: LDS_ACTION_HANDLER_ID };
            const nonLDSDraft = { mockDraft: true, handler: 'Custom' };

            const recordSet = {
                [mockRecordId]: mockRecord,
            } as any;

            const durableStore = {
                getEntries: jest.fn().mockResolvedValue({
                    [OPPORTUNITY_OBJECT_INFO_KEY]: opportunityEntry,
                }),
            } as any;

            const getDraftActions = jest.fn().mockResolvedValue({
                [mockRecordId]: [mockDraft, nonLDSDraft],
            });

            const info = await getDraftResolutionInfoForRecordSet(
                recordSet,
                durableStore,
                getDraftActions
            );
            expect(info).toBeDefined();
            const { record, objectInfo, drafts } = info[mockRecordId];
            expect(record).toEqual(mockRecord);
            expect(objectInfo).toEqual(objectInfo);
            expect(drafts.length).toEqual(1);
            expect(drafts[0]).toEqual(mockDraft);
        });
        it('does not retrieve info for error entry', async () => {
            const mockRecordId = 'Record1';
            const mockRecord = { data: { __type: 'error' } };
            const opportunityEntry = { data: OpportunityObjectInfo };
            const mockDraft = { mockDraft: true, handler: LDS_ACTION_HANDLER_ID };

            const recordSet = {
                [mockRecordId]: mockRecord,
            } as any;

            const durableStore = {
                getEntries: jest.fn().mockResolvedValue({
                    [OPPORTUNITY_OBJECT_INFO_KEY]: opportunityEntry,
                }),
            } as any;

            const getDraftActions = jest.fn().mockResolvedValue({
                [mockRecordId]: [mockDraft],
            });

            const info = await getDraftResolutionInfoForRecordSet(
                recordSet,
                durableStore,
                getDraftActions
            );
            expect(info).toBeDefined();
            expect(info[mockRecordId]).toBeUndefined();
        });
        it('returns empty array when no drafts present for record', async () => {
            const mockRecordId = 'Record1';
            const mockRecord = { data: { apiName: OpportunityObjectInfo.apiName } };
            const opportunityEntry = { data: OpportunityObjectInfo };

            const recordSet = {
                [mockRecordId]: mockRecord,
            } as any;

            const durableStore = {
                getEntries: jest.fn().mockResolvedValue({
                    [OPPORTUNITY_OBJECT_INFO_KEY]: opportunityEntry,
                }),
            } as any;

            const getDraftActions = jest.fn().mockResolvedValue({
                [mockRecordId]: [],
            });

            const info = await getDraftResolutionInfoForRecordSet(
                recordSet,
                durableStore,
                getDraftActions
            );
            expect(info).toBeDefined();
            const { record, objectInfo, drafts } = info[mockRecordId];
            expect(record).toEqual(mockRecord);
            expect(objectInfo).toEqual(objectInfo);
            expect(drafts.length).toEqual(0);
        });
        it('throws when missing object info and drafts are present', async () => {
            const mockRecordId = 'Record1';
            const mockRecord = { data: { apiName: OpportunityObjectInfo.apiName } };
            const mockDraft = { mockDraft: true, handler: LDS_ACTION_HANDLER_ID };

            const recordSet = {
                [mockRecordId]: mockRecord,
            } as any;

            const durableStore = {
                getEntries: jest.fn().mockResolvedValue({}),
            } as any;

            const getDraftActions = jest.fn().mockResolvedValue({
                [mockRecordId]: [mockDraft],
            });

            await expect(
                getDraftResolutionInfoForRecordSet(recordSet, durableStore, getDraftActions)
            ).rejects.toThrowError(
                new Error(
                    `Missing ${OpportunityObjectInfo.apiName} object info in cache when drafts are present, drafts may not resolve correctly.`
                )
            );
        });
    });

    describe('getObjectApiNamesFromDraftCreateEntries', () => {
        it('extracts api name from set of draft creates', () => {
            const postAction1 = { data: { method: 'post', body: { apiName: 'Account' } } };
            const postAction2 = { data: { method: 'post', body: { apiName: 'Opportunity' } } };
            const entries = {
                '1': { data: postAction1 },
                '2': { data: postAction2 },
            } as any;

            const apiNames = getObjectApiNamesFromDraftCreateEntries(entries);
            expect(apiNames).toEqual(['Account', 'Opportunity']);
        });

        it('filters out duplicate apiNames', () => {
            const postAction1 = { data: { method: 'post', body: { apiName: 'Account' } } };
            const postAction2 = { data: { method: 'post', body: { apiName: 'Account' } } };
            const entries = {
                '1': { data: postAction1 },
                '2': { data: postAction2 },
            } as any;

            const apiNames = getObjectApiNamesFromDraftCreateEntries(entries);
            expect(apiNames).toEqual(['Account']);
        });
        it('throws if any entry is not a draft action', () => {
            const postAction1 = { data: { someRandomData: true } };
            const postAction2 = { data: { method: 'post', body: { apiName: 'Account' } } };
            const entries = {
                '1': { data: postAction1 },
                '2': { data: postAction2 },
            } as any;

            expect(() => getObjectApiNamesFromDraftCreateEntries(entries)).toThrow(
                new Error('Can only extract apiName from record post request')
            );
        });

        it('throws if any action is not post', () => {
            const postAction1 = { data: { method: 'get', body: { apiName: 'Account' } } };
            const entries = {
                '1': { data: postAction1 },
            } as any;

            expect(() => getObjectApiNamesFromDraftCreateEntries(entries)).toThrow(
                new Error('Can only extract apiName from record post request')
            );
        });
        it('returns empty array for empty input', () => {
            const result = getObjectApiNamesFromDraftCreateEntries({});
            expect(result).toEqual([]);
        });
    });
});
