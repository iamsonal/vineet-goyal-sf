import { RecordRepresentation } from '@salesforce/lds-adapters-uiapi';
import {
    buildRecordFieldStoreKey,
    extractRecordIdFromStoreKey,
} from '@salesforce/lds-uiapi-record-utils';
import {
    createPostRequest,
    DEFAULT_API_NAME,
    DEFAULT_NAME_FIELD_VALUE,
    RECORD_ID,
    setupDraftEnvironment,
} from './test-utils';

describe('draft environment tests', () => {
    describe('createRecord', () => {
        it('rejects when apiName is not in the config', async () => {
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

        it('throws if record cannot be revived', async () => {
            const { draftEnvironment, durableStore } = setupDraftEnvironment();

            durableStore.getEntries = jest.fn().mockResolvedValue(undefined);
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

            await expect(draftEnvironment.dispatchResourceRequest(request)).rejects.toEqual({
                status: 500,
                headers: {},
            });
        });

        it('throws if durable store rejects', async () => {
            const { draftEnvironment, durableStore } = setupDraftEnvironment();

            durableStore.getEntries = jest.fn().mockRejectedValue(undefined);
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

            await expect(draftEnvironment.dispatchResourceRequest(request)).rejects.toEqual({
                status: 500,
                headers: {},
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
    });
});
