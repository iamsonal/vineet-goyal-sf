import { ResourceRequest, HttpStatusCode } from '@ldsjs/engine';
import * as aura from 'aura';
import auraStorage from 'aura-storage';
import { AuraFetchResponse } from '../AuraFetchResponse';
import networkAdapter from '../main';
import {
    COMMERCE_BASE_URI,
    CONNECT_BASE_URI,
    GUIDANCE_BASE_URI,
    WAVE_BASE_URI,
} from '../middlewares/connect-base';
import { UI_API_BASE_URI } from '../middlewares/uiapi-base';
import { ControllerInvoker } from '../middlewares/utils';
import { default as appRouter, Route } from '../router';
import { buildGetRecordByFieldsCompositeRequest } from '../middlewares/execute-aggregate-ui';
import { buildResourceRequest } from './test-utils';

jest.mock('@salesforce/lds-instrumentation', () => {
    const spies = {
        setAggregateUiChunkCountSpy: jest.fn(),
        logCRUDLightningInteraction: jest.fn(),
        cacheStatsLogMissesSpy: jest.fn(),
        cacheStatsLogHitsSpy: jest.fn(),
    };

    return {
        setAggregateUiChunkCountMetric: spies.setAggregateUiChunkCountSpy,
        incrementGetRecordNormalInvokeCount: () => {},
        incrementGetRecordAggregateInvokeCount: () => {},
        registerLdsCacheStats: () => ({
            logMisses: spies.cacheStatsLogMissesSpy,
            logHits: spies.cacheStatsLogHitsSpy,
        }),
        registerCacheStats: () => ({
            logMisses: spies.cacheStatsLogMissesSpy,
            logHits: spies.cacheStatsLogHitsSpy,
        }),
        logCRUDLightningInteraction: spies.logCRUDLightningInteraction,
        __spies: spies,
    };
});

import { __spies as instrumentationSpies } from '@salesforce/lds-instrumentation';

// Make sure to reset the executeGlobalController mock and the storage between each test.
beforeEach(() => {
    if (jest.isMockFunction(aura.executeGlobalController)) {
        aura.executeGlobalController.mockReset();
    }

    instrumentationSpies.logCRUDLightningInteraction.mockClear();
    instrumentationSpies.cacheStatsLogMissesSpy.mockClear();
    instrumentationSpies.cacheStatsLogHitsSpy.mockClear();
    instrumentationSpies.setAggregateUiChunkCountSpy.mockClear();

    return auraStorage.__reset();
});

function testControllerInput(
    request: Partial<ResourceRequest>,
    expectedParams: any[],
    expectedResponseBody?
) {
    test('invokes the right controller', async () => {
        const fn = jest
            .spyOn(aura, 'executeGlobalController')
            .mockResolvedValueOnce(expectedResponseBody ? expectedResponseBody : {});

        await networkAdapter(buildResourceRequest(request));

        expect(fn).toHaveBeenCalledWith(...expectedParams);
    });
}

function testRejectFetchResponse(request: Partial<ResourceRequest>) {
    test('rejects an instance of FetchError the controller throws', async () => {
        jest.spyOn(aura, 'executeGlobalController').mockRejectedValueOnce({
            data: {
                statusCode: 400,
                message: 'Invalid request',
            },
        });

        const { rejects } = await expect(networkAdapter(buildResourceRequest(request)));

        rejects.toBeInstanceOf(AuraFetchResponse);
        rejects.toMatchObject({
            status: 400,
            body: {
                statusCode: 400,
                message: 'Invalid request',
            },
        });
    });
}

function testResolveResponse(request: Partial<ResourceRequest>, response: any) {
    test('resolves the controller response', async () => {
        jest.spyOn(aura, 'executeGlobalController').mockResolvedValueOnce(response);

        const res = await networkAdapter(buildResourceRequest(request));

        expect(res).toBeInstanceOf(AuraFetchResponse);
        expect(res).toMatchObject({
            status: 200,
            body: response,
        });
    });
}

function testStorage(storageName: string, request: Partial<ResourceRequest>) {
    test('sets the response cache after the network request', async () => {
        const mockResponse = { test: 'response' };
        const cache = auraStorage.getStorage(storageName);

        jest.spyOn(aura, 'executeGlobalController').mockResolvedValueOnce(mockResponse);
        jest.spyOn(cache, 'set').mockResolvedValueOnce(undefined);

        await networkAdapter(buildResourceRequest(request));

        expect(cache.set).toBeCalledWith(expect.any(String), mockResponse);
    });

    test('loads the response from the cache if present', async () => {
        const mockResponse = { test: 'response' };

        jest.spyOn(aura, 'executeGlobalController').mockResolvedValueOnce(mockResponse);

        const firstResponse = await networkAdapter(buildResourceRequest(request));
        const secondResponse = await networkAdapter(buildResourceRequest(request));

        expect(aura.executeGlobalController).toHaveBeenCalledTimes(1);
        expect(firstResponse.body).toEqual(secondResponse.body);
    });

    test('loads response from the server if the cache lookup fails', async () => {
        const mockResponse = { test: 'response' };
        const cacheError = new Error('Internal AuraStorage error');
        const cache = auraStorage.getStorage(storageName);

        jest.spyOn(aura, 'executeGlobalController').mockResolvedValueOnce(mockResponse);
        jest.spyOn(cache, 'get').mockRejectedValueOnce(cacheError);

        const res = await networkAdapter(buildResourceRequest(request));

        expect(aura.executeGlobalController).toHaveBeenCalledTimes(1);
        expect(res.body).toEqual(mockResponse);
    });
}

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

describe('network adapter', () => {
    it('throws an error if no matching invoker is found', () => {
        const unknownRequest = buildResourceRequest({ method: 'get', basePath: '/test' });
        expect(() => {
            networkAdapter(unknownRequest);
        }).toThrow(/No invoker matching controller factory/);
    });
});

describe('routes', () => {
    let original;
    const testedRoutes: Record<string, boolean> = Object.keys(appRouter.methods).reduce(
        (acc, cur) => {
            const routes: Route[] = appRouter.methods[cur];
            routes.forEach(route => {
                const key = `${cur}:${route.handler.name}`;
                acc[key] = false;
            });
            return acc;
        },
        Object.create(null)
    );

    beforeAll(() => {
        original = appRouter.lookup;
        // override lookup function to bookkeep seen route from tests
        appRouter.lookup = function(resourceRequest: ResourceRequest): ControllerInvoker | null {
            const { basePath, baseUri, method } = resourceRequest;
            const path = `${baseUri}${basePath}`;
            const routes: Route[] = this.methods[method];
            if (routes === undefined || routes.length === 0) {
                return null;
            }

            const matchedRoute = routes.find(route => route.predicate(path));
            if (matchedRoute !== undefined) {
                testedRoutes[`${method}:${matchedRoute.handler.name}`] = true;
                return matchedRoute.handler;
            } else {
                return null;
            }
        };
    });

    afterAll(() => {
        appRouter.lookup = original;
    });

    describe('get /object-info/{apiName}', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: '/object-info/Test_c',
                urlParams: {
                    objectApiName: 'Test_c',
                },
            },
            [
                'RecordUiController.getObjectInfo',
                { objectApiName: 'Test_c' },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testRejectFetchResponse({
            method: 'get',
            baseUri: UI_API_BASE_URI,
            basePath: `/object-info/Test_c`,
            urlParams: {
                objectApiName: 'Test_c',
            },
        });

        testResolveResponse(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/object-info/Test_c`,
                urlParams: {
                    objectApiName: 'Test_c',
                },
            },
            {
                apiName: 'Test_c',
                fields: {},
            }
        );

        testStorage('ldsObjectInfo', {
            method: 'get',
            baseUri: UI_API_BASE_URI,
            basePath: `/object-info/Test_c`,
            urlParams: {
                objectApiName: 'Test_c',
            },
        });
    });

    describe('get /object-info/batch/{apiNames}', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/object-info/batch/Test1_c,Test2_c`,
                urlParams: {
                    objectApiNames: ['Test1_c', 'Test2_c'],
                },
            },
            [
                'RecordUiController.getObjectInfos',
                { objectApiNames: ['Test1_c', 'Test2_c'] },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testRejectFetchResponse({
            method: 'get',
            baseUri: UI_API_BASE_URI,
            basePath: `/object-info/batch/Test1_c,Test2_c`,
            urlParams: {
                objectApiNames: ['Test1_c', 'Test2_c'],
            },
        });

        testResolveResponse(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/object-info/batch/Test1_c,Test2_c`,
                urlParams: {
                    objectApiNames: ['Test1_c', 'Test2_c'],
                },
            },
            {
                results: [
                    {
                        result: {
                            apiName: 'Test1_c',
                            fields: {},
                        },
                        statusCode: 200,
                    },
                    {
                        result: {
                            apiName: 'Test2_c',
                            fields: {},
                        },
                        statusCode: 200,
                    },
                ],
            }
        );

        testStorage('ldsObjectInfo', {
            method: 'get',
            baseUri: UI_API_BASE_URI,
            basePath: `/object-info/Test_c`,
            urlParams: {
                objectApiName: 'Test_c',
            },
        });
    });

    describe('post /records', () => {
        testControllerInput(
            {
                method: 'post',
                baseUri: UI_API_BASE_URI,
                basePath: `/records`,
                body: {
                    apiName: 'Test__c',
                    fields: [],
                },
            },
            [
                'RecordUiController.createRecord',
                {
                    recordInput: {
                        apiName: 'Test__c',
                        fields: [],
                    },
                },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        describe('with query params', () => {
            testControllerInput(
                {
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
                },
                [
                    'RecordUiController.createRecord',
                    {
                        recordInput: {
                            apiName: 'Test__c',
                            fields: [],
                        },
                        useDefaultRule: undefined,
                        triggerOtherEmail: undefined,
                        triggerUserEmail: true,
                    },
                    { background: false, hotspot: true, longRunning: false },
                ]
            );
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
            testControllerInput(
                {
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
                },
                [
                    'RecordUiController.getRecordWithFields',
                    {
                        recordId: '1234',
                        fields: ['Id'],
                        optionalFields: ['Name'],
                    },
                    { background: false, hotspot: true, longRunning: false },
                ]
            );
        });

        describe('with a large amount of fields', () => {
            let generatedFields = generateMockedRecordFields(2000, 'ExtremelyLongTestFieldName');
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
                ingest: null,
                urlParams: {
                    recordId: '1234',
                },
                queryParams: {
                    fields: generatedFields,
                },
            };

            let expectedRequestPayload = buildGetRecordByFieldsCompositeRequest(
                '1234',
                resourceRequest,
                {
                    fieldsArray: generatedFields,
                    optionalFieldsArray: [],
                    fieldsLength: generatedFields.join(',').length,
                    optionalFieldsLength: 0,
                }
            );

            testControllerInput(
                resourceRequest,
                [
                    'RecordUiController.executeAggregateUi',
                    {
                        input: {
                            compositeRequest: expectedRequestPayload,
                        },
                    },
                    { background: false, hotspot: true, longRunning: false },
                ],
                responseBody
            );
        });

        describe('with layout', () => {
            testControllerInput(
                {
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
                },
                [
                    'RecordUiController.getRecordWithLayouts',
                    {
                        recordId: '1234',
                        layoutTypes: ['Full'],
                        modes: ['View'],
                        optionalFields: ['Name'],
                    },
                    { background: false, hotspot: true, longRunning: false },
                ]
            );
        });
    });

    describe('patch /records/{recordId}', () => {
        testControllerInput(
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
                headers: {
                    'If-Modified-Since': '1234',
                },
            },
            [
                'RecordUiController.updateRecord',
                {
                    recordId: '1234',
                    clientOptions: { ifModifiedSince: '1234' },
                    recordInput: {
                        apiName: 'Test__c',
                        fields: [],
                    },
                },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        describe('with query params', () => {
            testControllerInput(
                {
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
                },
                [
                    'RecordUiController.updateRecord',
                    {
                        recordId: '1234',
                        clientOptions: { ifModifiedSince: '1234' },
                        recordInput: {
                            apiName: 'Test__c',
                            fields: [],
                        },
                        useDefaultRule: true,
                        triggerUserEmail: undefined,
                    },
                    { background: false, hotspot: true, longRunning: false },
                ]
            );
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
        testControllerInput(
            {
                method: 'delete',
                baseUri: UI_API_BASE_URI,
                basePath: `/records/1234`,
                urlParams: {
                    recordId: '1234',
                },
                body: {},
            },
            [
                'RecordUiController.deleteRecord',
                {
                    recordId: '1234',
                },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

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
        testControllerInput(
            {
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
            },
            [
                'RecordUiController.getRecordsWithFields',
                {
                    recordIds: ['1234', '5678'],
                    fields: ['Id'],
                    optionalFields: ['Name'],
                },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

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

    describe('get /record-avatars/batch/{recordIds}', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/record-avatars/batch/1234,5678`,
                urlParams: {
                    recordIds: ['1234', '5678'],
                },
            },
            [
                'RecordUiController.getRecordAvatars',
                { recordIds: ['1234', '5678'] },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testRejectFetchResponse({
            method: 'get',
            baseUri: UI_API_BASE_URI,
            basePath: `/record-avatars/batch/1234,5678`,
            urlParams: {
                recordIds: ['1234', '5678'],
            },
        });

        testResolveResponse(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/record-avatars/batch/1234,5678`,
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

    describe('post /record-avatars/{recordIds}/assocation', () => {
        testControllerInput(
            {
                method: 'post',
                baseUri: UI_API_BASE_URI,
                basePath: `/record-avatars/1234/association`,
                urlParams: {
                    recordId: '1234',
                },
                body: {
                    externalId: '123',
                    blueMasterId: null,
                    profileName: null,
                    photoUrl: 'abc',
                    actionType: 'Associate',
                },
            },
            [
                'RecordUiController.postRecordAvatarAssociation',
                {
                    input: {
                        externalId: '123',
                        blueMasterId: null,
                        profileName: null,
                        photoUrl: 'abc',
                        actionType: 'Associate',
                    },
                    recordId: '1234',
                },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testRejectFetchResponse({
            method: 'post',
            baseUri: UI_API_BASE_URI,
            basePath: `/record-avatars/1234/association`,
            urlParams: {
                recordId: '1234',
            },
            body: {
                externalId: '123',
                blueMasterId: null,
                profileName: null,
                photoUrl: 'abc',
                actionType: 'Associate',
            },
        });

        testResolveResponse(
            {
                method: 'post',
                baseUri: UI_API_BASE_URI,
                basePath: `/record-avatars/1234/association`,
                urlParams: {
                    recordId: '1234',
                },
                body: {
                    externalId: '123',
                    blueMasterId: null,
                    profileName: null,
                    photoUrl: 'abc',
                    actionType: 'Associate',
                },
            },
            {
                type: 'Theme',
                iconUrl: 'salesforce.com',
                recordId: '1234',
                backgroundColor: '7F8DE1',
                eTag: '123',
            }
        );
    });

    describe('get /record-ui/{recordIds}', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/record-ui/1234,5678`,
                urlParams: {
                    recordIds: '1234,5678',
                },
            },
            [
                'RecordUiController.getRecordUis',
                {
                    recordIds: '1234,5678',
                    layoutTypes: undefined,
                    modes: undefined,
                    optionalFields: undefined,
                },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testRejectFetchResponse({
            method: 'get',
            baseUri: UI_API_BASE_URI,
            basePath: `/record-ui/1234,5678`,
            urlParams: {
                recordIds: '1234,5678',
            },
        });

        testResolveResponse(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/record-ui/1234,5678`,
                urlParams: {
                    recordIds: '1234,5678',
                },
            },
            {
                layoutUserStates: {},
                layouts: {},
                objectInfos: {},
                records: { '1234': {}, '5678': {} },
            }
        );
    });

    describe('get /layout/{objectApiName}/user-state', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/layout/Opportunity/user-state`,
                urlParams: {
                    objectApiName: 'Opportunity',
                },
                queryParams: {
                    layoutType: 'Full',
                    mode: 'View',
                    recordTypeId: '123',
                },
            },
            [
                'RecordUiController.getLayoutUserState',
                {
                    objectApiName: 'Opportunity',
                    layoutType: 'Full',
                    mode: 'View',
                    recordTypeId: '123',
                },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testRejectFetchResponse({
            method: 'get',
            baseUri: UI_API_BASE_URI,
            basePath: `/layout/Opportunity/user-state`,
            urlParams: {
                objectApiName: 'Opportunity',
            },
            queryParams: {
                layoutType: 'Full',
                mode: 'View',
                recordTypeId: '123',
            },
        });

        testResolveResponse(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/layout/Opportunity/user-state`,
                urlParams: {
                    objectApiName: 'Opportunity',
                },
                queryParams: {
                    layoutType: 'Full',
                    mode: 'View',
                    recordTypeId: '123',
                },
            },
            {
                id: 'LAYOUT_USER_STATE',
                sectionUserStates: {},
            }
        );

        testStorage('ldsLayoutUserState', {
            method: 'get',
            baseUri: UI_API_BASE_URI,
            basePath: `/layout/Opportunity/user-state`,
            urlParams: {
                objectApiName: 'Opportunity',
            },
            queryParams: {
                layoutType: 'Full',
                mode: 'View',
                recordTypeId: '123',
            },
        });
    });

    describe('patch /layout/{objectApiName}/user-state', () => {
        testControllerInput(
            {
                method: 'patch',
                baseUri: UI_API_BASE_URI,
                basePath: `/layout/Opportunity/user-state`,
                urlParams: {
                    objectApiName: 'Opportunity',
                },
                queryParams: {
                    layoutType: 'Full',
                    mode: 'View',
                    recordTypeId: '123',
                },
            },
            [
                'RecordUiController.updateLayoutUserState',
                {
                    objectApiName: 'Opportunity',
                    layoutType: 'Full',
                    mode: 'View',
                    recordTypeId: '123',
                    userState: {},
                },
                {
                    background: false,
                    hotspot: true,
                    longRunning: false,
                },
            ]
        );

        testRejectFetchResponse({
            method: 'patch',
            baseUri: UI_API_BASE_URI,
            basePath: `/layout/Opportunity/user-state`,
            urlParams: {
                objectApiName: 'Opportunity',
            },
            queryParams: {
                layoutType: 'Full',
                mode: 'View',
                recordTypeId: '123',
            },
        });

        testResolveResponse(
            {
                method: 'patch',
                baseUri: UI_API_BASE_URI,
                basePath: `/layout/Opportunity/user-state`,
                urlParams: {
                    objectApiName: 'Opportunity',
                },
                queryParams: {
                    layoutType: 'Full',
                    mode: 'View',
                    recordTypeId: '123',
                },
            },
            {
                id: 'LAYOUT_USER_STATE',
                sectionUserStates: {},
            }
        );

        it('cleans the layoutUserState storage', async () => {
            const cache = auraStorage.getStorage('ldsLayoutUserState');
            await cache.set('test', {});

            const beforeSize = await cache.getSize();
            expect(beforeSize).toBe(1);

            jest.spyOn(aura, 'executeGlobalController').mockResolvedValueOnce({});
            await networkAdapter(
                buildResourceRequest({
                    method: 'patch',
                    baseUri: UI_API_BASE_URI,
                    basePath: `/layout/Opportunity/user-state`,
                    urlParams: {
                        objectApiName: 'Opportunity',
                    },
                    queryParams: {
                        layoutType: 'Full',
                        mode: 'View',
                        recordTypeId: '123',
                    },
                })
            );

            const afterSize = await cache.getSize();
            expect(afterSize).toBe(0);
        });
    });

    describe('get /layout/{recordIds}', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/layout/Opportunity`,
                urlParams: {
                    objectApiName: 'Opportunity',
                },
                queryParams: {
                    layoutType: 'Full',
                    mode: 'View',
                    recordTypeId: '123',
                },
                headers: {
                    'If-Modified-Since': '123',
                },
            },
            [
                'RecordUiController.getLayout',
                {
                    objectApiName: 'Opportunity',
                    layoutType: 'Full',
                    mode: 'View',
                    recordTypeId: '123',
                    clientOptions: {
                        ifModifiedSince: '123',
                    },
                },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testRejectFetchResponse({
            method: 'get',
            baseUri: UI_API_BASE_URI,
            basePath: `/layout/Opportunity`,
            urlParams: {
                objectApiName: 'Opportunity',
            },
            queryParams: {
                layoutType: 'Full',
                mode: 'View',
                recordTypeId: '123',
            },
            headers: {
                'If-Modified-Since': '123',
            },
        });

        testResolveResponse(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/layout/Opportunity`,
                urlParams: {
                    objectApiName: 'Opportunity',
                },
                queryParams: {
                    layoutType: 'Full',
                    mode: 'View',
                    recordTypeId: '123',
                },
                headers: {
                    'If-Modified-Since': '123',
                },
            },
            {
                eTag: 'fb9559ebbc83aecf2dc40dc12631d61c',
                id: 'LAYOUT',
                layoutType: 'Compact',
                mode: 'View',
                sections: [],
            }
        );

        testStorage('ldsLayout', {
            method: 'get',
            baseUri: UI_API_BASE_URI,
            basePath: `/layout/Opportunity`,
            urlParams: {
                objectApiName: 'Opportunity',
            },
            queryParams: {
                layoutType: 'Full',
                mode: 'View',
                recordTypeId: '123',
            },
            headers: {
                'If-Modified-Since': '123',
            },
        });
    });

    describe('post /predupe', () => {
        testControllerInput(
            {
                method: 'post',
                baseUri: UI_API_BASE_URI,
                basePath: `/predupe`,
                body: {
                    apiName: 'Lead',
                    fields: {},
                },
            },
            [
                'RecordUiController.findDuplicates',
                {
                    recordInput: {
                        apiName: 'Lead',
                        fields: {},
                    },
                },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testRejectFetchResponse({
            method: 'post',
            baseUri: UI_API_BASE_URI,
            basePath: `/predupe`,
        });

        testResolveResponse(
            {
                method: 'post',
                baseUri: UI_API_BASE_URI,
                basePath: `/predupe`,
                body: {
                    apiName: 'Lead',
                    fields: {},
                },
            },
            {
                allowSave: true,
                duplicateError: false,
                duplicateRules: [],
                matches: [],
            }
        );
    });

    describe('get /duplicates/{objectApiName}', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: '/duplicates/Test_c',
                urlParams: {
                    objectApiName: 'Test_c',
                },
            },
            [
                'RecordUiController.getDedupeConfig',
                { objectApiName: 'Test_c' },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testRejectFetchResponse({
            method: 'get',
            baseUri: UI_API_BASE_URI,
            basePath: `/duplicates/Test_c`,
            urlParams: {
                objectApiName: 'Test_c',
            },
        });

        testResolveResponse(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/duplicates/Test_c`,
                urlParams: {
                    objectApiName: 'Test_c',
                },
            },
            {
                apiName: 'Test_c',
                dedupeEnabled: true,
                predupeEnabled: true,
            }
        );
    });

    describe('post /apex', () => {
        it('invokes the right controller', async () => {
            const fn = jest.spyOn(aura, 'executeGlobalController').mockResolvedValueOnce({});

            await networkAdapter({
                method: 'post',
                baseUri: '',
                basePath: '/apex',
                body: {
                    namespace: '',
                    classname: 'ContactController',
                    method: 'getContactList',
                    params: undefined,
                    cacheable: true,
                    isContinuation: false,
                },
                queryParams: {},
                urlParams: {},
                key: 'key',
                headers: null,
                ingest: (() => {}) as any,
            });

            expect(fn).toHaveBeenCalledWith(
                'ApexActionController.execute',
                {
                    namespace: '',
                    classname: 'ContactController',
                    method: 'getContactList',
                    params: undefined,
                    cacheable: true,
                    isContinuation: false,
                },
                { background: false, hotspot: false, longRunning: false }
            );
        });

        it('handles response with no returnValue', async () => {
            jest.spyOn(aura, 'executeGlobalController').mockResolvedValueOnce({ cacheable: true });

            const res = await networkAdapter({
                method: 'post',
                baseUri: '',
                basePath: '/apex',
                body: {
                    namespace: '',
                    classname: 'TestController',
                    method: 'getVoid',
                    params: undefined,
                    cacheable: true,
                    isContinuation: false,
                },
                queryParams: {},
                urlParams: {},
                key: 'key',
                headers: null,
                ingest: (() => {}) as any,
            });

            expect(res).toBeInstanceOf(AuraFetchResponse);
            expect(res).toMatchObject({
                status: 200,
                body: null,
                headers: { cacheable: true },
            });
        });
    });

    describe('get /actions/lookup/{apiNames}', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/actions/lookup/Test_a,Test_c`,
                urlParams: {
                    objectApiNames: ['Test_a', 'Test_c'],
                },
            },
            [
                'ActionsController.getLookupActions',
                { objectApiNames: ['Test_a', 'Test_c'] },
                undefined,
            ]
        );

        testRejectFetchResponse({
            method: 'get',
            baseUri: UI_API_BASE_URI,
            basePath: `/actions/lookup/Test_a,Test_c`,
            urlParams: {
                objectApiNames: ['Test_a', 'Test_c'],
            },
        });

        testResolveResponse(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/actions/lookup/Test_a,Test_c`,
                urlParams: {
                    objectApiNames: ['Test_a', 'Test_c'],
                },
            },
            {
                actions: {
                    Test_a: {
                        actions: [],
                    },
                    Test_c: {
                        actions: [],
                    },
                },
            }
        );
    });

    describe('get /object-info/{objectApiName}/picklist-values/{recordTypeId}/{fieldApiName}', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/object-info/Opportunity/picklist-values/012T00000004MUHIA2/User`,
                urlParams: {
                    objectApiName: 'Opportunity',
                    recordTypeId: '012T00000004MUHIA2',
                    fieldApiName: 'User',
                },
            },
            [
                'RecordUiController.getPicklistValues',
                {
                    objectApiName: 'Opportunity',
                    recordTypeId: '012T00000004MUHIA2',
                    fieldApiName: 'User',
                },
                {
                    background: false,
                    hotspot: true,
                    longRunning: false,
                },
            ]
        );

        testRejectFetchResponse({
            method: 'get',
            baseUri: UI_API_BASE_URI,
            basePath: `/object-info/Opportunity/picklist-values/012T00000004MUHIA2/User`,
            urlParams: {
                objectApiName: 'Opportunity',
                recordTypeId: '012T00000004MUHIA2',
                fieldApiName: 'User',
            },
        });

        testResolveResponse(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/object-info/Opportunity/picklist-values/012T00000004MUHIA2/User`,
                urlParams: {
                    objectApiName: 'Opportunity',
                    recordTypeId: '012T00000004MUHIA2',
                    fieldApiName: 'User',
                },
            },
            {
                controllerValues: {
                    Aloha: 0,
                    SFX: 1,
                    S1: 2,
                    Wave: 3,
                    Other: 4,
                },
                defaultValue: null,
                eTag: 'a4587e5dc7cc5157e1f07e3cc9ed94e5',
                url:
                    '/services/data/v51.0/ui-api/object-info/Opportunity/picklist-values/012T00000004MUHIA2/User',
                values: [
                    {
                        attributes: null,
                        label: 'All',
                        validFor: [0, 1, 2],
                        value: 'All',
                    },
                ],
            }
        );
    });

    describe('get /object-info/{objectApiName}/picklist-values/{recordTypeId}', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/object-info/Opportunity/picklist-values/012T00000004MUHIA2`,
                urlParams: {
                    objectApiName: 'Opportunity',
                    recordTypeId: '012T00000004MUHIA2',
                },
            },
            [
                'RecordUiController.getPicklistValuesByRecordType',
                {
                    objectApiName: 'Opportunity',
                    recordTypeId: '012T00000004MUHIA2',
                },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testRejectFetchResponse({
            method: 'get',
            baseUri: UI_API_BASE_URI,
            basePath: `/object-info/Opportunity/picklist-values/012T00000004MUHIA2`,
            urlParams: {
                objectApiName: 'Opportunity',
                recordTypeId: '012T00000004MUHIA2',
            },
        });

        testResolveResponse(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/object-info/Opportunity/picklist-values/012T00000004MUHIA2`,
                urlParams: {
                    objectApiName: 'Opportunity',
                    recordTypeId: '012T00000004MUHIA2',
                },
            },
            {
                eTag: 'a4587e5dc7cc5157e1f07e3cc9ed94e5',
                picklistFieldValues: {},
            }
        );
    });

    describe('get /lookups/{objectApiName}/{fieldApiName}/{targetApiName}', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/lookups/Opportunity/Owner/User`,
                urlParams: {
                    objectApiName: 'Opportunity',
                    fieldApiName: 'Owner',
                    targetApiName: 'User',
                },
            },
            [
                'LookupController.getLookupRecords',
                {
                    objectApiName: 'Opportunity',
                    fieldApiName: 'Owner',
                    targetApiName: 'User',
                },
                undefined,
            ]
        );

        testRejectFetchResponse({
            method: 'get',
            baseUri: UI_API_BASE_URI,
            basePath: `/lookups/Opportunity/Owner/User`,
            urlParams: {
                objectApiName: 'Opportunity',
                fieldApiName: 'Owner',
                targetApiName: 'User',
            },
            queryParams: {
                q: 'George',
                searchType: 'Recent',
                page: 1,
                pageSize: 10,
            },
        });

        testResolveResponse(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/lookups/Opportunity/Owner/User`,
                urlParams: {
                    objectApiName: 'Opportunity',
                    fieldApiName: 'Owner',
                    targetApiName: 'User',
                },
            },
            {
                count: 1,
                currentPageToken: null,
                currentPageUrl:
                    '/services/data/v47.0/ui-api/lookups/ADM_Work__c/Assignee__c/User?q=George&searchType=Recent&page=1&pageSize=10',
                nextPageToken: null,
                nextPageUrl: null,
                previousPageToken: null,
                previousPageUrl: null,
                records: [
                    {
                        apiName: 'User',
                        childRelationships: {},
                        eTag: 'c730ef1c211c50f329714422a31c2977',
                        fields: {},
                        id: '005B0000004933MIAQ',
                        lastModifiedById: null,
                        lastModifiedDate: null,
                        recordTypeInfo: null,
                        systemModstamp: null,
                    },
                ],
            }
        );
    });

    describe('get /actions/record/${recordIds}', () => {
        describe('/record-edit', () => {
            testControllerInput(
                {
                    method: 'get',
                    baseUri: UI_API_BASE_URI,
                    basePath: `/actions/record/1234,5678/record-edit`,
                    urlParams: {
                        recordIds: ['1234', '5678'],
                    },
                },
                [
                    'ActionsController.getRecordEditActions',
                    { recordIds: ['1234', '5678'] },
                    undefined,
                ]
            );

            testRejectFetchResponse({
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/actions/record/1234,5678/record-edit`,
                urlParams: {
                    recordIds: ['1234', '5678'],
                },
            });

            testResolveResponse(
                {
                    method: 'get',
                    baseUri: UI_API_BASE_URI,
                    basePath: `/actions/record/1234,5678/record-edit`,
                    urlParams: {
                        recordIds: ['1234', '5678'],
                    },
                },
                {
                    actions: {
                        '1234': {
                            actions: [],
                        },
                        '5678': {
                            actions: [],
                        },
                    },
                }
            );
        });

        describe('/related-list-record/', () => {
            testControllerInput(
                {
                    method: 'get',
                    baseUri: UI_API_BASE_URI,
                    basePath: `/actions/record/1234,5678/related-list-record/1111,2222`,
                    urlParams: {
                        recordIds: ['1234', '5678'],
                        relatedListRecordIds: ['1111', '2222'],
                    },
                },
                [
                    'ActionsController.getRelatedListRecordActions',
                    { recordIds: ['1234', '5678'], relatedListRecordIds: ['1111', '2222'] },
                    undefined,
                ]
            );

            testRejectFetchResponse({
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/actions/record/1234,5678/related-list-record/1111,2222`,
                urlParams: {
                    recordIds: ['1234', '5678'],
                    relatedListRecordIds: ['1111', '2222'],
                },
            });

            testResolveResponse(
                {
                    method: 'get',
                    baseUri: UI_API_BASE_URI,
                    basePath: `/actions/record/1234,5678/related-list-record/1111,2222`,
                    urlParams: {
                        recordIds: ['1234', '5678'],
                        relatedListRecordIds: ['1111', '2222'],
                    },
                },
                {
                    actions: {
                        '1234': {
                            actions: [],
                        },
                        '5678': {
                            actions: [],
                        },
                    },
                }
            );
        });

        describe('/related-list/', () => {
            testControllerInput(
                {
                    method: 'get',
                    baseUri: UI_API_BASE_URI,
                    basePath: `/actions/record/1234/related-list/1111`,
                    urlParams: {
                        recordIds: ['1234'],
                        relatedListId: '1111',
                    },
                },
                [
                    'ActionsController.getRelatedListActions',
                    { recordIds: ['1234'], relatedListId: '1111' },
                    undefined,
                ]
            );

            testRejectFetchResponse({
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/actions/record/1234/related-list/1111`,
                urlParams: {
                    recordIds: ['1234'],
                    relatedListId: '1111',
                },
            });

            testResolveResponse(
                {
                    method: 'get',
                    baseUri: UI_API_BASE_URI,
                    basePath: `/actions/record/1234,5678/related-list/1111`,
                    urlParams: {
                        recordIds: ['1234'],
                        relatedListId: '1111',
                    },
                },
                {
                    actions: {
                        '1234': {
                            actions: [],
                        },
                    },
                }
            );
        });

        describe('/related-list/batch', () => {
            testControllerInput(
                {
                    method: 'get',
                    baseUri: UI_API_BASE_URI,
                    basePath: `/actions/record/1234/related-list/batch/1111`,
                    urlParams: {
                        recordIds: ['1234'],
                        relatedListIds: ['1111'],
                    },
                },
                [
                    'ActionsController.getRelatedListsActions',
                    { recordIds: ['1234'], relatedListIds: ['1111'] },
                    undefined,
                ]
            );

            testRejectFetchResponse({
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/actions/record/1234/related-list/batch/1111`,
                urlParams: {
                    recordIds: ['1234'],
                    relatedListIds: ['1111'],
                },
            });

            testResolveResponse(
                {
                    method: 'get',
                    baseUri: UI_API_BASE_URI,
                    basePath: `/actions/record/1234,5678/related-list/batch/1111`,
                    urlParams: {
                        recordIds: ['1234'],
                        relatedListIds: ['1111'],
                    },
                },
                {
                    actions: {
                        '1234': {
                            actions: [],
                        },
                    },
                }
            );
        });

        describe('/related-list-count', () => {
            testControllerInput(
                {
                    method: 'get',
                    baseUri: UI_API_BASE_URI,
                    basePath: `/related-list-count/1234/1111`,
                    urlParams: {
                        parentRecordId: '1234',
                        relatedListName: '1111',
                    },
                },
                [
                    'RelatedListUiController.getRelatedListRecordCount',
                    { parentRecordId: '1234', relatedListName: '1111' },
                    undefined,
                ]
            );
            testRejectFetchResponse({
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/related-list-count/1234/1111`,
                urlParams: {
                    parentRecordId: '1234',
                    relatedListName: '1111',
                },
            });

            testResolveResponse(
                {
                    method: 'get',
                    baseUri: UI_API_BASE_URI,
                    basePath: `/related-list-count/1234/1111`,
                    urlParams: {
                        parentRecordId: '1234',
                        relatedListName: '1111',
                    },
                },
                null
            );
        });

        describe('/related-list-count/batch', () => {
            testControllerInput(
                {
                    method: 'get',
                    baseUri: UI_API_BASE_URI,
                    basePath: `/related-list-count/batch/1234/1111,2222`,
                    urlParams: {
                        parentRecordId: '1234',
                        relatedListNames: ['1111', '2222'],
                    },
                },
                [
                    'RelatedListUiController.getRelatedListsRecordCount',
                    { parentRecordId: '1234', relatedListNames: ['1111', '2222'] },
                    undefined,
                ]
            );
            testRejectFetchResponse({
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/related-list-count/batch/1234/1111,2222`,
                urlParams: {
                    parentRecordId: '1234',
                    relatedListNames: ['1111', '2222'],
                },
            });

            testResolveResponse(
                {
                    method: 'get',
                    baseUri: UI_API_BASE_URI,
                    basePath: `/related-list-count/batch/1234/1111,2222`,
                    urlParams: {
                        parentRecordId: '1234',
                        relatedListNames: ['1111', '2222'],
                    },
                },
                {
                    results: [
                        {
                            result: {
                                count: 7,
                                eTag: '26a72a4546a02b7e0507e386f9fae374',
                                hasMore: false,
                                listReference: {
                                    id: null,
                                    inContextOfRecordId: 'a00RM0000004aVwYAI',
                                    listViewApiName: null,
                                    objectApiName: null,
                                    parentObjectApiName: 'CwcCustom00__c',
                                    recordTypeId: null,
                                    relatedListId: 'CwcCustom01s__r',
                                    type: 'relatedList',
                                },
                            },
                            statusCode: 200,
                        },
                    ],
                }
            );
        });

        testControllerInput(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/actions/record/1234,5678`,
                urlParams: {
                    recordIds: ['1234', '5678'],
                },
            },
            ['ActionsController.getRecordActions', { recordIds: ['1234', '5678'] }, undefined]
        );

        testRejectFetchResponse({
            method: 'get',
            baseUri: UI_API_BASE_URI,
            basePath: `/actions/record/1234,5678`,
            urlParams: {
                recordIds: ['1234', '5678'],
            },
        });

        testResolveResponse(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/actions/record/1234,5678`,
                urlParams: {
                    recordIds: ['1234', '5678'],
                },
            },
            {
                actions: {
                    '1234': {
                        actions: [],
                    },
                    '5678': {
                        actions: [],
                    },
                },
            }
        );
    });

    describe('get /actions/object/${objectApiName}', () => {
        describe('/record-create', () => {
            testControllerInput(
                {
                    method: 'get',
                    baseUri: UI_API_BASE_URI,
                    basePath: `/actions/object/Account/record-create`,
                    urlParams: {
                        objectApiName: 'Account',
                    },
                },
                [
                    'ActionsController.getObjectCreateActions',
                    { objectApiName: 'Account' },
                    undefined,
                ]
            );

            testRejectFetchResponse({
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/actions/object/Account/record-create`,
                urlParams: {
                    objectApiName: 'Account',
                },
            });

            testResolveResponse(
                {
                    method: 'get',
                    baseUri: UI_API_BASE_URI,
                    basePath: `/actions/object/Account/record-create`,
                    urlParams: {
                        objectApiName: 'Account',
                    },
                },
                {
                    actions: {
                        Account: {
                            actions: [],
                        },
                    },
                }
            );
        });
    });

    describe('get /related-list-info', () => {
        describe('/{parentObjectApiName}/{relatedListId}', () => {
            testControllerInput(
                {
                    method: 'get',
                    baseUri: UI_API_BASE_URI,
                    basePath: `/related-list-info/Opportunity/Contact__r`,
                    urlParams: {
                        parentObjectApiName: 'Opportunity',
                        relatedListId: 'Contact__r',
                    },
                    queryParams: {
                        recordTypeId: '012T00000004MUHIA2',
                    },
                },
                [
                    'RelatedListUiController.getRelatedListInfoByApiName',
                    {
                        parentObjectApiName: 'Opportunity',
                        recordTypeId: '012T00000004MUHIA2',
                        relatedListId: 'Contact__r',
                    },
                    undefined,
                ]
            );

            testRejectFetchResponse({
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/related-list-info/Opportunity/Contact__r`,
                urlParams: {
                    parentObjectApiName: 'Opportunity',
                    relatedListId: 'Contact__r',
                },
                queryParams: {
                    recordTypeId: '012T00000004MUHIA2',
                },
            });
        });

        describe('{parentObjectApiName}', () => {
            testControllerInput(
                {
                    method: 'get',
                    baseUri: UI_API_BASE_URI,
                    basePath: `/related-list-info/Opportunity`,
                    urlParams: {
                        parentObjectApiName: 'Opportunity',
                    },
                    queryParams: {
                        recordTypeId: '012T00000004MUHIA2',
                    },
                },
                [
                    'RelatedListUiController.getRelatedListInfoCollection',
                    {
                        parentObjectApiName: 'Opportunity',
                        recordTypeId: '012T00000004MUHIA2',
                    },
                    undefined,
                ]
            );

            testRejectFetchResponse({
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/related-list-info/Opportunity`,
                urlParams: {
                    parentObjectApiName: 'Opportunity',
                },
                queryParams: {
                    recordTypeId: '012T00000004MUHIA2',
                },
            });
        });
    });

    describe('get /related-list-info/{parentObjectApiName}/{relatedListId}', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/related-list-info/Opportunity/Contact__r`,
                urlParams: {
                    parentObjectApiName: 'Opportunity',
                    relatedListId: 'Contact__r',
                },
                queryParams: {
                    recordTypeId: '012T00000004MUHIA2',
                },
            },
            [
                'RelatedListUiController.getRelatedListInfoByApiName',
                {
                    parentObjectApiName: 'Opportunity',
                    recordTypeId: '012T00000004MUHIA2',
                    relatedListId: 'Contact__r',
                },
                undefined,
            ]
        );

        testRejectFetchResponse({
            method: 'get',
            baseUri: UI_API_BASE_URI,
            basePath: `/related-list-info/Opportunity/Contact__r`,
            urlParams: {
                parentObjectApiName: 'Opportunity',
                relatedListId: 'Contact__r',
            },
            queryParams: {
                recordTypeId: '012T00000004MUHIA2',
            },
        });

        testResolveResponse(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/related-list-info/Opportunity/Contact__r`,
                urlParams: {
                    parentObjectApiName: 'Opportunity',
                    relatedListId: 'Contact__r',
                },
            },
            null
        );
    });

    describe('patch /related-list-info/{parentObjectApiName}/{relatedListId}', () => {
        testControllerInput(
            {
                method: 'patch',
                baseUri: UI_API_BASE_URI,
                basePath: `/related-list-info/Opportunity/Contact__r`,
                urlParams: {
                    parentObjectApiName: 'Opportunity',
                    relatedListId: 'Contact__r',
                },
                queryParams: {
                    recordTypeId: '012T00000004MUHIA2',
                },
                body: {
                    orderedByInfo: [],
                    userPreferences: {
                        columnWidths: {
                            Name: -1,
                        },
                        columnWrap: {
                            Name: true,
                        },
                    },
                },
            },
            [
                'RelatedListUiController.updateRelatedListInfoByApiName',
                {
                    parentObjectApiName: 'Opportunity',
                    recordTypeId: '012T00000004MUHIA2',
                    relatedListId: 'Contact__r',
                    relatedListInfoInput: {
                        orderedByInfo: [],
                        userPreferences: {
                            columnWidths: {
                                Name: -1,
                            },
                            columnWrap: {
                                Name: true,
                            },
                        },
                    },
                },
                undefined,
            ]
        );

        testRejectFetchResponse({
            method: 'patch',
            baseUri: UI_API_BASE_URI,
            basePath: `/related-list-info/Opportunity/Contact__r`,
        });

        testResolveResponse(
            {
                method: 'patch',
                baseUri: UI_API_BASE_URI,
                basePath: `/related-list-info/Opportunity/Contact__r`,
                urlParams: {
                    parentObjectApiName: 'Opportunity',
                    relatedListId: 'Contact__r',
                },
                body: {
                    orderedByInfo: [],
                    userPreferences: {
                        columnWidths: {
                            Name: -1,
                        },
                        columnWrap: {
                            Name: true,
                        },
                    },
                },
            },
            null
        );
    });

    describe('get /related-list-records/{parentRecordId}/{relatedListId}', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/related-list-records/{parentRecordId}/{relatedListId}`,
                urlParams: {
                    parentRecordId: '012T00000004MUHIA2',
                    relatedListId: 'Contact__r',
                },
                queryParams: {
                    fields: ['Id'],
                    optionalFields: ['Name'],
                    pageSize: 50,
                    pageToken: 0,
                    sortBy: ['Id'],
                },
            },
            [
                'RelatedListUiController.getRelatedListRecords',
                {
                    parentRecordId: '012T00000004MUHIA2',
                    relatedListId: 'Contact__r',
                    fields: ['Id'],
                    optionalFields: ['Name'],
                    pageSize: 50,
                    pageToken: 0,
                    sortBy: ['Id'],
                },
                undefined,
            ]
        );

        testRejectFetchResponse({
            method: 'get',
            baseUri: UI_API_BASE_URI,
            basePath: `/related-list-records/{parentRecordId}/{relatedListId}`,
            urlParams: {
                parentObjectId: '012T00000004MUHIA2',
                relatedListId: 'Contact__r',
            },
        });
    });

    describe('get /related-list-records/batch/{parentRecordId}/{relatedListIds}', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/related-list-records/batch/{parentRecordId}/{relatedListIds}`,
                urlParams: {
                    parentRecordId: '012T00000004MUHIA2',
                    relatedListIds: ['Contact__r', 'Opportunity__r'],
                },
                queryParams: {
                    fields: 'Contact__r:Name,Id;Opportunity__r:Name',
                    optionalFields: 'Contact__r:Account.Name;Opportunity__r:Account.Name',
                    pageSize: 'Contact__r:5;Opportunity__r:7',
                    sortBy: 'Contact__r:Name,Id;Opportunity__r:Name',
                },
            },
            [
                'RelatedListUiController.getRelatedListRecordsBatch',
                {
                    parentRecordId: '012T00000004MUHIA2',
                    relatedListIds: ['Contact__r', 'Opportunity__r'],
                    fields: 'Contact__r:Name,Id;Opportunity__r:Name',
                    optionalFields: 'Contact__r:Account.Name;Opportunity__r:Account.Name',
                    pageSize: 'Contact__r:5;Opportunity__r:7',
                    sortBy: 'Contact__r:Name,Id;Opportunity__r:Name',
                },
                undefined,
            ]
        );

        testRejectFetchResponse({
            method: 'get',
            baseUri: UI_API_BASE_URI,
            basePath: `/related-list-records/batch/{parentRecordId}/{relatedListIds}`,
            urlParams: {
                parentObjectId: '012T00000004MUHIA2',
                relatedListIds: 'Contact__r',
            },
        });
    });

    describe('get /related-list-info/batch/{parentObjectApiName}/{relatedListNames}', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/related-list-info/batch/Opportunity/Contact__r`,
                urlParams: {
                    parentObjectApiName: 'Opportunity',
                    relatedListNames: 'Contact__r',
                },
                queryParams: {
                    recordTypeId: '012T00000004MUHIA2',
                },
            },
            [
                'RelatedListUiController.getRelatedListInfoBatch',
                {
                    parentObjectApiName: 'Opportunity',
                    recordTypeId: '012T00000004MUHIA2',
                    relatedListNames: 'Contact__r',
                },
                undefined,
            ]
        );

        testRejectFetchResponse({
            method: 'get',
            baseUri: UI_API_BASE_URI,
            basePath: `/related-list-info/batch/Opportunity/Contact__r`,
            urlParams: {
                parentObjectApiName: 'Opportunity',
                relatedListNames: 'Contact__r',
            },
            queryParams: {
                recordTypeId: '012T00000004MUHIA2',
            },
        });

        testResolveResponse(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/related-list-info/batch/Opportunity/Contact__r`,
                urlParams: {
                    parentObjectApiName: 'Opportunity',
                    relatedListNames: 'Contact__r',
                },
            },
            {
                results: [
                    {
                        result: {
                            cloneable: false,
                            createable: false,
                            deletable: false,
                            displayColumns: [
                                {
                                    fieldApiName: 'Name',
                                    label: 'CwcCustom01 Name',
                                    lookupId: 'Id',
                                    sortable: true,
                                },
                                {
                                    fieldApiName: 'Decimal__c',
                                    label: 'Decimal',
                                    lookupId: null,
                                    sortable: true,
                                },
                            ],
                            eTag: '655f02a4197521fb9e9fe83d8403b6e3',
                            filterLogicString: '',
                            filteredByInfo: [],
                            label: 'CwcCustom01s',
                            listReference: {
                                id: null,
                                inContextOfRecordId: null,
                                listViewApiName: null,
                                objectApiName: null,
                                parentObjectApiName: 'CwcCustom00__c',
                                recordTypeId: null,
                                relatedListId: 'CwcCustom01s__r',
                                type: 'relatedList',
                            },
                            orderedByInfo: [],
                            updateable: false,
                            userPreferences: {
                                columnWidths: {
                                    Decimal__c: -1,
                                    Name: -1,
                                },
                                columnWrap: {
                                    Decimal__c: false,
                                    Name: false,
                                },
                            },
                            visibility: 'Public',
                            visibilityEditable: false,
                        },
                        statusCode: 200,
                    },
                    {
                        result: {
                            cloneable: false,
                            createable: false,
                            deletable: false,
                            displayColumns: [
                                {
                                    fieldApiName: 'Name',
                                    label: 'CwcCustom02 Name',
                                    lookupId: 'Id',
                                    sortable: true,
                                },
                            ],
                            eTag: 'e98a9ced6a3606357d108312b154ae67',
                            filterLogicString: '',
                            filteredByInfo: [],
                            label: 'CwcCustom02s',
                            listReference: {
                                id: null,
                                inContextOfRecordId: null,
                                listViewApiName: null,
                                objectApiName: null,
                                parentObjectApiName: 'CwcCustom00__c',
                                recordTypeId: null,
                                relatedListId: 'CwcCustom02s__r',
                                type: 'relatedList',
                            },
                            orderedByInfo: [],
                            updateable: false,
                            userPreferences: {
                                columnWidths: {
                                    Name: -1,
                                },
                                columnWrap: {
                                    Name: false,
                                },
                            },
                            visibility: 'Public',
                            visibilityEditable: false,
                        },
                        statusCode: 200,
                    },
                ],
            }
        );
    });
    describe('get /list-records/{objectApiName}/{listViewApiName}', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/list-records/Account/AllAccounts`,
                urlParams: {
                    objectApiName: 'Account',
                    listViewApiName: 'AllAccounts',
                },
                queryParams: {
                    fields: ['field1'],
                    optionalFields: ['field2'],
                    pageSize: 3,
                    pageToken: 'abc',
                    sortBy: '-field3',
                },
            },
            [
                'ListUiController.getListRecordsByName',
                {
                    objectApiName: 'Account',
                    listViewApiName: 'AllAccounts',
                    fields: ['field1'],
                    optionalFields: ['field2'],
                    pageSize: 3,
                    pageToken: 'abc',
                    sortBy: '-field3',
                },
                undefined,
            ]
        );

        testRejectFetchResponse({
            method: 'get',
            baseUri: UI_API_BASE_URI,
            basePath: `/list-records/Account/AllAccounts`,
            urlParams: {
                objectApiName: 'Account',
                listViewApiName: 'AllAccounts',
            },
            queryParams: {
                pageSize: 3,
                pageToken: 'abc',
            },
        });

        testResolveResponse(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/list-records/Account/AllAccounts`,
                urlParams: {
                    objectApiName: 'Account',
                    listViewApiName: 'AllAccounts',
                },
                queryParams: {
                    pageSize: 3,
                    pageToken: 'abc',
                },
            },
            {
                count: 1,
                currentPageToken: 'abc',
                currentPageUrl:
                    '/services/data/v47.0/ui-api/list-records/Acconut/AllAccounts?pageSize=3&pageToken=abc',
                listInfoETag: 'hashvalue',
                records: [
                    {
                        apiName: 'Account',
                        fields: {
                            Name: {
                                displayValue: null,
                                value: 'An Account',
                            },
                        },
                    },
                ],
            }
        );
    });

    describe('get /list-records/{listViewId}', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/list-records/00B123456789012AAA`,
                urlParams: {
                    listViewId: '00B123456789012AAA',
                },
                queryParams: {
                    fields: ['field1'],
                    optionalFields: ['field2'],
                    pageSize: 10,
                    pageToken: 'abc',
                    sortBy: '-field3',
                },
            },
            [
                'ListUiController.getListRecordsById',
                {
                    listViewId: '00B123456789012AAA',
                    fields: ['field1'],
                    optionalFields: ['field2'],
                    pageSize: 10,
                    pageToken: 'abc',
                    sortBy: '-field3',
                },
                undefined,
            ]
        );

        testRejectFetchResponse({
            method: 'get',
            baseUri: UI_API_BASE_URI,
            basePath: `/list-records/00B123456789012AAA`,
            urlParams: {
                listViewId: '00B123456789012AAA',
            },
        });

        testResolveResponse(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/list-records/00B123456789012AAA`,
                urlParams: {
                    listViewId: '00B123456789012AAA',
                },
            },
            {
                count: 1,
                currentPageToken: 'abc',
                currentPageUrl:
                    '/services/data/v47.0/ui-api/list-records/00B123456789012AAA?pageSize=3&pageToken=3',
                listInfoETag: 'hashvalue',
                records: [
                    {
                        apiName: 'Account',
                        fields: {
                            Name: {
                                displayValue: null,
                                value: 'An Account',
                            },
                        },
                    },
                ],
            }
        );
    });

    describe('get /list-ui/{objectApiName}', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/list-ui/Account`,
                urlParams: {
                    objectApiName: 'Account',
                },
                queryParams: {
                    pageSize: 10,
                    pageToken: 'abc',
                    q: 'query',
                    recentListsOnly: true,
                },
            },
            [
                'ListUiController.getListsByObjectName',
                {
                    objectApiName: 'Account',
                    pageSize: 10,
                    pageToken: 'abc',
                    q: 'query',
                    recentListsOnly: true,
                },
                undefined,
            ]
        );

        testRejectFetchResponse({
            method: 'get',
            baseUri: UI_API_BASE_URI,
            basePath: `/list-ui/Account`,
            urlParams: {
                objectApiName: 'Account',
            },
        });

        testResolveResponse(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/list-ui/Account`,
                urlParams: {
                    objectApiName: 'Account',
                },
            },
            {
                count: 10,
                currentPageToken: '0',
                currentPageUrl: '/services/data/v47.0/ui-api/list-ui/Account',
                lists: [
                    {
                        apiName: 'Some_list',
                        id: '00B000000000000001',
                        label: 'Some list',
                        listUiUrl: 'foobar',
                    },
                ],
                nextPageToken: null,
                nextPageUrl: null,
                previousPageToken: null,
                previousPageUrl: null,
            }
        );
    });

    describe('get /list-ui/{objectApiName}/{listViewApiName}', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/list-ui/Account/AllAccounts`,
                urlParams: {
                    objectApiName: 'Account',
                    listViewApiName: 'AllAccounts',
                },
                queryParams: {
                    fields: ['field1'],
                    optionalFields: ['field2'],
                    pageSize: 3,
                    pageToken: 'abc',
                    sortBy: '-field3',
                },
            },
            [
                'ListUiController.getListUiByName',
                {
                    objectApiName: 'Account',
                    listViewApiName: 'AllAccounts',
                    fields: ['field1'],
                    optionalFields: ['field2'],
                    pageSize: 3,
                    pageToken: 'abc',
                    sortBy: '-field3',
                },
                undefined,
            ]
        );

        testRejectFetchResponse({
            method: 'get',
            baseUri: UI_API_BASE_URI,
            basePath: `/list-ui/Account/AllAccounts`,
            urlParams: {
                objectApiName: 'Account',
                listViewApiName: 'AllAccounts',
            },
            queryParams: {
                pageSize: 3,
                pageToken: 'abc',
            },
        });

        testResolveResponse(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/list-ui/Account/AllAccounts`,
                urlParams: {
                    objectApiName: 'Account',
                    listViewApiName: 'AllAccounts',
                },
                queryParams: {
                    fields: ['field1'],
                    optionalFields: ['field2'],
                    pageSize: 3,
                    pageToken: 'abc',
                    sortBy: '-field3',
                },
            },
            {
                eTag: 'hashvalue',
                info: {
                    cloneable: true,
                    createable: true,
                    displayColumns: [
                        {
                            fieldApiName: 'Name',
                            label: 'Account Name',
                            sortable: true,
                        },
                    ],
                    eTag: 'hashvalue',
                    listReference: {
                        id: '00B000000000000001',
                        listViewApiName: 'AllAccounts',
                        objectApiName: 'Account',
                        type: 'listView',
                    },
                    orderedByInfo: [],
                },
                records: {
                    count: 1,
                    currentPageToken: 'abc',
                    currentPageUrl:
                        '/services/data/v47.0/ui-api/list-records/Acconut/AllAccounts?pageSize=3&pageToken=abc',
                    listInfoETag: 'hashvalue',
                    records: [
                        {
                            apiName: 'Account',
                            fields: {
                                Name: {
                                    displayValue: null,
                                    value: 'An Account',
                                },
                            },
                        },
                    ],
                },
            }
        );
    });

    describe('get /list-ui/{listViewId}', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/list-ui/00B123456789012AAA`,
                urlParams: {
                    listViewId: '00B123456789012AAA',
                },
                queryParams: {
                    fields: ['field1'],
                    optionalFields: ['field2'],
                    pageSize: 10,
                    pageToken: 'abc',
                    sortBy: '-field3',
                },
            },
            [
                'ListUiController.getListUiById',
                {
                    listViewId: '00B123456789012AAA',
                    fields: ['field1'],
                    optionalFields: ['field2'],
                    pageSize: 10,
                    pageToken: 'abc',
                    sortBy: '-field3',
                },
                undefined,
            ]
        );

        testRejectFetchResponse({
            method: 'get',
            baseUri: UI_API_BASE_URI,
            basePath: `/list-ui/00B123456789012AAA`,
            urlParams: {
                listViewId: '00B123456789012AAA',
            },
        });

        testResolveResponse(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/list-ui/00B123456789012AAA`,
                urlParams: {
                    listViewId: '00B123456789012AAA',
                },
                queryParams: {
                    fields: ['field1'],
                    optionalFields: ['field2'],
                    pageSize: 3,
                    pageToken: 'abc',
                    sortBy: '-field3',
                },
            },
            {
                eTag: 'hashvalue',
                info: {
                    cloneable: true,
                    createable: true,
                    displayColumns: [
                        {
                            fieldApiName: 'Name',
                            label: 'Account Name',
                            sortable: true,
                        },
                    ],
                    eTag: 'hashvalue',
                    listReference: {
                        id: '00B000000000000001',
                        listViewApiName: 'AllAccounts',
                        objectApiName: 'Account',
                        type: 'listView',
                    },
                    orderedByInfo: [],
                },
                records: {
                    count: 1,
                    currentPageToken: 'abc',
                    currentPageUrl:
                        '/services/data/v47.0/ui-api/list-ui/00B123456789012AAA?pageSize=3&pageToken=3',
                    records: [
                        {
                            apiName: 'Account',
                            fields: {
                                Name: {
                                    displayValue: null,
                                    value: 'An Account',
                                },
                            },
                        },
                    ],
                },
            }
        );
    });

    describe('get /mru-list-records/{objectApiName}', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/mru-list-records/Account`,
                urlParams: {
                    objectApiName: 'Account',
                },
                queryParams: {
                    fields: ['field1'],
                    optionalFields: ['field2'],
                    pageSize: 10,
                    pageToken: 'abc',
                    sortBy: '-field3',
                },
            },
            [
                'MruListUiController.getMruListRecords',
                {
                    objectApiName: 'Account',
                    fields: ['field1'],
                    optionalFields: ['field2'],
                    pageSize: 10,
                    pageToken: 'abc',
                    sortBy: '-field3',
                },
                undefined,
            ]
        );

        testRejectFetchResponse({
            method: 'get',
            baseUri: UI_API_BASE_URI,
            basePath: `/mru-list-records/Account`,
            urlParams: {
                listViewId: 'Account',
            },
        });

        testResolveResponse(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/mru-list-records/Account`,
                urlParams: {
                    objectApiName: 'Account',
                },
            },
            {
                count: 1,
                currentPageToken: 'abc',
                currentPageUrl:
                    '/services/data/v47.0/ui-api/mru-list-records/Account?pageSize=3&pageToken=3',
                listInfoETag: 'hashvalue',
                records: [
                    {
                        apiName: 'Account',
                        fields: {
                            Name: {
                                displayValue: null,
                                value: 'An Account',
                            },
                        },
                    },
                ],
            }
        );
    });

    describe('get /mru-list-ui/{objectApiName}', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/mru-list-ui/Account`,
                urlParams: {
                    objectApiName: 'Account',
                },
                queryParams: {
                    fields: ['field1'],
                    optionalFields: ['field2'],
                    pageSize: 10,
                    pageToken: 'abc',
                    sortBy: '-field3',
                },
            },
            [
                'MruListUiController.getMruListUi',
                {
                    objectApiName: 'Account',
                    fields: ['field1'],
                    optionalFields: ['field2'],
                    pageSize: 10,
                    pageToken: 'abc',
                    sortBy: '-field3',
                },
                undefined,
            ]
        );

        testRejectFetchResponse({
            method: 'get',
            baseUri: UI_API_BASE_URI,
            basePath: `/mru-list-ui/Account`,
            urlParams: {
                objectApiName: 'Account',
            },
        });

        testResolveResponse(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/mru-list-ui/Account`,
                urlParams: {
                    objectApiName: 'Account',
                },
                queryParams: {
                    fields: ['field1'],
                    optionalFields: ['field2'],
                    pageSize: 3,
                    pageToken: 'abc',
                    sortBy: '-field3',
                },
            },
            {
                eTag: 'hashvalue',
                info: {
                    cloneable: true,
                    createable: true,
                    displayColumns: [
                        {
                            fieldApiName: 'Name',
                            label: 'Account Name',
                            sortable: true,
                        },
                    ],
                    eTag: 'hashvalue',
                    listReference: {
                        id: null,
                        listViewApiName: null,
                        objectApiName: 'Account',
                        type: 'mru',
                    },
                    orderedByInfo: [],
                },
                records: {
                    count: 1,
                    currentPageToken: 'abc',
                    currentPageUrl:
                        '/services/data/v47.0/ui-api/mru-list-ui/Account?pageSize=3&pageToken=abc',
                    records: [
                        {
                            apiName: 'Account',
                            fields: {
                                Name: {
                                    displayValue: null,
                                    value: 'An Account',
                                },
                            },
                        },
                    ],
                },
            }
        );
    });

    describe('get /record-defaults/template/clone/{recordId}', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/record-defaults/template/clone/001RM000004PkciYAC`,
                urlParams: {
                    recordId: '001RM000004PkciYAC',
                },
                queryParams: {
                    optionalFields: ['Account.Name'],
                    recordTypeId: '012RM00000025SOYAY',
                },
            },
            [
                'RecordUiController.getRecordDefaultsTemplateClone',
                {
                    recordId: '001RM000004PkciYAC',
                    recordTypeId: '012RM00000025SOYAY',
                    optionalFields: ['Account.Name'],
                },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testRejectFetchResponse({
            method: 'get',
            baseUri: UI_API_BASE_URI,
            basePath: `/record-defaults/template/clone/001RM000004PkciYAC`,
            urlParams: {
                recordId: '001RM000004PkciYAC',
            },
            queryParams: {
                optionalFields: ['Account.Name'],
                recordTypeId: '012RM00000025SOYAY',
            },
        });

        testResolveResponse(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/record-defaults/template/clone/001RM000004PkciYAC`,
                urlParams: {
                    recordId: '001RM000004PkciYAC',
                },
                queryParams: {
                    optionalFields: ['Account.Name'],
                    recordTypeId: '012RM00000025SOYAY',
                },
            },
            {
                objectInfos: {},
                record: {},
            }
        );
    });

    describe('get /record-defaults/template/create/{objectApiName}', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/record-defaults/template/create/Account`,
                urlParams: {
                    objectApiName: 'Account',
                },
                queryParams: {
                    optionalFields: ['Account.Name'],
                    recordTypeId: '012RM00000025SOYAY',
                },
            },
            [
                'RecordUiController.getRecordDefaultsTemplateForCreate',
                {
                    objectApiName: 'Account',
                    recordTypeId: '012RM00000025SOYAY',
                    optionalFields: ['Account.Name'],
                },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testRejectFetchResponse({
            method: 'get',
            baseUri: UI_API_BASE_URI,
            basePath: `/record-defaults/template/create/Account`,
            urlParams: {
                objectApiName: 'Account',
            },
            queryParams: {
                optionalFields: ['Account.Name'],
                recordTypeId: '012RM00000025SOYAY',
            },
        });

        testResolveResponse(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/record-defaults/template/create/Account`,
                urlParams: {
                    objectApiName: 'Account',
                },
                queryParams: {
                    optionalFields: ['Account.Name'],
                    recordTypeId: '012RM00000025SOYAY',
                },
            },
            {
                objectInfos: {},
                record: {},
            }
        );
    });

    describe('get /record-defaults/create/{objectApiName}', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/record-defaults/create/Account`,
                urlParams: {
                    objectApiName: 'Account',
                },
                queryParams: {
                    formFactor: 'Large',
                    optionalFields: ['field'],
                    recordTypeId: '123',
                },
            },
            [
                'RecordUiController.getRecordCreateDefaults',
                {
                    objectApiName: 'Account',
                    formFactor: 'Large',
                    recordTypeId: '123',
                    optionalFields: ['field'],
                },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testRejectFetchResponse({
            method: 'get',
            baseUri: UI_API_BASE_URI,
            basePath: `/record-defaults/create/Account`,
            urlParams: {
                objectApiName: 'Account',
            },
            queryParams: {
                formFactor: 'Large',
                optionalFields: ['field'],
                recordTypeId: '123',
            },
        });

        testResolveResponse(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/record-defaults/create/Account`,
                urlParams: {
                    objectApiName: 'Account',
                },
                queryParams: {
                    formFactor: 'Large',
                    optionalFields: ['field'],
                    recordTypeId: '123',
                },
            },
            {
                layout: {},
                objectInfos: {},
                record: {},
            }
        );
    });

    describe('get /connect/communities/{communityId}/navigation-menu/navigation-menu-items', () => {
        testControllerInput(
            {
                baseUri: CONNECT_BASE_URI,
                basePath: `/communities/1234567890ABCDE/navigation-menu/navigation-menu-items`,
            },
            [
                'NavigationMenuController.getCommunityNavigationMenu',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testRejectFetchResponse({
            baseUri: CONNECT_BASE_URI,
            basePath: `/communities/1234567890ABCDE/navigation-menu/navigation-menu-items`,
        });

        testResolveResponse(
            {
                baseUri: CONNECT_BASE_URI,
                basePath: `/communities/1234567890ABCDE/navigation-menu/navigation-menu-items`,
            },
            {}
        );
    });

    describe('get /commerce/webstores/{webstoreId}/products/{productId}', () => {
        testControllerInput(
            {
                baseUri: COMMERCE_BASE_URI,
                basePath: `/webstores/1234567890ABCDE/products/1234567890ABCDE`,
            },
            [
                'CommerceCatalogController.getProduct',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testRejectFetchResponse({
            baseUri: COMMERCE_BASE_URI,
            basePath: `/webstores/1234567890ABCDE/products/1234567890ABCDE`,
        });

        testResolveResponse(
            {
                baseUri: COMMERCE_BASE_URI,
                basePath: `/webstores/1234567890ABCDE/products/1234567890ABCDE`,
            },
            {}
        );
    });

    describe('get /commerce/webstores/{webstoreId}/product-category-path/product-categories/{productCategoryId}', () => {
        testControllerInput(
            {
                baseUri: COMMERCE_BASE_URI,
                basePath: `/webstores/1234567890ABCDE/product-category-path/product-categories/1234567890ABCDE`,
            },
            [
                'CommerceCatalogController.getProductCategoryPath',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testRejectFetchResponse({
            baseUri: COMMERCE_BASE_URI,
            basePath: `/webstores/1234567890ABCDE/product-category-path/product-categories/1234567890ABCDE`,
        });

        testResolveResponse(
            {
                baseUri: COMMERCE_BASE_URI,
                basePath: `/webstores/1234567890ABCDE/product-category-path/product-categories/1234567890ABCDE`,
            },
            {}
        );
    });

    describe('post /commerce/webstores/{webstoreId}/search/product-search', () => {
        testControllerInput(
            {
                method: 'post',
                baseUri: COMMERCE_BASE_URI,
                basePath: `/webstores/1234567890ABCDE/search/product-search`,
            },
            [
                'CommerceProductSearchController.productSearch',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testRejectFetchResponse({
            method: 'post',
            baseUri: COMMERCE_BASE_URI,
            basePath: `/webstores/1234567890ABCDE/search/product-search`,
        });

        testResolveResponse(
            {
                method: 'post',
                baseUri: COMMERCE_BASE_URI,
                basePath: `/webstores/1234567890ABCDE/search/product-search`,
            },
            {}
        );
    });

    describe('get /commerce/webstores/{webstoreId}/pricing/products/{productId}', () => {
        testControllerInput(
            {
                baseUri: COMMERCE_BASE_URI,
                basePath: `/webstores/1234567890ABCDE/pricing/products/1234567890ABCDE`,
            },
            [
                'CommerceStorePricingController.getProductPrice',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testRejectFetchResponse({
            baseUri: COMMERCE_BASE_URI,
            basePath: `/webstores/1234567890ABCDE/pricing/products/1234567890ABCDE`,
        });

        testResolveResponse(
            {
                baseUri: COMMERCE_BASE_URI,
                basePath: `/webstores/1234567890ABCDE/pricing/products/1234567890ABCDE`,
            },
            {}
        );
    });

    describe('get /nav-items', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/nav-items`,
                queryParams: {
                    formFactor: 'Small',
                    page: 0,
                    pageSize: 20,
                    navItemNames: ['t1', 't2'],
                },
            },
            [
                'AppsController.getNavItems',
                {
                    formFactor: 'Small',
                    page: 0,
                    pageSize: 20,
                    navItemNames: ['t1', 't2'],
                },
                undefined,
            ]
        );
    });

    describe('get /assistant/{id}', () => {
        testControllerInput(
            {
                baseUri: GUIDANCE_BASE_URI,
                basePath: `/assistant/1234567890ABCDE`,
            },
            [
                'LightningExperienceAssistantPlatformController.getAssistant',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                baseUri: GUIDANCE_BASE_URI,
                basePath: `/assistant/1234567890ABCDE`,
            },
            {}
        );
    });

    describe('patch /assistant/{id}', () => {
        testControllerInput(
            {
                method: 'patch',
                baseUri: GUIDANCE_BASE_URI,
                basePath: `/assistant/1234567890ABCDE`,
                body: { assistantData: { data: 'data' } },
            },
            [
                'LightningExperienceAssistantPlatformController.saveAssistant',
                {
                    assistantData: { data: 'data' },
                },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'patch',
                baseUri: GUIDANCE_BASE_URI,
                basePath: `/assistant/1234567890ABCDE`,
            },
            {}
        );
    });

    describe('get /assistant/{id}/questionnaires', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: GUIDANCE_BASE_URI,
                basePath: `/assistant/1234567890ABCDE/questionnaires`,
            },
            [
                'LightningExperienceAssistantPlatformController.getActiveQuestionnaires',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'get',
                baseUri: GUIDANCE_BASE_URI,
                basePath: `/assistant/1234567890ABCDE/questionnaires`,
            },
            {}
        );
    });

    describe('get /assistant/{id}/questionnaire/{id}', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: GUIDANCE_BASE_URI,
                basePath: `/assistant/1234567890ABCDE/questionnaire/1234567890ABCDE`,
            },
            [
                'LightningExperienceAssistantPlatformController.getQuestionnaire',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'get',
                baseUri: GUIDANCE_BASE_URI,
                basePath: `/assistant/1234567890ABCDE/questionnaire/1234567890ABCDE`,
            },
            {}
        );
    });

    describe('patch /assistant/{id}/questionnaire/{id}', () => {
        testControllerInput(
            {
                method: 'patch',
                baseUri: GUIDANCE_BASE_URI,
                basePath: `/assistant/1234567890ABCDE/questionnaire/1234567890ABCDE`,
                body: {
                    questionnaireData: {
                        data: 'data',
                    },
                },
            },
            [
                'LightningExperienceAssistantPlatformController.saveQuestionnaire',
                {
                    questionnaireData: {
                        data: 'data',
                    },
                },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'patch',
                baseUri: GUIDANCE_BASE_URI,
                basePath: `/assistant/1234567890ABCDE/questionnaire/1234567890ABCDE`,
                body: {
                    questionnaireData: {
                        data: 'data',
                    },
                },
            },
            {
                questionnaireData: {
                    data: 'data',
                },
            }
        );
    });

    describe('get /wave/dataflowjobs', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: WAVE_BASE_URI,
                basePath: `/dataflowjobs`,
            },
            [
                'WaveController.getDataflowJobs',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'get',
                baseUri: WAVE_BASE_URI,
                basePath: `/dataflowjobs`,
            },
            {}
        );
    });

    describe('get /wave/dataflowjobs/{dataflowjobId}', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: WAVE_BASE_URI,
                basePath: `/dataflowjobs/03CRM0000006tEf2AI`,
            },
            [
                'WaveController.getDataflowJob',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'get',
                baseUri: WAVE_BASE_URI,
                basePath: `/dataflowjobs/03CRM0000006tEf2AI`,
            },
            {}
        );
    });

    describe('patch /wave/dataflowjobs/{dataflowjobId}', () => {
        testControllerInput(
            {
                method: 'patch',
                baseUri: WAVE_BASE_URI,
                basePath: `/dataflowjobs/03CRM0000006tEf2AI`,
                body: { dataflowJob: { command: 'stop' } },
            },
            [
                'WaveController.updateDataflowJob',
                { dataflowJob: { command: 'stop' } },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'patch',
                baseUri: WAVE_BASE_URI,
                basePath: `/dataflowjobs/03CRM0000006tEf2AI`,
                body: { dataflowJob: { command: 'stop' } },
            },
            {}
        );
    });

    describe('get /wave/dataflowjobs/{dataflowjobId}/nodes', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: WAVE_BASE_URI,
                basePath: `/dataflowjobs/03CRM0000006tEf2AI/nodes`,
            },
            [
                'WaveController.getDataflowJobNodes',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'get',
                baseUri: WAVE_BASE_URI,
                basePath: `/dataflowjobs/03CRM0000006tEf2AI/nodes`,
            },
            {}
        );
    });

    describe('get /wave/dataflowjobs/{dataflowjobId}/nodes/{nodeId}', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: WAVE_BASE_URI,
                basePath: `/dataflowjobs/03CRM0000006tEf2AI/nodes/03LRM000000Bg4P2AS`,
            },
            [
                'WaveController.getDataflowJobNode',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'get',
                baseUri: WAVE_BASE_URI,
                basePath: `/dataflowjobs/03CRM0000006tEf2AI/nodes/03LRM000000Bg4P2AS`,
            },
            {}
        );
    });

    describe('get /wave/limits', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: WAVE_BASE_URI,
                basePath: `/limits`,
            },
            [
                'WaveController.getAnalyticsLimits',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        describe('with query params', () => {
            testControllerInput(
                {
                    method: 'get',
                    baseUri: WAVE_BASE_URI,
                    basePath: `/limits`,
                    queryParams: {
                        types: ['DatasetQueries', 'DatasetRowCount'],
                        licenseType: 'Sonic',
                    },
                },
                [
                    'WaveController.getAnalyticsLimits',
                    {
                        types: ['DatasetQueries', 'DatasetRowCount'],
                        licenseType: 'Sonic',
                    },
                    { background: false, hotspot: true, longRunning: false },
                ]
            );
        });

        testRejectFetchResponse({
            method: 'get',
            baseUri: WAVE_BASE_URI,
            basePath: `/limits`,
        });

        testResolveResponse(
            {
                method: 'get',
                baseUri: WAVE_BASE_URI,
                basePath: `/limits`,
            },
            {}
        );
    });

    describe('get /connect/communities/{communityId}/managed-content/delivery/contents', () => {
        testControllerInput(
            {
                baseUri: CONNECT_BASE_URI,
                basePath: `/communities/1234567890ABCDE/managed-content/delivery/contents`,
            },
            [
                'ManagedContentController.getPublishedManagedContentListByContentKey',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testRejectFetchResponse({
            baseUri: CONNECT_BASE_URI,
            basePath: `/communities/1234567890ABCDE/managed-content/delivery/contents`,
        });

        testResolveResponse(
            {
                baseUri: CONNECT_BASE_URI,
                basePath: `/communities/1234567890ABCDE/managed-content/delivery/contents`,
            },
            {}
        );
    });

    describe('get /connect/communities/{communityId}/seo/properties/{recordId}', () => {
        testControllerInput(
            {
                baseUri: CONNECT_BASE_URI,
                basePath: `/communities/1234567890ABCDE/seo/properties/1234567890-ABCDE-xyz`,
            },
            [
                'SeoPropertiesController.getRecordSeoProperties',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testRejectFetchResponse({
            baseUri: CONNECT_BASE_URI,
            basePath: `/communities/1234567890ABCDE/seo/properties/1234567890-ABCDE-xyz`,
        });

        testResolveResponse(
            {
                baseUri: CONNECT_BASE_URI,
                basePath: `/communities/1234567890ABCDE/seo/properties/1234567890-ABCDE-xyz`,
            },
            {}
        );
    });

    // [IMPORTANT] this test has to be the last one in the suite to verify all registered routes have corresponding tests
    it.each(Object.keys(testedRoutes).map(key => key.split(':')))(
        '%s %s route tested',
        (method, handlerName) => {
            expect(testedRoutes[`${method}:${handlerName}`]).toBe(true);
        }
    );
});
