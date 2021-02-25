import { HttpStatusCode } from '@luvio/engine';
import { RecordRepresentation } from '@salesforce/lds-adapters-uiapi';
import {
    buildRecordFieldStoreKey,
    extractRecordIdFromStoreKey,
} from '@salesforce/lds-uiapi-record-utils';
import { DRAFT_ERROR_CODE } from '../../DraftFetchResponse';
import { getRecordKeyForId } from '../../utils/records';
import {
    createPostRequest,
    DEFAULT_API_NAME,
    DEFAULT_NAME_FIELD_VALUE,
    DRAFT_RECORD_ID,
    DRAFT_STORE_KEY_FIELD__NAME,
    RECORD_ID,
    setupDraftEnvironment,
    STORE_KEY_DRAFT_RECORD,
} from './test-utils';

describe('draft environment tests', () => {
    describe('createRecord', () => {
        it('rejects when apiName is not in the request body', async () => {
            const { draftEnvironment } = setupDraftEnvironment();
            const { rejects } = await expect(
                draftEnvironment.dispatchResourceRequest({
                    baseUri: '/services/data/v52.0',
                    basePath: `/ui-api/records/`,
                    method: 'post',
                    body: {
                        fields: {
                            Name: DEFAULT_NAME_FIELD_VALUE,
                        },
                    },
                    urlParams: {},
                    queryParams: {},
                    headers: {},
                })
            );
            rejects.toMatchObject({
                body: {
                    message: 'apiName missing from request body.',
                },
                headers: {},
                status: 400,
            });
        });
        it('request gets enqueued with key as tag', async () => {
            const { draftEnvironment, draftQueue, durableStore } = setupDraftEnvironment();
            let assignedDraftId = '';
            let assignedDraftIdStoreKey = '';
            durableStore.getEntries = jest.fn().mockImplementation((keys: string[]) => {
                assignedDraftIdStoreKey = keys[0];
                assignedDraftId = extractRecordIdFromStoreKey(assignedDraftIdStoreKey);
                const nameKey = buildRecordFieldStoreKey(assignedDraftIdStoreKey, 'Name');
                return Promise.resolve({
                    [assignedDraftIdStoreKey]: {
                        data: {
                            apiName: DEFAULT_API_NAME,
                            childRelationships: {},
                            eTag: '',
                            fields: {
                                Name: {
                                    __ref: nameKey,
                                },
                            },
                            id: assignedDraftId,
                            lastModifiedById: null,
                            lastModifiedDate: null,
                            recordTypeId: null,
                            recordTypeInfo: null,
                            systemModstamp: null,
                            weakEtag: -1,
                        },
                    },

                    [nameKey]: {
                        data: {
                            displayValue: DEFAULT_NAME_FIELD_VALUE,
                            value: DEFAULT_NAME_FIELD_VALUE,
                        },
                    },
                });
            });
            const request = {
                baseUri: '/services/data/v52.0',
                basePath: `/ui-api/records/${RECORD_ID}`,
                method: 'post',
                body: {
                    apiName: DEFAULT_API_NAME,
                    fields: {
                        Name: DEFAULT_NAME_FIELD_VALUE,
                    },
                },
                urlParams: {},
                queryParams: {},
                headers: {},
            };

            await draftEnvironment.dispatchResourceRequest(request);

            expect(draftQueue.enqueue).toBeCalledWith(request, assignedDraftIdStoreKey);
        });

        it('throws if durable store rejects', async () => {
            const { draftEnvironment, durableStore } = setupDraftEnvironment();

            durableStore.getEntries = jest.fn().mockRejectedValue(undefined);
            const request = createPostRequest();

            await expect(draftEnvironment.dispatchResourceRequest(request)).rejects.toEqual({
                status: 500,
                headers: {},
            });
        });

        it('throws draft error if unable to synthesize draft after create', async () => {
            const { draftEnvironment, durableStore } = setupDraftEnvironment();
            durableStore.getEntries = jest.fn().mockResolvedValue(undefined);
            const request = createPostRequest();

            const { rejects } = await expect(draftEnvironment.dispatchResourceRequest(request));
            rejects.toMatchObject({
                body: {
                    errorCode: DRAFT_ERROR_CODE,
                },
                headers: {},
                status: HttpStatusCode.BadRequest,
            });
        });

        it('returns mutable data in the response', async () => {
            const { draftEnvironment, durableStore } = setupDraftEnvironment();
            let assignedDraftId = '';
            let assignedDraftIdStoreKey = '';
            durableStore.getEntries = jest.fn().mockImplementation((keys: string[]) => {
                assignedDraftIdStoreKey = keys[0];
                assignedDraftId = extractRecordIdFromStoreKey(assignedDraftIdStoreKey);
                const nameKey = buildRecordFieldStoreKey(assignedDraftIdStoreKey, 'Name');
                return Promise.resolve({
                    [assignedDraftIdStoreKey]: {
                        data: {
                            apiName: DEFAULT_API_NAME,
                            childRelationships: {},
                            eTag: '',
                            fields: {
                                Name: {
                                    __ref: nameKey,
                                },
                            },
                            id: assignedDraftId,
                            lastModifiedById: null,
                            lastModifiedDate: null,
                            recordTypeId: null,
                            recordTypeInfo: null,
                            systemModstamp: null,
                            weakEtag: -1,
                        },
                    },

                    [nameKey]: {
                        data: {
                            displayValue: DEFAULT_NAME_FIELD_VALUE,
                            value: DEFAULT_NAME_FIELD_VALUE,
                        },
                    },
                });
            });
            const request = createPostRequest();
            const result = await draftEnvironment.dispatchResourceRequest<RecordRepresentation>(
                request
            );

            const record = result.body;
            expect(record.fields.Name.value).toEqual(DEFAULT_NAME_FIELD_VALUE);
            const changedName = 'Jason';
            record.fields.Name.value = changedName;
            expect(record.fields.Name.value).toEqual(changedName);
        });

        it('resolves draft id references in the body', async () => {
            const draftReferenceId = 'DRAFT';
            const canonicalReferenceId = 'CANONICAL';
            const draftReferenceKey = getRecordKeyForId(draftReferenceId);
            const canonicalReferenceKey = getRecordKeyForId(canonicalReferenceId);

            const { draftEnvironment, draftQueue, durableStore, store } = setupDraftEnvironment({
                isDraftId: (id: string) => {
                    return id === DRAFT_RECORD_ID || id === draftReferenceId;
                },
            });
            store.redirect(draftReferenceKey, canonicalReferenceKey);
            durableStore.getEntries = jest.fn().mockResolvedValue({
                [STORE_KEY_DRAFT_RECORD]: {
                    data: {
                        apiName: DEFAULT_API_NAME,
                        childRelationships: {},
                        eTag: '',
                        fields: {
                            Name: {
                                __ref: DRAFT_STORE_KEY_FIELD__NAME,
                            },
                        },
                        id: DRAFT_RECORD_ID,
                        lastModifiedById: null,
                        lastModifiedDate: null,
                        recordTypeId: null,
                        recordTypeInfo: null,
                        systemModstamp: null,
                        weakEtag: -1,
                    },
                },
                [DRAFT_STORE_KEY_FIELD__NAME]: {
                    data: {
                        displayValue: null,
                        value: RECORD_ID,
                    },
                },
            });
            const request = {
                baseUri: '/services/data/v52.0',
                basePath: `/ui-api/records/`,
                method: 'post',
                body: {
                    apiName: DEFAULT_API_NAME,
                    fields: {
                        Name: draftReferenceId,
                    },
                },
                urlParams: {},
                queryParams: {},
                headers: {},
            };
            const expectedRequest = {
                ...request,
                body: {
                    ...request.body,
                    fields: {
                        Name: canonicalReferenceId,
                    },
                },
            };

            await draftEnvironment.dispatchResourceRequest(request);

            expect(draftQueue.enqueue).toBeCalledWith(expectedRequest, STORE_KEY_DRAFT_RECORD);
        });
    });
});
