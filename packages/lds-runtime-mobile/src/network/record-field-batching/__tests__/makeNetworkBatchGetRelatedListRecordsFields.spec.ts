import { FetchResponse, HttpStatusCode } from '@luvio/engine';
import { RelatedListRecordCollectionRepresentation } from '@salesforce/lds-adapters-uiapi';
import { makeNetworkBatchGetRelatedListRecordsFields } from '../makeNetworkBatchGetRelatedListRecordsFields';
import { CompositeRequest, CompositeResponseEnvelope } from '../utils';
import {
    BASE_URI,
    generateMockedRecordFields,
    verifyRequestBasePath,
    wrapFieldsInRelatedRecordObject,
} from './testUtils';

const RECORD_ID = '001x0000004u7cZAAQ';
const CONTACT_ID_FIELD_STRING = 'Contact.Id';
const CONTACT_NAME_FIELD_STRING = 'Contact.Name';
const GET_RELATED_RECORDS_BASE_PATH = `/ui-api/related-list-records/${RECORD_ID}/Contacts`;

describe('makeNetworkBatchGetRelatedListRecordsFields', () => {
    let baseNetwork;
    let network;
    beforeEach(() => {
        baseNetwork = jest.fn();
        network = makeNetworkBatchGetRelatedListRecordsFields(baseNetwork);
    });

    describe('execute request does not go aggregate ui', () => {
        it('post will not call aggregate ui', async () => {
            const body = { testBody: 'fooBody' };
            const request = {
                baseUri: BASE_URI,
                basePath: GET_RELATED_RECORDS_BASE_PATH,
                method: 'post',
                body: JSON.stringify(body),
            };
            await network(request);
            expect(baseNetwork.mock.calls[0][0].method).toBe('post');
            verifyRequestBasePath(baseNetwork.mock.calls[0][0], GET_RELATED_RECORDS_BASE_PATH);
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
                basePath: GET_RELATED_RECORDS_BASE_PATH,
                method: 'get',
                queryParams: {
                    layoutTypes: 'Compact',
                },
            };
            network(request);

            const calledRequest = baseNetwork.mock.calls[0][0];
            verifyRequestBasePath(calledRequest, GET_RELATED_RECORDS_BASE_PATH);
        });
        it('get record with modes will not call aggregate ui', () => {
            const request = {
                baseUri: BASE_URI,
                basePath: GET_RELATED_RECORDS_BASE_PATH,
                method: 'get',
                queryParams: {
                    modes: 'Create',
                },
            };
            network(request);

            const calledRequest = baseNetwork.mock.calls[0][0];
            verifyRequestBasePath(calledRequest, GET_RELATED_RECORDS_BASE_PATH);
        });
        it('get record with with short url will not call aggregate ui', () => {
            const queryParams = {
                fields: [CONTACT_ID_FIELD_STRING],
                optionalFields: [CONTACT_NAME_FIELD_STRING],
            };
            const request = {
                baseUri: BASE_URI,
                basePath: GET_RELATED_RECORDS_BASE_PATH,
                method: 'get',
                queryParams: queryParams,
            };
            network(request);

            const calledRequest = baseNetwork.mock.calls[0][0];
            expect(calledRequest.basePath).toBe(GET_RELATED_RECORDS_BASE_PATH);
            expect(calledRequest.queryParams).toEqual(queryParams);
        });
    });

    describe('execute request goes to aggregate ui', () => {
        it('get record with with long enough url will call aggregate ui', async () => {
            const responseChunk1 = wrapFieldsInRelatedRecordObject(
                {
                    Id: {
                        displayValue: null,
                        value: RECORD_ID,
                    },
                },
                { fields: ['Contact.Id'], optionalFields: [] }
            );
            const responseChunk2 = wrapFieldsInRelatedRecordObject(
                {
                    Name: {
                        displayValue: 'Costco Richmond',
                        value: 'Costco Richmond',
                    },
                },
                { fields: [], optionalFields: ['Contact.Name'] }
            );

            const mockCompositeResponse: FetchResponse<
                CompositeResponseEnvelope<RelatedListRecordCollectionRepresentation>
            > = {
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
            const lengthAwareNetworkAdapter =
                makeNetworkBatchGetRelatedListRecordsFields(mockNetworkAdapter);

            const queryParams = {
                fields: generateMockedRecordFields(400),
                optionalFields: generateMockedRecordFields(400),
            };

            const request: any = {
                baseUri: BASE_URI,
                basePath: GET_RELATED_RECORDS_BASE_PATH,
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
            expect(compositeRequests[0].url).toMatch(GET_RELATED_RECORDS_BASE_PATH);

            expect(countAllFields(compositeRequests[0].url)).toEqual(400);
            expect(countAllFields(compositeRequests[1].url)).toEqual(400);

            expect(record.body).toEqual(
                wrapFieldsInRelatedRecordObject(
                    {
                        Id: {
                            displayValue: null,
                            value: RECORD_ID,
                        },
                        Name: {
                            displayValue: 'Costco Richmond',
                            value: 'Costco Richmond',
                        },
                    },
                    { fields: ['Contact.Id'], optionalFields: ['Contact.Name'] }
                )
            );
        });

        it('returns error when records returned from batches are not equal', async () => {
            const responseChunk1 = wrapFieldsInRelatedRecordObject(
                {
                    Id: {
                        displayValue: null,
                        value: RECORD_ID,
                    },
                },
                { fields: ['Contact.Id'], optionalFields: [] }
            );

            responseChunk1.records = responseChunk1.records.concat(responseChunk1.records[0]);

            const responseChunk2 = wrapFieldsInRelatedRecordObject(
                {
                    Name: {
                        displayValue: 'Costco Richmond',
                        value: 'Costco Richmond',
                    },
                },
                { fields: [], optionalFields: ['Contact.Name'] }
            );

            const mockCompositeResponse: FetchResponse<
                CompositeResponseEnvelope<RelatedListRecordCollectionRepresentation>
            > = {
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
            const lengthAwareNetworkAdapter =
                makeNetworkBatchGetRelatedListRecordsFields(mockNetworkAdapter);

            const queryParams = {
                fields: generateMockedRecordFields(400),
                optionalFields: generateMockedRecordFields(400),
            };

            const request: any = {
                baseUri: BASE_URI,
                basePath: GET_RELATED_RECORDS_BASE_PATH,
                method: 'get',
                queryParams: queryParams,
            };

            const record = await lengthAwareNetworkAdapter(request);

            expect(record).toEqual({
                body: {
                    error: 'Error: Aggregate UI response is invalid',
                },
                headers: null,
                ok: true,
                status: 500,
                statusText: 'Server Error',
            });
        });

        it('returns error when records ids returned are not equal', async () => {
            const responseChunk1 = wrapFieldsInRelatedRecordObject(
                {
                    Id: {
                        displayValue: null,
                        value: RECORD_ID,
                    },
                },
                { fields: ['Contact.Id'], optionalFields: [] }
            );

            responseChunk1.records = responseChunk1.records.map((record) => {
                return {
                    ...record,
                    id: '1234',
                };
            });

            const responseChunk2 = wrapFieldsInRelatedRecordObject(
                {
                    Name: {
                        displayValue: 'Costco Richmond',
                        value: 'Costco Richmond',
                    },
                },
                { fields: [], optionalFields: ['Contact.Name'] }
            );

            const mockCompositeResponse: FetchResponse<
                CompositeResponseEnvelope<RelatedListRecordCollectionRepresentation>
            > = {
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
            const lengthAwareNetworkAdapter =
                makeNetworkBatchGetRelatedListRecordsFields(mockNetworkAdapter);

            const queryParams = {
                fields: generateMockedRecordFields(400),
                optionalFields: generateMockedRecordFields(400),
            };

            const request: any = {
                baseUri: BASE_URI,
                basePath: GET_RELATED_RECORDS_BASE_PATH,
                method: 'get',
                queryParams: queryParams,
            };

            const record = await lengthAwareNetworkAdapter(request);

            expect(record).toEqual({
                body: {
                    error: 'Error: Aggregate UI response is invalid',
                },
                headers: null,
                ok: true,
                status: 500,
                statusText: 'Server Error',
            });
        });
    });
});

function countAllFields(url: string) {
    const params = new URLSearchParams(url.split('Contacts')[1]);
    const allFields = params.getAll('fields').concat(params.getAll('optionalFields'));
    return allFields.reduce((flat, array) => {
        return flat.concat(array.split(','));
    }, [] as string[]).length;
}
