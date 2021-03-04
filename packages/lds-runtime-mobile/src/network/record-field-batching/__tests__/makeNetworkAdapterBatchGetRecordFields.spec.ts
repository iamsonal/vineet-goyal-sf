import { FetchResponse, HttpStatusCode } from '@luvio/engine';
import { RecordRepresentation } from '@salesforce/lds-adapters-uiapi';
import { makeNetworkAdapterBatchRecordFields } from '../makeNetworkAdapterBatchRecordFields';
import { buildGetRecordByFieldsCompositeRequest } from '../makeNetworkBatchGetRecordFields';
import { CompositeRequest, CompositeResponseEnvelope } from '../utils';
import {
    BASE_URI,
    buildResourceRequest,
    generateMockedRecordFields,
    verifyRequestBasePath,
} from './testUtils';
import { wrapFieldsInRecordObject } from './utils.spec';
const RECORD_ID = '001x0000004u7cZAAQ';
const ACCOUNT_ID_FIELD_STRING = 'Account.Id';
const ACCOUNT_NAME_FIELD_STRING = 'Account.Name';
const GET_RECORD_BASE_PATH = `/ui-api/records/${RECORD_ID}`;

describe('makeNetworkBatchGetRecordFields', () => {
    let baseNetwork;
    let network;
    beforeEach(() => {
        baseNetwork = jest.fn();
        network = makeNetworkAdapterBatchRecordFields(baseNetwork);
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
                    value: RECORD_ID,
                },
            });
            const responseChunk2 = wrapFieldsInRecordObject({
                Name: {
                    displayValue: 'Costco Richmond',
                    value: 'Costco Richmond',
                },
            });

            const mockCompositeResponse: FetchResponse<CompositeResponseEnvelope<
                RecordRepresentation
            >> = {
                status: HttpStatusCode.Ok,
                body: {
                    compositeResponse: [
                        { body: responseChunk1, httpStatusCode: HttpStatusCode.Ok },
                        { body: responseChunk2, httpStatusCode: HttpStatusCode.Ok },
                    ],
                },
                statusText: 'success',
                ok: true,
                headers: null,
            };

            const mockNetworkAdapter = jest.fn().mockResolvedValue(mockCompositeResponse);
            const lengthAwareNetworkAdapter = makeNetworkAdapterBatchRecordFields(
                mockNetworkAdapter
            );

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
            expect(requestCalled.basePath).toBe('/aggregate-ui');

            const compositeRequests = requestCalled.body.compositeRequest as CompositeRequest[];
            expect(compositeRequests.length).toBe(2);
            expect(compositeRequests[0].url).toMatch(GET_RECORD_BASE_PATH);

            expect(record.body).toEqual(
                wrapFieldsInRecordObject({
                    Id: {
                        displayValue: null,
                        value: RECORD_ID,
                    },
                    Name: {
                        displayValue: 'Costco Richmond',
                        value: 'Costco Richmond',
                    },
                })
            );
        });
    });

    describe('buildGetRecordByFieldsCompositeRequest', () => {
        it('should build a CompositeRequest with a getRecord input', () => {
            const fields = ['Name', 'Id', 'Cars__c', 'Cars__r.Name'];

            const actualCompositeRequest = buildGetRecordByFieldsCompositeRequest(
                buildResourceRequest({}),
                {
                    fieldsArray: fields,
                    optionalFieldsArray: [],
                    optionalFieldsLength: 0,
                    fieldsLength: fields.join(',').length,
                }
            );

            expect(actualCompositeRequest.length).toEqual(1);
            expect(actualCompositeRequest[0].referenceId.length).toBeGreaterThan(0);
            expect(actualCompositeRequest[0].url.length).toBeGreaterThan(0);
        });

        it('should create multiple chunks with fields and optionalFields', () => {
            const fields = ['Name', 'Id', 'Cars__c', 'Cars__r.Name'];
            const optionalFields = ['Parent_Account__c'];

            const actualCompositeRequest = buildGetRecordByFieldsCompositeRequest(
                buildResourceRequest({}),
                {
                    fieldsArray: fields,
                    optionalFieldsArray: optionalFields,
                    optionalFieldsLength: optionalFields.join(',').length,
                    fieldsLength: fields.join(',').length,
                }
            );

            expect(actualCompositeRequest.length).toEqual(2);
            expect(actualCompositeRequest[0].referenceId.length).toBeGreaterThan(0);
            expect(actualCompositeRequest[0].url.length).toBeGreaterThan(0);
            expect(actualCompositeRequest[1].referenceId.length).toBeGreaterThan(0);
            expect(actualCompositeRequest[1].url.length).toBeGreaterThan(0);
        });

        it('should create multiple chunks with a large amount of fields', () => {
            const fields = generateMockedRecordFields(500, 'CrazyHugeCustomFieldName__c');

            const actualCompositeRequest = buildGetRecordByFieldsCompositeRequest(
                buildResourceRequest({}),
                {
                    fieldsArray: fields,
                    optionalFieldsArray: [],
                    optionalFieldsLength: 0,
                    fieldsLength: fields.join(',').length,
                }
            );

            expect(actualCompositeRequest.length).toBeGreaterThan(1);
            actualCompositeRequest.forEach(requestChunk => {
                expect(requestChunk.referenceId.length).toBeGreaterThan(0);
                expect(requestChunk.url.length).toBeGreaterThan(0);
            });
        });
    });
});
