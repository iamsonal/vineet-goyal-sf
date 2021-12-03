import { HttpStatusCode } from '@luvio/engine';
import { MockDurableStore } from '@luvio/adapter-test-library';
import { RecordRepresentation } from '@salesforce/lds-adapters-uiapi';
import { extractRecordIdFromStoreKey } from '@salesforce/lds-uiapi-record-utils';
import { LDS_ACTION_HANDLER_ID } from '../../actionHandlers/LDSActionHandler';
import { DRAFT_ERROR_CODE } from '../../DraftFetchResponse';
import {
    flushPromises,
    createPostRequest,
    DEFAULT_API_NAME,
    DEFAULT_NAME_FIELD_VALUE,
    populateDurableStoreWithRecord,
    RECORD_ID,
    setupDraftEnvironment,
    mockDurableStoreResponse,
} from './test-utils';
import { DefaultDurableSegment } from '@luvio/environments';
import * as RecordUtils from '../../utils/records';
const { getRecordKeyForId } = RecordUtils;

const CREATE_DRAFT_RECORD_ID = '001x000001XL1tAAG';
const STORE_KEY_DRAFT_RECORD = `UiApi::RecordRepresentation:${CREATE_DRAFT_RECORD_ID}`;
const DRAFT_RECORD_DATA = {
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
};

describe('draft environment tests', () => {
    describe('createRecord', () => {
        it('rejects when apiName is not in the request body', async () => {
            const { draftEnvironment } = await setupDraftEnvironment();
            const { rejects } = await expect(
                draftEnvironment.dispatchResourceRequest({
                    baseUri: '/services/data/v55.0',
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
            const { draftEnvironment, durableStore } = await setupDraftEnvironment();

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
                baseUri: '/services/data/v55.0',
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
            const apiNameMock = () => {
                return Promise.resolve('Account');
            };
            const { draftEnvironment, draftQueue, durableStore } = await setupDraftEnvironment({
                apiNameForPrefix: apiNameMock,
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
                baseUri: '/services/data/v55.0',
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
                targetApiName: 'Account',
            });
        });

        it('throws if durable store rejects', async () => {
            const { draftEnvironment, durableStore } = await setupDraftEnvironment();

            durableStore.getDenormalizedRecord = jest.fn().mockRejectedValue(undefined);
            const request = createPostRequest();

            await expect(draftEnvironment.dispatchResourceRequest(request)).rejects.toEqual({
                status: 500,
                headers: {},
            });
        });

        it('throws draft error if unable to synthesize draft after create', async () => {
            const { draftEnvironment } = await setupDraftEnvironment();
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
            const { draftEnvironment, durableStore } = await setupDraftEnvironment();
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

        it('resolves draft id references in the create body', async () => {
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

            await populateDurableStoreWithRecord(
                durableStore,
                STORE_KEY_DRAFT_RECORD,
                DRAFT_RECORD_DATA
            );

            store.redirect(draftReferenceKey, canonicalReferenceKey);

            const request = {
                baseUri: '/services/data/v55.0',
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
                targetApiName: 'Account',
            });
        });

        it('fails to create record draft when keyPrefix is null', async () => {
            // Arrange
            const { draftEnvironment } = await setupDraftEnvironment({
                prefixForApiName: () => Promise.resolve(null),
            });
            const request = createPostRequest();

            // Act & Assert
            await expect(draftEnvironment.dispatchResourceRequest(request)).rejects.toEqual({
                status: 400,
                body: {
                    message: 'Cannot create draft for entity with null keyPrefix',
                },
                headers: {},
            });
        });

        it('fails to create record draft when object info is not accessible', async () => {
            const { draftEnvironment } = await setupDraftEnvironment({
                skipPopulatingAccountObjectInfo: true,
            });

            const request = createPostRequest();

            await expect(draftEnvironment.dispatchResourceRequest(request)).rejects.toEqual({
                status: 400,
                body: {
                    errorCode: 'DRAFT_ERROR',
                    message: 'failed to synthesize draft response',
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

        it('created record never expires', async () => {
            const { draftEnvironment, durableStore } = await setupDraftEnvironment({
                isDraftId: () => true,
            });

            draftEnvironment.storePublish(STORE_KEY_DRAFT_RECORD, DRAFT_RECORD_DATA);
            draftEnvironment.publishStoreMetadata(STORE_KEY_DRAFT_RECORD, {
                expirationTimestamp: 1,
                staleTimestamp: 1,
                namespace: 'UiApi',
                representationName: 'RecordRepresentation',
                ingestionTimestamp: 1,
            });

            // broadcast so staging store flushes to L2
            draftEnvironment.storeBroadcast(
                draftEnvironment.rebuildSnapshot,
                draftEnvironment.snapshotAvailable
            );

            // wait for flush to finish before reading L2 values
            await flushPromises();

            const record = (durableStore as unknown as MockDurableStore).segments[
                DefaultDurableSegment
            ][STORE_KEY_DRAFT_RECORD];
            const metadata = record.metadata;
            expect(metadata.expirationTimestamp).toBe(Number.MAX_SAFE_INTEGER);
            expect(metadata.staleTimestamp).toBe(Number.MAX_SAFE_INTEGER);
        });

        describe('assertDraftPrerequisitesSatisfied', () => {
            let request,
                draftEnvironment,
                durableStore,
                ensureObjectInfoCachedMock,
                ensureReferencedIdsAreCachedMock;
            beforeEach(async () => {
                ensureObjectInfoCachedMock = jest.fn().mockName('ensureObjectInfoCachedMock');

                ensureReferencedIdsAreCachedMock = jest
                    .spyOn(RecordUtils, 'ensureReferencedIdsAreCached')
                    .mockResolvedValue(null);

                ({ draftEnvironment, durableStore } = await setupDraftEnvironment({
                    ensureObjectInfoCached: ensureObjectInfoCachedMock,
                }));
                mockDurableStoreResponse(durableStore);
                request = createPostRequest();
            });

            afterEach(() => {
                jest.clearAllMocks();
            });

            it('should call ensureObjectInfoCached', async () => {
                // Arrange

                // Act
                await draftEnvironment.dispatchResourceRequest(request);

                // Assert
                expect(ensureObjectInfoCachedMock).toBeCalledTimes(1);
                expect(ensureObjectInfoCachedMock).toBeCalledWith(DEFAULT_API_NAME);
            });

            it('should call ensureReferencedIdsAreCached', async () => {
                // Arrange

                // Act
                await draftEnvironment.dispatchResourceRequest(request);

                // Assert
                expect(ensureReferencedIdsAreCachedMock).toBeCalledTimes(1);
                expect(ensureReferencedIdsAreCachedMock).toBeCalledWith(
                    durableStore,
                    DEFAULT_API_NAME,
                    {
                        Name: DEFAULT_NAME_FIELD_VALUE,
                    },
                    expect.any(Function)
                );
            });

            it('should throw if ensureObjectInfoCached throws', async () => {
                // Arrange
                ensureObjectInfoCachedMock.mockRejectedValueOnce({});
                let expectedError = null;

                // Act
                try {
                    await draftEnvironment.dispatchResourceRequest(request);
                } catch (err) {
                    expectedError = err;
                }

                // Assert
                expect(expectedError).not.toBe(null);
            });

            it('should throw if ensureReferencedIdsAreCached throws', async () => {
                // Arrange
                ensureReferencedIdsAreCachedMock.mockRejectedValueOnce({});
                let expectedError = null;

                // Act
                try {
                    await draftEnvironment.dispatchResourceRequest(request);
                } catch (err) {
                    expectedError = err;
                }

                // Assert
                expect(expectedError).toEqual({
                    body: {
                        errorCode: 'DRAFT_ERROR',
                        message: 'failed to synthesize draft response',
                    },
                    headers: {},
                    status: 400,
                });
            });
        });
    });
});
