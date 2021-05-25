import { HttpStatusCode } from '@luvio/engine';
import { BatchResultRepresentation } from '@salesforce/lds-adapters-uiapi/dist/types/src/generated/types/BatchResultRepresentation';
import { RecordRepresentation, BatchRepresentation } from '@salesforce/lds-adapters-uiapi';
import {
    makeNetworkChunkFieldsGetRecordsBatch,
    GetRecordsBatchAggregateResponse,
    GetRecordsBatchResponse,
} from '../makeNetworkChunkFieldsGetRecordsBatch';

import { CompositeRequest, mergeRecordFields, mergeBatchRecordsFields } from '../utils';
import {
    BASE_URI,
    ACCOUNT_ID1,
    ACCOUNT_ID2,
    ACCOUNT_ID_FIELD_STRING,
    ACCOUNT_NAME_FIELD_STRING,
    ACCOUNT1_WITH_ID,
    ACCOUNT2_WITH_ID,
    ACCOUNT1_WITH_NAME,
    ACCOUNT2_WITH_NAME,
    generateFetchResponse,
    generateMockedRecordFields,
    verifyRequestBasePath,
    UIAPI_ERROR_INVALID_FIELD_NAME1,
} from './testUtils';
import { wrapFieldsInRecordObject } from './testUtils';

const GET_RECORDS_BATCH_BASE_PATH = `/ui-api/records/batch/${ACCOUNT_ID1},${ACCOUNT_ID2}`;

describe('makeNetworkBatchGetRecordsFields', () => {
    let baseNetwork;
    let network;
    beforeEach(() => {
        baseNetwork = jest.fn();
        network = makeNetworkChunkFieldsGetRecordsBatch(baseNetwork);
    });

    describe('execute request does not go aggregate ui', () => {
        it('post will not call aggregate ui', async () => {
            const body = { testBody: 'fooBody' };
            const request = {
                baseUri: BASE_URI,
                basePath: GET_RECORDS_BATCH_BASE_PATH,
                method: 'post',
                body: JSON.stringify(body),
            };
            await network(request);
            expect(baseNetwork.mock.calls[0][0].method).toBe('post');
            verifyRequestBasePath(baseNetwork.mock.calls[0][0], GET_RECORDS_BATCH_BASE_PATH);
        });
        it('get object info will not call aggregate ui', () => {
            const objectInfoBasePath = '/object-info/Opportunity';
            const request = {
                method: 'get',
                baseUri: BASE_URI,
                basePath: objectInfoBasePath,
            };
            network(request);

            const calledRequest = baseNetwork.mock.calls[0][0];
            verifyRequestBasePath(calledRequest, objectInfoBasePath);
        });
        it('get record with layout will not call aggregate ui', () => {
            const request = {
                baseUri: BASE_URI,
                basePath: GET_RECORDS_BATCH_BASE_PATH,
                method: 'get',
                queryParams: {
                    layoutTypes: 'Compact',
                },
            };
            network(request);

            const calledRequest = baseNetwork.mock.calls[0][0];
            verifyRequestBasePath(calledRequest, GET_RECORDS_BATCH_BASE_PATH);
        });
        it('get record with modes will not call aggregate ui', () => {
            const request = {
                baseUri: BASE_URI,
                basePath: GET_RECORDS_BATCH_BASE_PATH,
                method: 'get',
                queryParams: {
                    modes: 'Create',
                },
            };
            network(request);

            const calledRequest = baseNetwork.mock.calls[0][0];
            verifyRequestBasePath(calledRequest, GET_RECORDS_BATCH_BASE_PATH);
        });
        it('get record with with short url will not call aggregate ui', () => {
            const queryParams = {
                fields: [ACCOUNT_ID_FIELD_STRING],
                optionalFields: [ACCOUNT_NAME_FIELD_STRING],
            };
            const request = {
                baseUri: BASE_URI,
                basePath: GET_RECORDS_BATCH_BASE_PATH,
                method: 'get',
                queryParams: queryParams,
            };
            network(request);

            const calledRequest = baseNetwork.mock.calls[0][0];
            expect(calledRequest.basePath).toBe(GET_RECORDS_BATCH_BASE_PATH);
            expect(calledRequest.queryParams).toEqual(queryParams);
        });
    });

    describe('execute request goes to aggregate ui', () => {
        it('get record with with long enough url will call aggregate ui', async () => {
            const mockCompositeResponse: GetRecordsBatchAggregateResponse = generateFetchResponse([
                {
                    body: {
                        results: [
                            { result: ACCOUNT1_WITH_ID, statusCode: HttpStatusCode.Ok },
                            { result: ACCOUNT2_WITH_ID, statusCode: HttpStatusCode.Ok },
                        ],
                    },
                    httpStatusCode: HttpStatusCode.Ok,
                },
                {
                    body: {
                        results: [
                            { result: ACCOUNT1_WITH_NAME, statusCode: HttpStatusCode.Ok },
                            { result: ACCOUNT2_WITH_NAME, statusCode: HttpStatusCode.Ok },
                        ],
                    },
                    httpStatusCode: HttpStatusCode.Ok,
                },
            ]);

            const mockNetworkAdapter = jest.fn().mockResolvedValue(mockCompositeResponse);
            const lengthAwareNetworkAdapter =
                makeNetworkChunkFieldsGetRecordsBatch(mockNetworkAdapter);

            const queryParams = {
                fields: generateMockedRecordFields(400),
                optionalFields: generateMockedRecordFields(400),
            };

            const request: any = {
                baseUri: BASE_URI,
                basePath: GET_RECORDS_BATCH_BASE_PATH,
                method: 'get',
                queryParams: queryParams,
            };

            const accounts = (await lengthAwareNetworkAdapter(request)) as GetRecordsBatchResponse;

            // check
            const requestCalled = mockNetworkAdapter.mock.calls[0][0];
            expect(requestCalled.method).toBe('post');
            expect(requestCalled.basePath).toBe('/ui-api/aggregate-ui');

            const compositeRequests = requestCalled.body.compositeRequest as CompositeRequest[];
            expect(compositeRequests.length).toBe(2);
            expect(compositeRequests[0].url).toMatch(GET_RECORDS_BATCH_BASE_PATH);

            expect(accounts.body.results[0].result).toEqual(
                wrapFieldsInRecordObject(
                    {
                        Id: {
                            displayValue: null,
                            value: ACCOUNT_ID1,
                        },
                        Name: {
                            displayValue: 'Costco',
                            value: 'Costco',
                        },
                    },
                    ACCOUNT_ID1
                )
            );
        });
    });

    describe('merge batch records Fields', () => {
        const ERROR_INVALID_FIELD_NAME1: BatchResultRepresentation = {
            statusCode: 400,
            result: UIAPI_ERROR_INVALID_FIELD_NAME1,
        };
        const ERROR_INVALID_FIELD_NAME2: BatchResultRepresentation = {
            statusCode: 400,
            result: UIAPI_ERROR_INVALID_FIELD_NAME1,
        };

        /**
         * verify two successful batches result their fields got merged
         */
        it('merge success batch result with second success batch result', () => {
            const first: BatchRepresentation = {
                results: [{ result: ACCOUNT1_WITH_ID, statusCode: HttpStatusCode.Ok }],
            };
            const second: BatchRepresentation = {
                results: [{ result: ACCOUNT1_WITH_NAME, statusCode: HttpStatusCode.Ok }],
            };

            const merged = mergeBatchRecordsFields(first, second, (a, b) => {
                return mergeRecordFields(a as RecordRepresentation, b as RecordRepresentation);
            });
            expect(merged.results.length).toBe(1);
            expect(merged.results[0].statusCode).toBe(HttpStatusCode.Ok);
            expect((merged.results[0].result as RecordRepresentation).fields).toEqual({
                Id: { displayValue: null, value: '001x0000004u7cZAAQ' },
                Name: { displayValue: 'Costco', value: 'Costco' },
            });
        });

        /**
         * verifythe error batch result is kept when merging a successful batch result
         * into an error batch result
         */
        it('merge error batch result with success batch result', () => {
            const first: BatchRepresentation = {
                results: [ERROR_INVALID_FIELD_NAME1],
            };
            const second: BatchRepresentation = {
                results: [{ result: ACCOUNT1_WITH_ID, statusCode: 200 }],
            };
            const merged = mergeBatchRecordsFields(first, second);
            expect(merged).toEqual(first);
        });

        /**
         *verify the error batch result is kept when merging an error batch result
         * into a successful batch result
         */
        it('merge success batch result with error batch result ', () => {
            const first: BatchRepresentation = {
                results: [{ result: ACCOUNT1_WITH_ID, statusCode: 200 }],
            };
            const second: BatchRepresentation = {
                results: [ERROR_INVALID_FIELD_NAME1],
            };
            const merged = mergeBatchRecordsFields(first, second);
            expect(merged).toEqual(second);
        });

        /**
         * verify the first error batch result is kept when merging an error batch result
         * into an error batch result
         */
        it('merge error batch result with error batch result ', () => {
            const first: BatchRepresentation = {
                results: [ERROR_INVALID_FIELD_NAME1],
            };
            const second: BatchRepresentation = {
                results: [ERROR_INVALID_FIELD_NAME2],
            };
            const merged = mergeBatchRecordsFields(first, second);
            expect(merged).toEqual(first);
        });

        /**
         * verify the first error batch result is kept when merging an error batch result
         * into an error batch result
         */
        it('merge two pairs of mixed successful and error results', () => {
            const first: BatchRepresentation = {
                results: [
                    { result: ACCOUNT1_WITH_ID, statusCode: HttpStatusCode.Ok },
                    ERROR_INVALID_FIELD_NAME1,
                ],
            };
            const second: BatchRepresentation = {
                results: [
                    ERROR_INVALID_FIELD_NAME2,
                    { result: ACCOUNT2_WITH_NAME, statusCode: HttpStatusCode.Ok },
                ],
            };
            const merged = mergeBatchRecordsFields(first, second);
            expect(merged).toEqual({
                results: [ERROR_INVALID_FIELD_NAME2, ERROR_INVALID_FIELD_NAME1],
            });
        });
    });
});
