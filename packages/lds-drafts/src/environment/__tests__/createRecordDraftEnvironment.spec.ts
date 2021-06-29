import { HttpStatusCode } from '@luvio/engine';
import { RecordRepresentation } from '@salesforce/lds-adapters-uiapi';
import { extractRecordIdFromStoreKey } from '@salesforce/lds-uiapi-record-utils';
import { LDS_ACTION_HANDLER_ID } from '../../actionHandlers/LDSActionHandler';
import { DRAFT_ERROR_CODE } from '../../DraftFetchResponse';
import { getRecordKeyForId } from '../../utils/records';
import {
    createPostRequest,
    DEFAULT_API_NAME,
    DEFAULT_NAME_FIELD_VALUE,
    RECORD_ID,
    setupDraftEnvironment,
} from './test-utils';

const CREATE_DRAFT_RECORD_ID = '001x000001XL1tAAG';
const STORE_KEY_DRAFT_RECORD = `UiApi::RecordRepresentation:${CREATE_DRAFT_RECORD_ID}`;

describe('draft environment tests', () => {
    describe('createRecord', () => {
        it('rejects when apiName is not in the request body', async () => {
            const { draftEnvironment } = await setupDraftEnvironment();
            const { rejects } = await expect(
                draftEnvironment.dispatchResourceRequest({
                    baseUri: '/services/data/v53.0',
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

        it('returns the correct prefix for the record', async () => {
            const { draftEnvironment, durableStore } = await setupDraftEnvironment({
                prefixForApiName: (_apiName: string) => Promise.resolve('001'),
            });

            let assignedDraftId = '';
            let assignedDraftIdStoreKey = '';
            durableStore.getDenormalizedRecord = jest.fn().mockImplementation((key) => {
                assignedDraftIdStoreKey = key;
                assignedDraftId = extractRecordIdFromStoreKey(assignedDraftIdStoreKey);
                return Promise.resolve({
                    apiName: DEFAULT_API_NAME,
                    childRelationships: {},
                    eTag: '',
                    fields: {
                        Name: {
                            displayValue: DEFAULT_NAME_FIELD_VALUE,
                            value: DEFAULT_NAME_FIELD_VALUE,
                        },
                    },
                    id: assignedDraftId,
                    lastModifiedById: null,
                    lastModifiedDate: null,
                    recordTypeId: null,
                    recordTypeInfo: null,
                    systemModstamp: null,
                    weakEtag: -1,
                });
            });
            const request = {
                baseUri: '/services/data/v53.0',
                basePath: `/ui-api/records/${CREATE_DRAFT_RECORD_ID}`,
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

            const result = await draftEnvironment.dispatchResourceRequest<RecordRepresentation>(
                request
            );
            expect(result.body.id.substring(0, 3)).toEqual('001');
        });

        it('request gets enqueued with key as tag', async () => {
            const { draftEnvironment, draftQueue, durableStore } = await setupDraftEnvironment({
                prefixForApiName: (_apiName: string) => Promise.resolve('001'),
            });
            let assignedDraftId = '';
            let assignedDraftIdStoreKey = '';
            durableStore.getDenormalizedRecord = jest.fn().mockImplementation((key) => {
                assignedDraftIdStoreKey = key;
                assignedDraftId = extractRecordIdFromStoreKey(assignedDraftIdStoreKey);
                return Promise.resolve({
                    apiName: DEFAULT_API_NAME,
                    childRelationships: {},
                    eTag: '',
                    fields: {
                        Name: {
                            displayValue: DEFAULT_NAME_FIELD_VALUE,
                            value: DEFAULT_NAME_FIELD_VALUE,
                        },
                    },
                    id: assignedDraftId,
                    lastModifiedById: null,
                    lastModifiedDate: null,
                    recordTypeId: null,
                    recordTypeInfo: null,
                    systemModstamp: null,
                    weakEtag: -1,
                });
            });
            const request = {
                baseUri: '/services/data/v53.0',
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

            expect(draftQueue.enqueue).toBeCalledWith({
                data: request,
                tag: assignedDraftIdStoreKey,
                targetId: CREATE_DRAFT_RECORD_ID,
                handler: LDS_ACTION_HANDLER_ID,
            });
        });

        it('throws if durable store rejects', async () => {
            const { draftEnvironment, durableStore } = await setupDraftEnvironment({
                prefixForApiName: (_apiName: string) => Promise.resolve('001'),
            });

            durableStore.getDenormalizedRecord = jest.fn().mockRejectedValue(undefined);
            const request = createPostRequest();

            await expect(draftEnvironment.dispatchResourceRequest(request)).rejects.toEqual({
                status: 500,
                headers: {},
            });
        });

        it('throws draft error if unable to synthesize draft after create', async () => {
            const { draftEnvironment, durableStore } = await setupDraftEnvironment({
                prefixForApiName: (_apiName: string) => Promise.resolve('001'),
            });
            durableStore.getDenormalizedRecord = jest.fn().mockResolvedValue(undefined);
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
            const { draftEnvironment, durableStore } = await setupDraftEnvironment({
                prefixForApiName: (_apiName: string) => Promise.resolve('001'),
            });
            let assignedDraftId = '';
            let assignedDraftIdStoreKey = '';
            durableStore.getDenormalizedRecord = jest.fn().mockImplementation((key) => {
                assignedDraftIdStoreKey = key;
                assignedDraftId = extractRecordIdFromStoreKey(assignedDraftIdStoreKey);
                return Promise.resolve({
                    apiName: DEFAULT_API_NAME,
                    childRelationships: {},
                    eTag: '',
                    fields: {
                        Name: {
                            displayValue: DEFAULT_NAME_FIELD_VALUE,
                            value: DEFAULT_NAME_FIELD_VALUE,
                        },
                    },
                    id: assignedDraftId,
                    lastModifiedById: null,
                    lastModifiedDate: null,
                    recordTypeId: null,
                    recordTypeInfo: null,
                    systemModstamp: null,
                    weakEtag: -1,
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

            const { draftEnvironment, draftQueue, durableStore, store } =
                await setupDraftEnvironment({
                    isDraftId: (id: string) => {
                        return id === CREATE_DRAFT_RECORD_ID || id === draftReferenceId;
                    },
                    prefixForApiName: (_apiName: string) => Promise.resolve('001'),
                });
            store.redirect(draftReferenceKey, canonicalReferenceKey);
            durableStore.getDenormalizedRecord = jest.fn().mockResolvedValue({
                apiName: DEFAULT_API_NAME,
                childRelationships: {},
                eTag: '',
                fields: {
                    Name: {
                        displayValue: null,
                        value: RECORD_ID,
                    },
                },
                id: CREATE_DRAFT_RECORD_ID,
                lastModifiedById: null,
                lastModifiedDate: null,
                recordTypeId: null,
                recordTypeInfo: null,
                systemModstamp: null,
                weakEtag: -1,
            });
            const request = {
                baseUri: '/services/data/v53.0',
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

            expect(draftQueue.enqueue).toBeCalledWith({
                data: expectedRequest,
                tag: STORE_KEY_DRAFT_RECORD,
                targetId: CREATE_DRAFT_RECORD_ID,
                handler: LDS_ACTION_HANDLER_ID,
            });
        });

        it('fails to create record draft when object info is not present', async () => {
            const { draftEnvironment } = await setupDraftEnvironment({
                skipPopulatingAccountObjectInfo: true,
            });

            const request = createPostRequest();

            await expect(draftEnvironment.dispatchResourceRequest(request)).rejects.toEqual({
                status: 400,
                body: {
                    errorCode: 'DRAFT_ERROR',
                    message: 'ObjectInfo for Account is not cached',
                },
                headers: {},
            });
        });
        it('fails to create record draft when reference field is not a string', async () => {
            const { draftEnvironment } = await setupDraftEnvironment();

            const request = createPostRequest();
            request.body.fields['OwnerId'] = 1;

            await expect(draftEnvironment.dispatchResourceRequest(request)).rejects.toEqual({
                status: 400,
                body: {
                    errorCode: 'DRAFT_ERROR',
                    message: 'Reference field value OwnerId is not a string',
                },
                headers: {},
            });
        });
        it('fails to create record draft when referenced record is not cached', async () => {
            const { draftEnvironment } = await setupDraftEnvironment();

            const request = createPostRequest();
            request.body.fields['OwnerId'] = 'foobar';

            await expect(draftEnvironment.dispatchResourceRequest(request)).rejects.toEqual({
                status: 400,
                body: {
                    errorCode: 'DRAFT_ERROR',
                    message: 'Referenced record foobar is not cached',
                },
                headers: {},
            });
        });
    });
});
