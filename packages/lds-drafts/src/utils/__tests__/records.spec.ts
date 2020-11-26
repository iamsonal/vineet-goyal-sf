import { Environment, Store } from '@luvio/engine';
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
} from '../../__tests__/test-utils';
import {
    buildRecordFieldValueRepresentationsFromDraftFields,
    buildSyntheticRecordRepresentation,
    extractRecordApiNameFromStore,
    getRecordFieldsFromRecordRequest,
    getRecordIdFromRecordRequest,
    getRecordKeyForId,
    shouldDraftResourceRequest,
    replayDraftsOnRecord,
    buildDraftDurableStoreKey,
    extractRecordKeyFromDraftDurableStoreKey,
} from '../records';

function generateId(prefix: string): string {
    return prefix + `DRAFT`;
}
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
            const syntheticRecord = buildSyntheticRecordRepresentation(
                DRAFT_RECORD_ID,
                DEFAULT_API_NAME,
                { Name: DEFAULT_NAME_FIELD_VALUE }
            );

            expect(syntheticRecord).toEqual({
                id: DRAFT_RECORD_ID,
                apiName: DEFAULT_API_NAME,
                childRelationships: {},
                eTag: '',
                lastModifiedById: null,
                lastModifiedDate: expect.any(String),
                recordTypeId: null,
                recordTypeInfo: null,
                systemModstamp: expect.any(String),
                weakEtag: -1,
                fields: {
                    Name: {
                        value: DEFAULT_NAME_FIELD_VALUE,
                        displayValue: DEFAULT_NAME_FIELD_VALUE,
                    },
                },
            });
        });
    });

    describe('getRecordIdFromRequest', () => {
        it('creates a draft record id for a post request', () => {
            const request = createPostRequest();
            const id = getRecordIdFromRecordRequest(request, generateId);
            expect(id).toBe('AccDRAFT');
        });

        it('returns undefined if apiName is not in post request', () => {
            const request = createPostRequest();
            delete request.body.apiName;
            const id = getRecordIdFromRecordRequest(request, generateId);
            expect(id).toBe(undefined);
        });

        it('gets record id from patch request', () => {
            const request = createPatchRequest();
            const id = getRecordIdFromRecordRequest(request, generateId);
            expect(id).toBe(RECORD_ID);
        });

        it('gets record id from a delete request', () => {
            const request = createDeleteRequest();
            const id = getRecordIdFromRecordRequest(request, generateId);
            expect(id).toBe(RECORD_ID);
        });

        it('returns undefined if method not recognized', () => {
            const request = {
                baseUri: '/services/data/v51.0',
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
            const id = getRecordIdFromRecordRequest(request, generateId);
            expect(id).toBeUndefined();
        });

        it('returns undefined if not record cud endpoint', () => {
            const request = {
                baseUri: '/services/data/v51.0',
                basePath: `/ui-api/records/somethingelse/${RECORD_ID}`,
                method: 'delete',
                body: {},
                urlParams: {},
                queryParams: {},
                headers: {},
            };
            const id = getRecordIdFromRecordRequest(request, generateId);
            expect(id).toBeUndefined();
        });

        it('returns undefined if base path is unexpected', () => {
            const request = {
                baseUri: '/services/data/v51.0',
                basePath: `/ui-api/records/${RECORD_ID}/something`,
                method: 'delete',
                body: {},
                urlParams: {},
                queryParams: {},
                headers: {},
            };
            const id = getRecordIdFromRecordRequest(request, generateId);
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
            expect(fields).toEqual(['Name']);
        });
        it('returns fields for patch request', () => {
            const fields = getRecordFieldsFromRecordRequest(createPatchRequest());
            expect(fields).toEqual(['Name']);
        });
        it('returns undefined for unsupported method', () => {
            const fields = getRecordFieldsFromRecordRequest(createDeleteRequest());
            expect(fields).toEqual(undefined);
        });

        it('returns undefined for missing body', () => {
            const request = createPostRequest();
            delete request.body;
            const fields = getRecordFieldsFromRecordRequest(request);
            expect(fields).toEqual(undefined);
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

    describe('shouldDraftResourceRequest', () => {
        it('returns true for valid post request', () => {
            expect(shouldDraftResourceRequest(createPostRequest())).toBe(true);
        });

        it('returns true for valid patch request', () => {
            expect(shouldDraftResourceRequest(createPatchRequest())).toBe(true);
        });

        it('returns true for valid delete request', () => {
            expect(shouldDraftResourceRequest(createDeleteRequest())).toBe(true);
        });

        it('returns false for non record endpoint', () => {
            const request = createPostRequest();
            request.basePath = '/ui-api/records-ui/';
            expect(shouldDraftResourceRequest(request)).toBe(false);
        });

        it('returns false for non supported method', () => {
            const request = createPostRequest();
            request.method = 'put';
            expect(shouldDraftResourceRequest(request)).toBe(false);
        });
    });

    describe('replayDraftsOnRecord', () => {
        it('returns unmodified record if no draft actions', () => {
            const record = {} as any;
            const result = replayDraftsOnRecord(record, []);

            expect(result).toBe(record);
        });

        it('returns unmodified record if draft action undefined', () => {
            const record = {} as any;
            const result = replayDraftsOnRecord(record, [undefined]);

            expect(result).toBe(record);
        });

        it('throws error on POST', () => {
            expect(() =>
                replayDraftsOnRecord({} as any, [{ request: { method: 'post' } } as any])
            ).toThrowError();
        });

        it('throws if draft action after a delete is present', () => {
            expect(() =>
                replayDraftsOnRecord({} as any, [
                    { request: { method: 'delete' } } as any,
                    {} as any,
                ])
            ).toThrowError();
        });

        it('adds drafts node and fields for delete', () => {
            const record = {} as any;
            const result = replayDraftsOnRecord(record, [{ request: { method: 'delete' } } as any]);

            expect(result).toStrictEqual({
                drafts: {
                    created: false,
                    edited: false,
                    deleted: true,
                    serverValues: {},
                },
            });
        });

        it('adds drafts node and denormalized fields for patch', () => {
            const record = {
                id: '123',
                fields: { Name: { value: 'oldName', displayValue: null } },
            } as any;
            const result = replayDraftsOnRecord(record, [
                createEditDraftAction('123', 'UiApi::RecordRepresentation:123', 'newName'),
            ]);

            expect(result).toStrictEqual({
                id: '123',
                fields: {
                    Name: { value: 'newName', displayValue: 'newName' },
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
                },
            });
        });

        it('adds drafts node and linked fields for patch', () => {
            const record = buildDurableRecordRepresentation('123', {
                Name: { value: 'oldName', displayValue: null },
            });
            const result = replayDraftsOnRecord(record, [
                createEditDraftAction('123', 'UiApi::RecordRepresentation:123', 'newName'),
            ]);

            const expected = {
                ...buildDurableRecordRepresentation('123', {
                    Name: { value: 'newName', displayValue: 'newName' },
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
                },
            };

            expect(result).toStrictEqual(expected);
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
});
