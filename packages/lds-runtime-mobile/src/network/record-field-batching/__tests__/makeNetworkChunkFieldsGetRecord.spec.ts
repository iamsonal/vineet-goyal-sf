import { HttpStatusCode } from '@luvio/engine';
import { RecordRepresentation } from '@salesforce/lds-adapters-uiapi';
import { makeNetworkAdapterChunkRecordFields } from '../makeNetworkAdapterChunkRecordFields';
import {
    GetRecordAggregateResponse,
    mergeGetRecordResult,
} from '../makeNetworkChunkFieldsGetRecord';
import { CompositeRequest } from '../utils';
import {
    BASE_URI,
    ACCOUNT_ID_FIELD_STRING,
    ACCOUNT_NAME_FIELD_STRING,
    ACCOUNT_ID1,
    ACCOUNT1_WITH_ID,
    ACCOUNT1_WITH_NAME,
    UIAPI_ERROR_INVALID_FIELD_NAME1,
    UIAPI_ERROR_INVALID_FIELD_NAME2,
    generateMockedRecordFields,
    verifyRequestBasePath,
    wrapFieldsInRecordObject,
    generateFetchResponse,
} from './testUtils';

const GET_RECORD_BASE_PATH = `/ui-api/records/${ACCOUNT_ID1}`;

describe('makeNetworkBatchGetRecordFields', () => {
    let baseNetwork;
    let network;
    beforeEach(() => {
        baseNetwork = jest.fn();
        network = makeNetworkAdapterChunkRecordFields(baseNetwork);
    });

    describe('execute request does not go aggregate ui', () => {
        it('post will not call aggregate ui', async () => {
            const body = { testBody: 'fooBody' };
            const request = {
                baseUri: BASE_URI,
                basePath: GET_RECORD_BASE_PATH,
                method: 'post',
                body: JSON.stringify(body),
            };
            await network(request);
            expect(baseNetwork.mock.calls[0][0].method).toBe('post');
            verifyRequestBasePath(baseNetwork.mock.calls[0][0], GET_RECORD_BASE_PATH);
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
                basePath: GET_RECORD_BASE_PATH,
                method: 'get',
                queryParams: {
                    layoutTypes: 'Compact',
                },
            };
            network(request);

            const calledRequest = baseNetwork.mock.calls[0][0];
            verifyRequestBasePath(calledRequest, GET_RECORD_BASE_PATH);
        });
        it('get record with modes will not call aggregate ui', () => {
            const request = {
                baseUri: BASE_URI,
                basePath: GET_RECORD_BASE_PATH,
                method: 'get',
                queryParams: {
                    modes: 'Create',
                },
            };
            network(request);

            const calledRequest = baseNetwork.mock.calls[0][0];
            verifyRequestBasePath(calledRequest, GET_RECORD_BASE_PATH);
        });
        it('get record with with short url will not call aggregate ui', () => {
            const queryParams = {
                fields: [ACCOUNT_ID_FIELD_STRING],
                optionalFields: [ACCOUNT_NAME_FIELD_STRING],
            };
            const request = {
                baseUri: BASE_URI,
                basePath: GET_RECORD_BASE_PATH,
                method: 'get',
                queryParams: queryParams,
            };
            network(request);

            const calledRequest = baseNetwork.mock.calls[0][0];
            expect(calledRequest.basePath).toBe(GET_RECORD_BASE_PATH);
            expect(calledRequest.queryParams).toEqual(queryParams);
        });
    });

    describe('execute request goes to aggregate ui', () => {
        it('get record with with long enough url will call aggregate ui', async () => {
            const responseChunk1 = wrapFieldsInRecordObject({
                Id: {
                    displayValue: null,
                    value: ACCOUNT_ID1,
                },
            });
            const responseChunk2 = wrapFieldsInRecordObject({
                Name: {
                    displayValue: 'Costco Richmond',
                    value: 'Costco Richmond',
                },
            });

            const mockCompositeResponse: GetRecordAggregateResponse = generateFetchResponse([
                { body: responseChunk1, httpStatusCode: HttpStatusCode.Ok },
                { body: responseChunk2, httpStatusCode: HttpStatusCode.Ok },
            ]);

            const mockNetworkAdapter = jest.fn().mockResolvedValue(mockCompositeResponse);
            const lengthAwareNetworkAdapter =
                makeNetworkAdapterChunkRecordFields(mockNetworkAdapter);

            const queryParams = {
                fields: generateMockedRecordFields(400),
                optionalFields: generateMockedRecordFields(400),
            };

            const request: any = {
                baseUri: BASE_URI,
                basePath: GET_RECORD_BASE_PATH,
                method: 'get',
                queryParams: queryParams,
            };

            const record = await lengthAwareNetworkAdapter(request);

            // check
            const requestCalled = mockNetworkAdapter.mock.calls[0][0];
            expect(requestCalled.method).toBe('post');
            expect(requestCalled.basePath).toBe('/ui-api/aggregate-ui');

            const compositeRequests = requestCalled.body.compositeRequest as CompositeRequest[];
            expect(compositeRequests.length).toBe(2);
            expect(compositeRequests[0].url).toMatch(GET_RECORD_BASE_PATH);

            expect(record.body).toEqual(
                wrapFieldsInRecordObject({
                    Id: {
                        displayValue: null,
                        value: ACCOUNT_ID1,
                    },
                    Name: {
                        displayValue: 'Costco Richmond',
                        value: 'Costco Richmond',
                    },
                })
            );
        });
    });

    describe('merge batch records Fields', () => {
        /**
         * verify two successful results fields got merged
         */
        it('merge success result with second success result', () => {
            const merged = mergeGetRecordResult(ACCOUNT1_WITH_ID, ACCOUNT1_WITH_NAME);
            expect((merged as RecordRepresentation).fields).toEqual({
                Id: { displayValue: null, value: '001x0000004u7cZAAQ' },
                Name: { displayValue: 'Costco', value: 'Costco' },
            });
        });

        /**
         * verifythe error result is kept when merging a successful result
         * into the error result
         */
        it('merge error result with success result', () => {
            const merged = mergeGetRecordResult(
                [UIAPI_ERROR_INVALID_FIELD_NAME1],
                ACCOUNT1_WITH_ID
            );
            expect(merged).toEqual([UIAPI_ERROR_INVALID_FIELD_NAME1]);
        });

        /**
         *verify the error result is kept when merging an error result
         * into a successful result
         */
        it('merge success batch result with error batch result ', () => {
            const merged = mergeGetRecordResult(ACCOUNT1_WITH_ID, [
                UIAPI_ERROR_INVALID_FIELD_NAME1,
            ]);
            expect(merged).toEqual([UIAPI_ERROR_INVALID_FIELD_NAME1]);
        });

        /**
         * verify the first error batch result is kept when merging an error batch result
         * into an error batch result
         */
        it('merge error batch result with error batch result ', () => {
            const merged = mergeGetRecordResult(
                [UIAPI_ERROR_INVALID_FIELD_NAME1],
                [UIAPI_ERROR_INVALID_FIELD_NAME2]
            );
            expect(merged).toEqual([
                UIAPI_ERROR_INVALID_FIELD_NAME1,
                UIAPI_ERROR_INVALID_FIELD_NAME2,
            ]);
        });
    });
});
