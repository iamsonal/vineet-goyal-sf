import { HttpStatusCode, ResourceRequest } from '@luvio/engine';
import { buildGetRecordByFieldsCompositeRequest } from '../dispatch/execute-aggregate-ui';
import platformNetworkAdapter from '../main';
import { UI_API_BASE_URI } from '../uiapi-base';
import { buildResourceRequest } from './test-utils';

function testControllerInput(request: Partial<ResourceRequest>, expectedResponseBody?) {
    test('invokes the right controller', async () => {
        const fn = jest
            .fn()
            .mockResolvedValueOnce(
                expectedResponseBody ? { body: expectedResponseBody } : { body: {} }
            );
        const fullReq = buildResourceRequest(request);
        await platformNetworkAdapter(fn)(fullReq);

        expect(fn).toHaveBeenCalledWith(fullReq);
    });
}

function testRejectFetchResponse(request: Partial<ResourceRequest>) {
    test('rejects an instance of FetchError the controller throws', async () => {
        const mockErrorResponse = {
            body: [
                {
                    statusCode: 400,
                    message: 'Invalid request',
                },
            ],
            status: 404,
        };
        const fn = jest.fn().mockRejectedValueOnce(mockErrorResponse);

        try {
            await platformNetworkAdapter(fn)(buildResourceRequest(request));
            throw new Error('Test failure: No error thrown');
        } catch (e) {
            expect(e).toStrictEqual(mockErrorResponse);
        }
    });
}

function testResolveResponse(request: Partial<ResourceRequest>, response: any) {
    test('resolves the controller response', async () => {
        const returnValue = {
            status: 200,
            body: response,
        };
        const fn = jest.fn().mockResolvedValueOnce(returnValue);
        const res = await platformNetworkAdapter(fn)(buildResourceRequest(request));

        expect(res).toBe(returnValue);
    });
}

describe('routes', () => {
    describe('get /some-random/{api}', () => {
        testControllerInput({
            method: 'get',
            baseUri: '/base-uri',
            basePath: '/some-random/api',
            urlParams: {
                api: 'api',
            },
        });

        testRejectFetchResponse({
            method: 'get',
            baseUri: '/base-uri',
            basePath: '/some-random/api',
            urlParams: {
                api: 'api',
            },
        });

        testResolveResponse(
            {
                method: 'get',
                baseUri: '/base-uri',
                basePath: '/some-random/api',
                urlParams: {
                    api: 'api',
                },
            },
            {
                id: 'hello',
                title: 'world',
            }
        );
    });

    describe('post /records', () => {
        testControllerInput({
            method: 'post',
            baseUri: UI_API_BASE_URI,
            basePath: `/records`,
            body: {
                apiName: 'Test__c',
                fields: [],
            },
        });

        describe('with query params', () => {
            testControllerInput({
                method: 'post',
                baseUri: UI_API_BASE_URI,
                basePath: `/records`,
                body: {
                    apiName: 'Test__c',
                    fields: [],
                },
                queryParams: {
                    triggerUserEmail: true,
                },
            });
        });

        testRejectFetchResponse({
            method: 'post',
            baseUri: UI_API_BASE_URI,
            basePath: `/records`,
        });

        testResolveResponse(
            {
                method: 'post',
                baseUri: UI_API_BASE_URI,
                basePath: `/records`,
                body: {
                    apiName: 'Test__c',
                    fields: [],
                },
            },
            {
                id: '1234',
                apiName: 'Test__c',
                fields: {},
            }
        );
    });

    describe('get /records/{recordId}', () => {
        testRejectFetchResponse({
            method: 'get',
            baseUri: UI_API_BASE_URI,
            basePath: `/records/1234`,
            urlParams: {
                recordId: '1234',
            },
        });

        testResolveResponse(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/records/1234`,
                urlParams: {
                    recordId: '1234',
                },
                queryParams: {
                    fields: ['Id'],
                },
            },
            {
                id: '1234',
                fields: {
                    Id: {
                        value: '1234',
                    },
                },
            }
        );

        describe('with fields', () => {
            testControllerInput({
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/records/1234`,
                urlParams: {
                    recordId: '1234',
                },
                queryParams: {
                    fields: ['Id'],
                    optionalFields: [],
                },
            });
        });

        describe('with optional fields', () => {
            testControllerInput({
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/records/1234`,
                urlParams: {
                    recordId: '1234',
                },
                queryParams: {
                    fields: [],
                    optionalFields: ['Name'],
                },
            });
        });

        describe('with optional and required fields', () => {
            testControllerInput({
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/records/1234`,
                urlParams: {
                    recordId: '1234',
                },
                queryParams: {
                    fields: ['Id'],
                    optionalFields: ['Name'],
                },
            });
        });

        describe('with a large amount of fields', () => {
            it('should call aggregate-ui correctly', async () => {
                let generatedFields = generateMockedRecordFields(
                    2000,
                    'ExtremelyLongTestFieldName'
                );
                let responseBody = {
                    compositeResponse: [
                        {
                            body: {},
                            httpStatusCode: HttpStatusCode.Ok,
                        },
                    ],
                };
                let resourceRequest: ResourceRequest = {
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

                const compositeRequest = buildGetRecordByFieldsCompositeRequest(resourceRequest, {
                    fieldsArray: generatedFields,
                    optionalFieldsArray: [],
                    fieldsLength: generatedFields.join(',').length,
                    optionalFieldsLength: 0,
                });

                const aggregateUiParams = {
                    input: {
                        compositeRequest,
                    },
                };

                const aggregateUiResourceRequest: ResourceRequest = {
                    baseUri: UI_API_BASE_URI,
                    basePath: '/aggregate-ui',
                    method: 'post',
                    urlParams: {},
                    body: aggregateUiParams,
                    queryParams: {},
                    headers: {},
                };

                const fn = jest.fn().mockResolvedValueOnce({ body: responseBody });
                await platformNetworkAdapter(fn)(resourceRequest);
                expect(fn).toHaveBeenCalledWith(aggregateUiResourceRequest);
            });
        });

        describe('with layout', () => {
            testControllerInput({
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/records/1234`,
                urlParams: {
                    recordId: '1234',
                },
                queryParams: {
                    layoutTypes: ['Full'],
                    modes: ['View'],
                    optionalFields: ['Name'],
                },
            });
        });
    });

    describe('patch /records/{recordId}', () => {
        testControllerInput({
            method: 'patch',
            baseUri: UI_API_BASE_URI,
            basePath: `/records/1234`,
            urlParams: {
                recordId: '1234',
            },
            body: {
                apiName: 'Test__c',
                fields: [],
            },
            headers: {
                'If-Modified-Since': '1234',
            },
        });

        testControllerInput({
            method: 'patch',
            baseUri: UI_API_BASE_URI,
            basePath: `/records/1234`,
            urlParams: {
                recordId: '1234',
            },
            body: {
                apiName: 'Test__c',
                fields: [],
            },
            headers: {
                'If-Unmodified-Since': '1234',
            },
        });

        describe('with query params', () => {
            testControllerInput({
                method: 'patch',
                baseUri: UI_API_BASE_URI,
                basePath: `/records/1234`,
                urlParams: {
                    recordId: '1234',
                },
                queryParams: {
                    useDefaultRule: true,
                },
                body: {
                    apiName: 'Test__c',
                    fields: [],
                },
                headers: {
                    'If-Modified-Since': '1234',
                },
            });
        });

        testRejectFetchResponse({
            method: 'patch',
            baseUri: UI_API_BASE_URI,
            basePath: `/records/1234`,
        });

        testResolveResponse(
            {
                method: 'patch',
                baseUri: UI_API_BASE_URI,
                basePath: `/records/1234`,
                urlParams: {
                    recordId: '1234',
                },
                body: {
                    apiName: 'Test__c',
                    fields: [],
                },
            },
            {
                id: '1234',
                apiName: 'Test__c',
                fields: {},
            }
        );
    });

    describe('delete /records/{recordId}', () => {
        testControllerInput({
            method: 'delete',
            baseUri: UI_API_BASE_URI,
            basePath: `/records/1234`,
            urlParams: {
                recordId: '1234',
            },
            body: {},
        });

        testRejectFetchResponse({
            method: 'delete',
            baseUri: UI_API_BASE_URI,
            basePath: `/records/1234`,
        });

        testResolveResponse(
            {
                method: 'delete',
                baseUri: UI_API_BASE_URI,
                basePath: `/records/1234`,
                urlParams: {
                    recordId: '1234',
                },
                body: {},
            },
            null
        );
    });

    describe('get /records/batch/{recordIds}', () => {
        testControllerInput({
            method: 'get',
            baseUri: UI_API_BASE_URI,
            basePath: `/records/batch/1234,5678`,
            urlParams: {
                recordIds: ['1234', '5678'],
            },
            queryParams: {
                fields: ['Id'],
                optionalFields: ['Name'],
            },
        });

        testRejectFetchResponse({
            method: 'get',
            baseUri: UI_API_BASE_URI,
            basePath: `/records/batch/1234,5678`,
            urlParams: {
                recordIds: ['1234', '5678'],
            },
        });

        testResolveResponse(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/records/batch/1234,5678`,
                urlParams: {
                    recordIds: ['1234', '5678'],
                },
            },
            {
                hasErrors: false,
                fields: [
                    { statusCode: 200, result: {} },
                    { statusCode: 200, result: {} },
                ],
            }
        );
    });
});

function generateMockedRecordFields(
    numberOfFields: number,
    customFieldName?: string
): Array<string> {
    const fields: Array<string> = new Array();
    const fieldName =
        customFieldName !== undefined ? customFieldName.replace(/\s+/g, '') : 'CustomField';

    for (let i = 0; i < numberOfFields; i++) {
        fields.push(`${fieldName}${i}__c`);
    }

    return fields;
}
