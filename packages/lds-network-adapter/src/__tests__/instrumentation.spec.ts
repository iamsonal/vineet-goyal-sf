import { HttpStatusCode } from '@luvio/engine';
import platformNetworkAdapter from '../main';
import { UI_API_BASE_URI } from '../uiapi-base';
import { buildResourceRequest } from './test-utils';
import { generateMockedRecordFields } from '../dispatch/__tests__/test-utils';
import { instrumentation } from '../instrumentation';

describe('executeAggregateUi', () => {
    it('calls getRecordAggregateResolve when getRecord uses aggregate-ui endpoint and the response is successful', async () => {
        let generatedFields = generateMockedRecordFields(2000, 'ExtremelyLongTestFieldName');
        let responseBody = {
            compositeResponse: [
                {
                    body: {},
                    httpStatusCode: HttpStatusCode.Ok,
                },
            ],
        };
        let resourceRequest = {
            body: null,
            method: 'get',
            baseUri: UI_API_BASE_URI,
            basePath: `/records/1234`,
            headers: null,
            urlParams: {
                recordId: '1234',
            },
            queryParams: {
                fields: generatedFields,
            },
        };

        const resolveSpy = jest.spyOn(instrumentation, 'getRecordAggregateResolve');
        const fn = jest.fn().mockResolvedValueOnce({ body: responseBody });
        await platformNetworkAdapter(fn)(buildResourceRequest(resourceRequest));

        expect(resolveSpy).toHaveBeenCalledTimes(1);
    });

    it('calls getRecordAggregateReject when getRecord uses aggregate-ui endpoint and the response contains errors', async () => {
        const request = {
            method: 'get',
            baseUri: UI_API_BASE_URI,
            basePath: `/records/1234`,
            urlParams: {
                recordId: '1234',
            },
            queryParams: {
                fields: generateMockedRecordFields(800),
            },
        };

        const aggregateErrorResponse = {
            compositeResponse: [
                {
                    body: {
                        recordId: '1234',
                        apiName: 'Foo',
                        fields: { Field1__c: { value: '1', displayValue: '10' } },
                    },
                },
                {
                    httpStatusCode: HttpStatusCode.ServerError,
                },
                {
                    body: {
                        recordId: '1234',
                        apiName: 'Foo',
                        fields: { Field3__c: { value: '3', displayValue: '30' } },
                    },
                },
            ],
        };

        const rejectSpy = jest.spyOn(instrumentation, 'getRecordAggregateReject');
        const fn = jest.fn().mockRejectedValueOnce(aggregateErrorResponse);
        try {
            await platformNetworkAdapter(fn)(buildResourceRequest(request));
        } catch (err) {
            expect(rejectSpy).toHaveBeenCalledTimes(1);
        }
    });
});
