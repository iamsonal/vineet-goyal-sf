import { HttpStatusCode } from '@luvio/engine';
import { RelatedListRecordCollectionRepresentation } from '@salesforce/lds-adapters-uiapi';
import {
    makeNetworkChunkFieldsGetRelatedListRecordsBatch,
    RelatedListBatchAggregateResponse,
    RelatedListBatchResponse,
} from '../makeNetworkChunkFieldsGetRelatedListRecordsBatch';
import { CompositeRequest } from '../utils';
import {
    BASE_URI,
    ACCOUNT_ID1,
    CONTACT_ID1,
    OPPORTUNITY_ID1,
    ACCOUNT_ID_FIELD_STRING,
    ACCOUNT_NAME_FIELD_STRING,
    generateMockedRecordFields,
    verifyRequestBasePath,
    wrapFieldsInRelatedRecordObject,
    generateFetchResponse,
} from './testUtils';

const GET_RELATED_RECORDS_BATCH_BASE_PATH = `/ui-api/related-list-records/batch/${ACCOUNT_ID1}/Contacts,Opportunities`;

describe('makeNetworkBatchGetRelatedListRecordsFieldsBatch', () => {
    let baseNetwork;
    let network;
    beforeEach(() => {
        baseNetwork = jest.fn();
        network = makeNetworkChunkFieldsGetRelatedListRecordsBatch(baseNetwork);
    });

    describe('execute request does not go aggregate ui', () => {
        it('post will not call aggregate ui', async () => {
            const body = { testBody: 'fooBody' };
            const request = {
                baseUri: BASE_URI,
                basePath: GET_RELATED_RECORDS_BATCH_BASE_PATH,
                method: 'post',
                body: JSON.stringify(body),
            };
            await network(request);
            expect(baseNetwork.mock.calls[0][0].method).toBe('post');
            verifyRequestBasePath(
                baseNetwork.mock.calls[0][0],
                GET_RELATED_RECORDS_BATCH_BASE_PATH
            );
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
                basePath: GET_RELATED_RECORDS_BATCH_BASE_PATH,
                method: 'get',
                queryParams: {
                    layoutTypes: 'Compact',
                },
            };
            network(request);

            const calledRequest = baseNetwork.mock.calls[0][0];
            verifyRequestBasePath(calledRequest, GET_RELATED_RECORDS_BATCH_BASE_PATH);
        });
        it('get record with modes will not call aggregate ui', () => {
            const request = {
                baseUri: BASE_URI,
                basePath: GET_RELATED_RECORDS_BATCH_BASE_PATH,
                method: 'get',
                queryParams: {
                    modes: 'Create',
                },
            };
            network(request);

            const calledRequest = baseNetwork.mock.calls[0][0];
            verifyRequestBasePath(calledRequest, GET_RELATED_RECORDS_BATCH_BASE_PATH);
        });
        it('get record with with short url will not call aggregate ui', () => {
            const queryParams = {
                fields: [ACCOUNT_ID_FIELD_STRING],
                optionalFields: [ACCOUNT_NAME_FIELD_STRING],
            };
            const request = {
                baseUri: BASE_URI,
                basePath: GET_RELATED_RECORDS_BATCH_BASE_PATH,
                method: 'get',
                queryParams: queryParams,
            };
            network(request);

            const calledRequest = baseNetwork.mock.calls[0][0];
            expect(calledRequest.basePath).toBe(GET_RELATED_RECORDS_BATCH_BASE_PATH);
            expect(calledRequest.queryParams).toEqual(queryParams);
        });
    });

    describe('execute request goes to aggregate ui', () => {
        it('get record with with long enough url will call aggregate ui', async () => {
            const chunkOfContact1WidthId = wrapFieldsInRelatedRecordObject(
                {
                    Id: {
                        displayValue: null,
                        value: CONTACT_ID1,
                    },
                },
                { fields: ['Contact.Id'], optionalFields: [] }
            );

            const chunkOfContact1WidthName = wrapFieldsInRelatedRecordObject(
                {
                    Name: {
                        displayValue: 'John Smith',
                        value: 'John Smith',
                    },
                },
                { fields: [], optionalFields: ['Contact.Name'] }
            );

            const chunkOfOpportunity1WidthId = wrapFieldsInRelatedRecordObject(
                {
                    Id: {
                        displayValue: null,
                        value: OPPORTUNITY_ID1,
                    },
                },
                { fields: ['Opportunity.Id'], optionalFields: [] }
            );

            const chunkOfOpportunityWidthName = wrapFieldsInRelatedRecordObject(
                {
                    Name: {
                        displayValue: 'Sell 1 bottle of H2O',
                        value: 'Sell 1 bottle of H2O',
                    },
                },
                { fields: [], optionalFields: ['Opportunity.Name'] }
            );

            const mockCompositeResponse: RelatedListBatchAggregateResponse = generateFetchResponse([
                {
                    body: {
                        results: [
                            { result: chunkOfContact1WidthId, statusCode: HttpStatusCode.Ok },
                            { result: chunkOfOpportunity1WidthId, statusCode: HttpStatusCode.Ok },
                        ],
                    },
                    httpStatusCode: HttpStatusCode.Ok,
                },
                {
                    body: {
                        results: [
                            { result: chunkOfContact1WidthName, statusCode: HttpStatusCode.Ok },
                            { result: chunkOfOpportunityWidthName, statusCode: HttpStatusCode.Ok },
                        ],
                    },
                    httpStatusCode: HttpStatusCode.Ok,
                },
            ]);

            const mockNetworkAdapter = jest.fn().mockResolvedValue(mockCompositeResponse);
            const lengthAwareNetworkAdapter =
                makeNetworkChunkFieldsGetRelatedListRecordsBatch(mockNetworkAdapter);

            const queryParams = {
                fields: generateMockedRecordFields(400),
                optionalFields: generateMockedRecordFields(400),
            };

            const request: any = {
                baseUri: BASE_URI,
                basePath: GET_RELATED_RECORDS_BATCH_BASE_PATH,
                method: 'get',
                queryParams: queryParams,
            };

            const response = (await lengthAwareNetworkAdapter(request)) as RelatedListBatchResponse;

            // check
            const requestCalled = mockNetworkAdapter.mock.calls[0][0];
            expect(requestCalled.method).toBe('post');
            expect(requestCalled.basePath).toBe('/ui-api/aggregate-ui');

            const compositeRequests = requestCalled.body.compositeRequest as CompositeRequest[];
            expect(compositeRequests.length).toBe(2);
            expect(compositeRequests[0].url).toMatch(GET_RELATED_RECORDS_BATCH_BASE_PATH);

            const mergedContactFields = (
                response.body.results[0].result as RelatedListRecordCollectionRepresentation
            ).records[0].fields;
            const mergedOpportunityFields = (
                response.body.results[1].result as RelatedListRecordCollectionRepresentation
            ).records[0].fields;

            expect(mergedContactFields).toEqual({
                Id: {
                    displayValue: null,
                    value: CONTACT_ID1,
                },
                Name: {
                    displayValue: 'John Smith',
                    value: 'John Smith',
                },
            });

            expect(mergedOpportunityFields).toEqual({
                Id: {
                    displayValue: null,
                    value: OPPORTUNITY_ID1,
                },
                Name: {
                    displayValue: 'Sell 1 bottle of H2O',
                    value: 'Sell 1 bottle of H2O',
                },
            });
        });
    });
});
