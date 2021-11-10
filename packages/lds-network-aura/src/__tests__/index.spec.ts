import { ResourceRequest, HttpStatusCode } from '@luvio/engine';
import * as aura from 'aura';
import auraStorage from 'aura-storage';
import { AuraFetchResponse } from '../AuraFetchResponse';
import networkAdapter from '../main';
import { LWR_APEX_BASE_URI } from '../middlewares/apex';
import {
    COMMERCE_BASE_URI,
    CONNECT_BASE_URI,
    GUIDANCE_BASE_URI,
    WAVE_BASE_URI,
    ADATS_BASE_URI,
    CMS_NON_CONNECT_BASE_URI,
    CMS_BASE_URI,
    BILLING_BASE_URI,
    SCALECENTER_BASE_URI,
    EXPLAINABILITY_BASE_URI,
    SITES_BASE_URI,
    CIB_BASE_URI,
    ADATS_DATABASE_BASE_URI,
    ADATS_SYNC_BASE_URI,
    IDENTITY_VERIFICATION_BASE_URI,
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
        incrementNetworkRateLimitExceededCount: () => {},
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
            routes.forEach((route) => {
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
        appRouter.lookup = function (resourceRequest: ResourceRequest): ControllerInvoker | null {
            const { basePath, baseUri, method } = resourceRequest;
            const path = `${baseUri}${basePath}`;
            const routes: Route[] = this.methods[method];
            if (routes === undefined || routes.length === 0) {
                return null;
            }

            const matchedRoute = routes.find((route) => route.predicate(path));
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
                queryParams: {
                    recordTypeId: '123',
                },
            },
            [
                'RecordUiController.getDuplicateConfig',
                {
                    objectApiName: 'Test_c',
                    recordTypeId: '123',
                },
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

    describe('get /lwr/{apiVersion}/apex', () => {
        testControllerInput(
            {
                baseUri: LWR_APEX_BASE_URI,
                basePath: '/ContactController/getContactList',
                method: 'get',
                body: null,
                urlParams: {
                    apexMethod: 'getContactList',
                    apexClass: 'ContactController',
                },
                queryParams: {},
                headers: {
                    'X-SFDC-Allow-Continuation': 'false',
                },
            },
            [
                'ApexActionController.execute',
                {
                    namespace: '',
                    classname: 'ContactController',
                    method: 'getContactList',
                    params: undefined,
                    cacheable: true,
                    isContinuation: false,
                },
                { background: false, hotspot: false, longRunning: false },
            ]
        );

        // tests classname with namespace
        testControllerInput(
            {
                baseUri: LWR_APEX_BASE_URI,
                basePath: '/ns__ContactController/getContactList',
                method: 'get',
                body: null,
                urlParams: {
                    apexMethod: 'getContactList',
                    apexClass: 'ns__ContactController',
                },
                queryParams: {},
                headers: {
                    'X-SFDC-Allow-Continuation': 'false',
                },
            },
            [
                'ApexActionController.execute',
                {
                    namespace: 'ns',
                    classname: 'ContactController',
                    method: 'getContactList',
                    params: undefined,
                    cacheable: true,
                    isContinuation: false,
                },
                { background: false, hotspot: false, longRunning: false },
            ]
        );

        // tests with continuation true
        testControllerInput(
            {
                baseUri: LWR_APEX_BASE_URI,
                basePath: '/ContactController/getContactList',
                method: 'get',
                body: null,
                urlParams: {
                    apexMethod: 'getContactList',
                    apexClass: 'ContactController',
                },
                queryParams: {},
                headers: {
                    'X-SFDC-Allow-Continuation': 'true',
                },
            },
            [
                'ApexActionController.execute',
                {
                    namespace: '',
                    classname: 'ContactController',
                    method: 'getContactList',
                    params: undefined,
                    cacheable: true,
                    isContinuation: true,
                },
                { background: false, hotspot: false, longRunning: true },
            ]
        );

        // tests with method params
        const mockMethodParams = {
            param1: 1,
            param2: '2',
        };
        testControllerInput(
            {
                baseUri: LWR_APEX_BASE_URI,
                basePath: '/ContactController/getContactList',
                method: 'get',
                body: null,
                urlParams: {
                    apexMethod: 'getContactList',
                    apexClass: 'ContactController',
                },
                queryParams: {
                    methodParams: mockMethodParams,
                },
                headers: {
                    'X-SFDC-Allow-Continuation': 'false',
                },
            },
            [
                'ApexActionController.execute',
                {
                    namespace: '',
                    classname: 'ContactController',
                    method: 'getContactList',
                    params: mockMethodParams,
                    cacheable: true,
                    isContinuation: false,
                },
                { background: false, hotspot: false, longRunning: false },
            ]
        );

        it('handles response with no returnValue', async () => {
            jest.spyOn(aura, 'executeGlobalController').mockResolvedValueOnce({ cacheable: true });

            const res = await networkAdapter({
                baseUri: LWR_APEX_BASE_URI,
                basePath: '/ContactController/getVoid',
                method: 'get',
                body: null,
                urlParams: {
                    apexMethod: 'getVoid',
                    apexClass: 'ContactController',
                },
                queryParams: {},
                headers: {
                    'X-SFDC-Allow-Continuation': 'false',
                },
                key: 'key',
                ingest: (() => {}) as any,
            });

            expect(res).toBeInstanceOf(AuraFetchResponse);
            expect(res).toMatchObject({
                status: 200,
                body: null,
                headers: { 'Cache-Control': 'private' },
            });
        });
    });

    describe('post /lwr/{apiVersion}/apex', () => {
        testControllerInput(
            {
                baseUri: LWR_APEX_BASE_URI,
                basePath: '/ContactController/getContactList',
                method: 'post',
                body: {},
                queryParams: {},
                urlParams: {
                    apexMethod: 'getContactList',
                    apexClass: 'ContactController',
                },
                headers: {
                    'X-SFDC-Allow-Continuation': 'false',
                },
            },
            [
                'ApexActionController.execute',
                {
                    namespace: '',
                    classname: 'ContactController',
                    method: 'getContactList',
                    params: {},
                    cacheable: false,
                    isContinuation: false,
                },
                { background: false, hotspot: false, longRunning: false },
            ]
        );

        // tests classname with namespace
        testControllerInput(
            {
                baseUri: LWR_APEX_BASE_URI,
                basePath: '/ns__ContactController/getContactList',
                method: 'post',
                body: {},
                queryParams: {},
                urlParams: {
                    apexMethod: 'getContactList',
                    apexClass: 'ns__ContactController',
                },
                headers: {
                    'X-SFDC-Allow-Continuation': 'false',
                },
            },
            [
                'ApexActionController.execute',
                {
                    namespace: 'ns',
                    classname: 'ContactController',
                    method: 'getContactList',
                    params: {},
                    cacheable: false,
                    isContinuation: false,
                },
                { background: false, hotspot: false, longRunning: false },
            ]
        );

        // tests continuation true
        testControllerInput(
            {
                baseUri: LWR_APEX_BASE_URI,
                basePath: '/ContactController/getContactList',
                method: 'post',
                body: {},
                queryParams: {},
                urlParams: {
                    apexMethod: 'getContactList',
                    apexClass: 'ContactController',
                },
                headers: {
                    'X-SFDC-Allow-Continuation': 'true',
                },
            },
            [
                'ApexActionController.execute',
                {
                    namespace: '',
                    classname: 'ContactController',
                    method: 'getContactList',
                    params: {},
                    cacheable: false,
                    isContinuation: true,
                },
                { background: false, hotspot: false, longRunning: true },
            ]
        );

        // tests with method params
        const mockMethodParams = {
            param1: 1,
            param2: '2',
        };
        testControllerInput(
            {
                baseUri: LWR_APEX_BASE_URI,
                basePath: '/ContactController/getContactList',
                method: 'post',
                body: mockMethodParams,
                queryParams: {},
                urlParams: {
                    apexMethod: 'getContactList',
                    apexClass: 'ContactController',
                },
                headers: {
                    'X-SFDC-Allow-Continuation': 'false',
                },
            },
            [
                'ApexActionController.execute',
                {
                    namespace: '',
                    classname: 'ContactController',
                    method: 'getContactList',
                    params: mockMethodParams,
                    cacheable: false,
                    isContinuation: false,
                },
                { background: false, hotspot: false, longRunning: false },
            ]
        );

        it('handles response with no returnValue', async () => {
            jest.spyOn(aura, 'executeGlobalController').mockResolvedValueOnce({ cacheable: true });

            const res = await networkAdapter({
                baseUri: LWR_APEX_BASE_URI,
                basePath: '/ContactController/getVoid',
                method: 'post',
                body: {},
                queryParams: {},
                urlParams: {
                    apexMethod: 'getVoid',
                    apexClass: 'ContactController',
                },
                headers: {
                    'X-SFDC-Allow-Continuation': 'false',
                },
            });

            expect(res).toBeInstanceOf(AuraFetchResponse);
            expect(res).toMatchObject({
                status: 200,
                body: null,
                headers: { 'Cache-Control': 'private' },
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
                url: '/services/data/v54.0/ui-api/object-info/Opportunity/picklist-values/012T00000004MUHIA2/User',
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
                        relatedListId: '1111',
                    },
                },
                [
                    'RelatedListUiController.getRelatedListRecordCount',
                    { parentRecordId: '1234', relatedListId: '1111' },
                    undefined,
                ]
            );
            testRejectFetchResponse({
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/related-list-count/1234/1111`,
                urlParams: {
                    parentRecordId: '1234',
                    relatedListId: '1111',
                },
            });

            testResolveResponse(
                {
                    method: 'get',
                    baseUri: UI_API_BASE_URI,
                    basePath: `/related-list-count/1234/1111`,
                    urlParams: {
                        parentRecordId: '1234',
                        relatedListId: '1111',
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

    describe('get /actions/global', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/actions/global`,
            },
            ['ActionsController.getGlobalActions', {}, undefined]
        );

        testRejectFetchResponse({
            method: 'get',
            baseUri: UI_API_BASE_URI,
            basePath: `/actions/global`,
        });

        testResolveResponse(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/actions/global`,
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

    describe('get /actions/record-defaults/{actionApiName}', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/actions/record-defaults/`,
            },
            ['ActionsController.getQuickActionDefaults', {}, undefined]
        );

        testRejectFetchResponse({
            method: 'get',
            baseUri: UI_API_BASE_URI,
            basePath: `/actions/record-defaults/`,
        });

        testResolveResponse(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/actions/record-defaults/`,
            },
            {
                objectApiName: {},
                fields: [],
                actionApiName: {},
            }
        );
    });

    describe('post /connect/omnistudio/decision-matrices/{id}/columns', () => {
        testControllerInput(
            {
                method: 'post',
                baseUri: CONNECT_BASE_URI,
                basePath: `/omnistudio/decision-matrices/1234567890ABCDE/columns`,
                body: { columns: [{ name: 'data' }] },
            },
            [
                'InteractionDecisionMatrixController.saveColumns',
                { columns: [{ name: 'data' }] },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'post',
                baseUri: CONNECT_BASE_URI,
                basePath: `/omnistudio/decision-matrices/1234567890ABCDE/columns`,
            },
            {}
        );
    });

    describe('get /omnistudio/decision-matrices/{$matrixId}/columns', () => {
        testControllerInput(
            {
                baseUri: CONNECT_BASE_URI,
                basePath: `/omnistudio/decision-matrices/1234567890ABCDE/columns`,
            },
            [
                'InteractionDecisionMatrixController.getColumns',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );
        testResolveResponse(
            {
                method: 'get',
                baseUri: CONNECT_BASE_URI,
                basePath: `/omnistudio/decision-matrices/1234567890ABCDE/columns`,
            },
            {}
        );
    });

    describe('get /omnistudio/decision-matrices/{id}/versions/{id}/rows', () => {
        testControllerInput(
            {
                baseUri: CONNECT_BASE_URI,
                basePath: `/omnistudio/decision-matrices/1234567890ABCDE/versions/1234567890ABCDE/rows`,
            },
            [
                'InteractionDecisionMatrixController.getRows',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );
        testResolveResponse(
            {
                method: 'get',
                baseUri: CONNECT_BASE_URI,
                basePath: `/omnistudio/decision-matrices/1234567890ABCDE/versions/1234567890ABCDE/rows`,
            },
            {}
        );
    });

    describe('post /omnistudio/decision-matrices/{id}/versions/{id}/rows', () => {
        testControllerInput(
            {
                method: 'post',
                baseUri: CONNECT_BASE_URI,
                basePath: `/omnistudio/decision-matrices/1234567890ABCDE/versions/1234567890ABCDE/rows`,
                body: { rows: [{ name: 'data' }] },
            },
            [
                'InteractionDecisionMatrixController.saveRows',
                { rows: [{ name: 'data' }] },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'post',
                baseUri: CONNECT_BASE_URI,
                basePath: `/omnistudio/decision-matrices/1234567890ABCDE/versions/1234567890ABCDE/rows`,
            },
            {}
        );
    });

    describe('get ${CONNECT_BASE_URI}/omnistudio/evaluation-services/version-definitions/([A-Z0-9]){15,18}/simulation$', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: CONNECT_BASE_URI,
                basePath: `/omnistudio/evaluation-services/version-definitions/03CRM0000006tEf2AI/simulation`,
                urlParams: {
                    id: '03CRM0000006tEf2AI',
                },
                queryParams: {
                    inputVariales: true,
                },
            },
            [
                'InteractionCalculationProceduresController.getSimulationInputVariables',
                {
                    id: '03CRM0000006tEf2AI',
                    inputVariales: true,
                },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'get',
                baseUri: CONNECT_BASE_URI,
                basePath: `/omnistudio/evaluation-services/version-definitions/03CRM0000006tEf2AI/simulation`,
            },
            {}
        );
    });

    describe('get /omnistudio/decision-matrices/{id}', () => {
        testControllerInput(
            {
                baseUri: CONNECT_BASE_URI,
                basePath: `/omnistudio/decision-matrices/123`,
            },
            [
                'InteractionCalculationProceduresController.getDecisionMatrixDetails',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'get',
                baseUri: CONNECT_BASE_URI,
                basePath: `/omnistudio/decision-matrices/123`,
            },
            {}
        );
    });

    describe('patch /omnistudio/evaluation-services/version-definitions/([A-Z0-9]){1,18}', () => {
        testControllerInput(
            {
                method: 'patch',
                baseUri: CONNECT_BASE_URI,
                basePath: `/omnistudio/evaluation-services/version-definitions/testId`,
                body: {
                    action: 'activate',
                },
            },
            [
                'InteractionCalculationProceduresController.activateCalcProcedureVersion',
                {
                    action: 'activate',
                },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'patch',
                baseUri: CONNECT_BASE_URI,
                basePath: `/omnistudio/evaluation-services/version-definitions/testId`,
                body: {
                    action: 'activate',
                },
            },
            {
                versionId: 'testId',
            }
        );

        testRejectFetchResponse({
            method: 'patch',
            baseUri: CONNECT_BASE_URI,
            basePath: `/omnistudio/evaluation-services/version-definitions/testId`,
        });
    });

    describe('patch /omnistudio/evaluation-services/version-definitions/([A-Z0-9]){1,18}/simulation', () => {
        testControllerInput(
            {
                method: 'patch',
                baseUri: CONNECT_BASE_URI,
                basePath: `/omnistudio/evaluation-services/version-definitions/testId/simulation`,
                body: {
                    simulationInput: {
                        input: {},
                        config: {},
                    },
                },
            },
            [
                'InteractionCalculationProceduresController.simulateEvaluationService',
                {
                    simulationInput: {
                        input: {},
                        config: {},
                    },
                },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'patch',
                baseUri: CONNECT_BASE_URI,
                basePath: `/omnistudio/evaluation-services/version-definitions/testId/simulation`,
                body: {
                    simulationInput: {
                        input: {},
                        config: {},
                    },
                },
            },
            {
                executionId: 'executionId',
                simulationResults: [],
                simulationStepResults: {},
            }
        );

        testRejectFetchResponse({
            method: 'patch',
            baseUri: CONNECT_BASE_URI,
            basePath: `/omnistudio/evaluation-services/version-definitions/testId/simulation`,
        });
    });

    describe('get /omnistudio/evaluation-services/version-definitions/{id}', () => {
        testControllerInput(
            {
                baseUri: CONNECT_BASE_URI,
                basePath: `/omnistudio/evaluation-services/version-definitions/123`,
            },
            [
                'InteractionCalculationProceduresController.getCalcProcVersionDefinition',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'get',
                baseUri: CONNECT_BASE_URI,
                basePath: `/omnistudio/evaluation-services/version-definitions/123`,
            },
            {}
        );
    });

    describe('get /omnistudio/evaluation-services/{id}', () => {
        testControllerInput(
            {
                baseUri: CONNECT_BASE_URI,
                basePath: `/omnistudio/evaluation-services/123`,
            },
            [
                'InteractionCalculationProceduresController.getCalcProcDetails',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'get',
                baseUri: CONNECT_BASE_URI,
                basePath: `/omnistudio/evaluation-services/123`,
            },
            {}
        );
    });

    describe('post /omnistudio/evaluation-services/version-definitions', () => {
        testControllerInput(
            {
                method: 'post',
                baseUri: CONNECT_BASE_URI,
                basePath: `/omnistudio/evaluation-services/version-definitions`,
                body: {
                    calculationProcedureDefinition: {
                        calculationProcedureId: '1234',
                        constants: [],
                        description: 'description',
                        enabled: true,
                        endDate: '2021-06-19T10:54:56.787Z',
                        name: 'name',
                        rank: 1,
                        root: ['root1', 'root2'],
                        startDate: '2021-06-19T10:54:56.787Z',
                        step: {},
                        variables: [],
                        versionId: '123',
                        versionNumber: 1,
                    },
                },
            },
            [
                'InteractionCalculationProceduresController.createRule',
                {
                    calculationProcedureDefinition: {
                        calculationProcedureId: '1234',
                        constants: [],
                        description: 'description',
                        enabled: true,
                        endDate: '2021-06-19T10:54:56.787Z',
                        name: 'name',
                        rank: 1,
                        root: ['root1', 'root2'],
                        startDate: '2021-06-19T10:54:56.787Z',
                        step: {},
                        variables: [],
                        versionId: '123',
                        versionNumber: 1,
                    },
                },
                { background: false, hotspot: true, longRunning: false },
            ],
            {
                versionId: '123',
            }
        );

        testRejectFetchResponse({
            method: 'post',
            baseUri: CONNECT_BASE_URI,
            basePath: `/omnistudio/evaluation-services/version-definitions`,
        });

        testResolveResponse(
            {
                method: 'post',
                baseUri: CONNECT_BASE_URI,
                basePath: `/omnistudio/evaluation-services/version-definitions`,
            },
            {
                versionId: '123',
            }
        );
    });

    describe('get /omnistudio/evaluation-services', () => {
        testControllerInput(
            {
                baseUri: CONNECT_BASE_URI,
                basePath: `/omnistudio/evaluation-services`,
            },
            [
                'InteractionCalculationProceduresController.searchCalculationProcedure',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );
        describe('with query params', () => {
            testControllerInput(
                {
                    method: 'get',
                    baseUri: CONNECT_BASE_URI,
                    basePath: `/omnistudio/evaluation-services`,
                    queryParams: {
                        searchKey: 'CalcProc',
                    },
                },
                [
                    'InteractionCalculationProceduresController.searchCalculationProcedure',
                    {
                        searchKey: 'CalcProc',
                    },
                    { background: false, hotspot: true, longRunning: false },
                ]
            );
        });
        testResolveResponse(
            {
                method: 'get',
                baseUri: CONNECT_BASE_URI,
                basePath: `/omnistudio/evaluation-services`,
            },
            {}
        );
    });

    describe('get /omnistudio/decision-matrices', () => {
        testControllerInput(
            {
                baseUri: CONNECT_BASE_URI,
                basePath: `/omnistudio/decision-matrices`,
            },
            [
                'InteractionCalculationProceduresController.searchDecisionMatrixByName',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );
        describe('with query params', () => {
            testControllerInput(
                {
                    method: 'get',
                    baseUri: CONNECT_BASE_URI,
                    basePath: `/omnistudio/decision-matrices`,
                    queryParams: {
                        searchKey: 'DM1',
                    },
                },
                [
                    'InteractionCalculationProceduresController.searchDecisionMatrixByName',
                    {
                        searchKey: 'DM1',
                    },
                    { background: false, hotspot: true, longRunning: false },
                ]
            );
        });
        testResolveResponse(
            {
                method: 'get',
                baseUri: CONNECT_BASE_URI,
                basePath: `/omnistudio/decision-matrices`,
            },
            {}
        );
    });

    describe('get /action-logs', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: EXPLAINABILITY_BASE_URI,
                basePath: `/action-logs`,
                queryParams: {
                    actionContextCode: '012T00000004MUHIA2',
                    applicationType: 'PSC-LPI',
                    applicationSubType: 'ExpressionSet',
                    processType: 'PaymentFlow',
                },
            },
            [
                'ExplainabilityServiceController.getExplainabilityActionLogs',
                {
                    actionContextCode: '012T00000004MUHIA2',
                    applicationType: 'PSC-LPI',
                    applicationSubType: 'ExpressionSet',
                    processType: 'PaymentFlow',
                },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'get',
                baseUri: EXPLAINABILITY_BASE_URI,
                basePath: `/action-logs`,
            },
            {}
        );
    });

    describe('post /action-logs', () => {
        testControllerInput(
            {
                method: 'post',
                baseUri: EXPLAINABILITY_BASE_URI,
                basePath: `/action-logs`,
                body: {
                    explainabilityActionLogDefinitionx: {
                        actionContextCode: '012T00000004MUHIA2',
                        actionLog:
                            '{"FinancialAssistanceEligibility":{"input":{"perAccident":"300","perPerson":"100"},"output":{"calculationResults":[{"totalPrice":"45100"}],"aggregationResults":{}}}}',
                        actionLogDate: '2021-10-04T10:54:56.787Z',
                        name: 'ExpressionSet01',
                        specificationName: 'ExpressionSet01',
                        actionLogOwnerId: '005T00000004MUHIA2',
                    },
                },
            },
            [
                'ExplainabilityServiceController.storeExplainabilityActionLog',
                {
                    explainabilityActionLogDefinitionx: {
                        actionContextCode: '012T00000004MUHIA2',
                        actionLog:
                            '{"FinancialAssistanceEligibility":{"input":{"perAccident":"300","perPerson":"100"},"output":{"calculationResults":[{"totalPrice":"45100"}],"aggregationResults":{}}}}',
                        actionLogDate: '2021-10-04T10:54:56.787Z',
                        name: 'ExpressionSet01',
                        specificationName: 'ExpressionSet01',
                        actionLogOwnerId: '005T00000004MUHIA2',
                    },
                },
                { background: false, hotspot: true, longRunning: false },
            ],
            {
                actionContextCode: '012T00000004MUHIA2',
            }
        );

        testRejectFetchResponse({
            method: 'post',
            baseUri: EXPLAINABILITY_BASE_URI,
            basePath: `/action-logs`,
        });

        testResolveResponse(
            {
                method: 'post',
                baseUri: EXPLAINABILITY_BASE_URI,
                basePath: `/action-logs`,
            },
            {
                actionContextCode: '012T00000004MUHIA2',
            }
        );
    });

    describe('get /loyalty/programs/{programName}/processes/{processName}/rule/{ruleName}', () => {
        testControllerInput(
            {
                baseUri: CONNECT_BASE_URI,
                basePath: `/loyalty/programs/Prog1/processes/Process1/rule/Rule1`,
            },
            [
                'LoyaltyEngineConnectController.getProgramProcessRule',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'get',
                baseUri: CONNECT_BASE_URI,
                basePath: `/loyalty/programs/Prog1/processes/Process1/rule/Rule1`,
            },
            {}
        );
    });

    describe('post /loyalty/programs/{programName}/processes/{processName}/rule/{ruleName}', () => {
        testControllerInput(
            {
                method: 'post',
                baseUri: CONNECT_BASE_URI,
                basePath: `/loyalty/programs/Prog1/processes/Process1/rule/Rule1`,
                body: {
                    conditions: [
                        {
                            name: 'C1',
                            filterCondition: '1',
                            criteria: [
                                {
                                    sourceFieldName: 'TransactionJournal.Product.Description',
                                    operator: 'Equals',
                                    sequence: 1,
                                    value: 'j',
                                    valueType: 'FixedValue',
                                },
                            ],
                        },
                    ],
                    stepMappings: [
                        {
                            associatedStep: 'C1',
                            parentStep: null,
                            sequence: 1,
                        },
                    ],
                },
            },
            [
                'LoyaltyEngineConnectController.upsertProgramProcessRule',
                {
                    conditions: [
                        {
                            name: 'C1',
                            filterCondition: '1',
                            criteria: [
                                {
                                    sourceFieldName: 'TransactionJournal.Product.Description',
                                    operator: 'Equals',
                                    sequence: 1,
                                    value: 'j',
                                    valueType: 'FixedValue',
                                },
                            ],
                        },
                    ],
                    stepMappings: [
                        {
                            associatedStep: 'C1',
                            parentStep: null,
                            sequence: 1,
                        },
                    ],
                },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'post',
                baseUri: CONNECT_BASE_URI,
                basePath: `/loyalty/programs/Prog1/processes/Process1/rule/Rule1`,
            },
            {}
        );
    });

    describe('put /record-locking/lock/{recordId}', () => {
        testControllerInput(
            {
                method: 'put',
                baseUri: CONNECT_BASE_URI,
                basePath: `/sustainability/record-locking/lock/012T00000004MUHIA2`,
                urlParams: {
                    recordId: '012T00000004MUHIA2',
                },
            },
            [
                'SustainabilityFamilyController.lockRecord',
                {
                    recordId: '012T00000004MUHIA2',
                },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'put',
                baseUri: CONNECT_BASE_URI,
                basePath: `/sustainability/record-locking/lock/012T00000004MUHIA2`,
            },
            {
                code: 1,
                message: 'lock called successfully',
            }
        );
    });

    describe('put /record-locking/unlock/{recordId}', () => {
        testControllerInput(
            {
                method: 'put',
                baseUri: CONNECT_BASE_URI,
                basePath: `/sustainability/record-locking/unlock/012T00000004MUHIA2`,
                urlParams: {
                    recordId: '012T00000004MUHIA2',
                },
            },
            [
                'SustainabilityFamilyController.unlockRecord',
                {
                    recordId: '012T00000004MUHIA2',
                },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'put',
                baseUri: CONNECT_BASE_URI,
                basePath: `/sustainability/record-locking/unlock/012T00000004MUHIA2`,
            },
            {
                code: 1,
                message: 'unlock called successfully',
            }
        );
    });

    describe('post /reference-data/{category}/upload', () => {
        testControllerInput(
            {
                method: 'post',
                baseUri: CONNECT_BASE_URI,
                basePath: `/sustainability/reference-data/ABCDE/upload`,
                urlParams: {
                    category: 'ABCDE',
                },
                queryParams: {
                    recordTypeId: '012T00000004MUHIA2',
                },
            },
            [
                'SustainabilityFamilyController.uploadReferenceData',
                {
                    category: 'ABCDE',
                    recordTypeId: '012T00000004MUHIA2',
                },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'post',
                baseUri: CONNECT_BASE_URI,
                basePath: `/sustainability/reference-data/ABCDE/upload`,
            },
            {
                code: 1,
                message: 'called successfully',
            }
        );
    });
    describe('get /consumer-goods/tenant-registration', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: CONNECT_BASE_URI,
                basePath: `/consumer-goods/tenant-registration`,
            },
            [
                'RCGTenantManagementController.getTenantRegistrationStatus',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'get',
                baseUri: CONNECT_BASE_URI,
                basePath: `/consumer-goods/tenant-registration`,
            },
            {
                isCertAvailable: true,
                state: 'registerd',
            }
        );
    });

    describe('put /consumer-goods/tenant-registration', () => {
        testControllerInput(
            {
                method: 'put',
                baseUri: CONNECT_BASE_URI,
                basePath: `/consumer-goods/tenant-registration`,
            },
            [
                'RCGTenantManagementController.updateTenantCertificate',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'put',
                baseUri: CONNECT_BASE_URI,
                basePath: `/consumer-goods/tenant-registration`,
            },
            {
                certificateUpdateStatus: 'success',
            }
        );
    });

    describe('post /footprint-calculation/recalculate/', () => {
        testControllerInput(
            {
                method: 'post',
                baseUri: CONNECT_BASE_URI,
                basePath: `/sustainability/footprint-calculation/recalculate/`,
                urlParams: {
                    recordId: '012T00000004MUHIA2',
                },
            },
            [
                'SustainabilityFamilyController.performSustainabilityFootprintCalculationOnRecord',
                {
                    recordId: '012T00000004MUHIA2',
                },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'post',
                baseUri: CONNECT_BASE_URI,
                basePath: `/sustainability/footprint-calculation/recalculate/`,
            },
            {
                status: 'success',
                message: 'called successfully',
            }
        );
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

    describe('post /related-list-records/{parentRecordId}/{relatedListId}', () => {
        testControllerInput(
            {
                method: 'post',
                baseUri: UI_API_BASE_URI,
                basePath: `/related-list-records/{parentRecordId}/{relatedListId}`,
                urlParams: {
                    parentRecordId: '012T00000004MUHIA2',
                    relatedListId: 'Contact__r',
                },
                body: {
                    fields: ['Id'],
                    optionalFields: ['Name'],
                    pageSize: 50,
                    pageToken: 0,
                    sortBy: ['Id'],
                },
            },
            [
                'RelatedListUiController.postRelatedListRecords',
                {
                    parentRecordId: '012T00000004MUHIA2',
                    relatedListId: 'Contact__r',
                    listRecordsQuery: {
                        fields: ['Id'],
                        optionalFields: ['Name'],
                        pageSize: 50,
                        pageToken: 0,
                        sortBy: ['Id'],
                    },
                },
                undefined,
            ]
        );

        testRejectFetchResponse({
            method: 'post',
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

    describe('get /list-info/{objectApiName}/{listViewApiName}', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: UI_API_BASE_URI,
                basePath: `/list-info/Account/AllAccounts`,
                urlParams: {
                    objectApiName: 'Account',
                    listViewApiName: 'AllAccounts',
                },
            },
            [
                'ListUiController.getListInfoByName',
                {
                    objectApiName: 'Account',
                    listViewApiName: 'AllAccounts',
                },
                undefined,
            ]
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

    describe('get /scalecenter/metrics/query', () => {
        const testRequest =
            '{"path":"datasource/requestType/sample_metric","guid":"1234","start":123456789,"end":123456789}';
        const testResponse =
            '{"guid": "1234","data": [metric: "sample_metric",datapoints: {"1234":100, "5678":200}]}';
        const queryMetricsPath = `/metrics/query`;
        testControllerInput(
            {
                baseUri: SCALECENTER_BASE_URI,
                basePath: queryMetricsPath,
                queryParams: {
                    request: testRequest,
                },
            },
            [
                'ScaleCenterController.queryMetrics',
                {
                    request: testRequest,
                },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testRejectFetchResponse({
            baseUri: SCALECENTER_BASE_URI,
            basePath: queryMetricsPath,
        });

        testResolveResponse(
            {
                baseUri: SCALECENTER_BASE_URI,
                basePath: queryMetricsPath,
            },
            {
                response: testResponse,
            }
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
                    pageParam: 0,
                    pageSize: 20,
                    navItemNames: ['t1', 't2'],
                },
                undefined,
            ]
        );
    });

    describe('get /{assistantName}', () => {
        testControllerInput(
            {
                baseUri: GUIDANCE_BASE_URI,
                basePath: `/1234567890ABCDE`,
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
                basePath: `/1234567890ABCDE`,
            },
            {}
        );
    });

    describe('patch /{assistantName}', () => {
        testControllerInput(
            {
                method: 'patch',
                baseUri: GUIDANCE_BASE_URI,
                basePath: `/1234567890ABCDE`,
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
                basePath: `/1234567890ABCDE`,
            },
            {}
        );
    });

    describe('get /{assistantName}/questionnaires', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: GUIDANCE_BASE_URI,
                basePath: `/1234567890ABCDE/questionnaires`,
            },
            [
                'LightningExperienceAssistantPlatformController.getQuestionnaires',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'get',
                baseUri: GUIDANCE_BASE_URI,
                basePath: `/1234567890ABCDE/questionnaires`,
            },
            {}
        );
    });

    describe('get /questionnaire/{questionnaireName}', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: GUIDANCE_BASE_URI,
                basePath: `/questionnaire/1234567890ABCDE`,
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
                basePath: `/questionnaire/1234567890ABCDE`,
            },
            {}
        );
    });

    describe('patch /questionnaire/{questionnaireName}', () => {
        testControllerInput(
            {
                method: 'patch',
                baseUri: GUIDANCE_BASE_URI,
                basePath: `/questionnaire/1234567890ABCDE`,
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
                basePath: `/questionnaire/1234567890ABCDE`,
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

    describe('get /{assistantTarget}/list', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: GUIDANCE_BASE_URI,
                basePath: `/1234567890ABCDE/list`,
            },
            [
                'LightningExperienceAssistantPlatformController.getAssistantList',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'get',
                baseUri: GUIDANCE_BASE_URI,
                basePath: `/1234567890ABCDE/list`,
            },
            {}
        );
    });

    describe('patch /{assistantTarget}/list', () => {
        testControllerInput(
            {
                method: 'patch',
                baseUri: GUIDANCE_BASE_URI,
                basePath: `/1234567890ABCDE/list`,
                body: { scenarioData: { data: 'data' } },
            },
            [
                'LightningExperienceAssistantPlatformController.saveAssistantList',
                {
                    scenarioData: { data: 'data' },
                },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'patch',
                baseUri: GUIDANCE_BASE_URI,
                basePath: `/1234567890ABCDE/list`,
            },
            {}
        );
    });

    describe('patch /step/{stepName}', () => {
        testControllerInput(
            {
                method: 'patch',
                baseUri: GUIDANCE_BASE_URI,
                basePath: `/step/1234567890ABCDE`,
                body: {},
            },
            [
                'LightningExperienceAssistantPlatformController.evaluateStep',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'patch',
                baseUri: GUIDANCE_BASE_URI,
                basePath: `/step/1234567890ABCDE`,
                body: {},
            },
            {}
        );
    });

    describe('put /{assistantTarget}/initialize', () => {
        testControllerInput(
            {
                method: 'put',
                baseUri: GUIDANCE_BASE_URI,
                basePath: `/1234567890ABCDE/initialize`,
                body: {},
            },
            [
                'LightningExperienceAssistantPlatformController.initialize',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'put',
                baseUri: GUIDANCE_BASE_URI,
                basePath: `/1234567890ABCDE/initialize`,
                body: {},
            },
            {}
        );
    });

    describe('get /wave/dataconnectors/{connectorIdOrApiName}', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: WAVE_BASE_URI,
                basePath: `/dataconnectors/0ItS700000001YxKAI`,
            },
            [
                'WaveController.getDataConnector',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'get',
                baseUri: WAVE_BASE_URI,
                basePath: `/dataconnectors/0ItS700000001YxKAI`,
            },
            {}
        );
    });

    describe('patch /wave/dataconnectors/{connectorIdOrApiName}', () => {
        testControllerInput(
            {
                method: 'patch',
                baseUri: WAVE_BASE_URI,
                basePath: `/dataconnectors/0ItS70000004CVSKA2`,
                body: {
                    dataConnector: {
                        label: 'My Salesforce External Connector',
                        description: 'Snowflake connector',
                        connectionProperties: [
                            {
                                name: 'account',
                                value: 'ib89151',
                            },
                        ],
                    },
                },
            },
            [
                'WaveController.updateDataConnector',
                {
                    dataConnector: {
                        label: 'My Salesforce External Connector',
                        description: 'Snowflake connector',
                        connectionProperties: [
                            {
                                name: 'account',
                                value: 'ib89151',
                            },
                        ],
                    },
                },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'get',
                baseUri: WAVE_BASE_URI,
                basePath: `/dataconnectors/0ItS70000004CVSKA2`,
                body: {
                    dataConnector: {
                        label: 'My Salesforce External Connector',
                        description: 'Snowflake connector',
                        connectionProperties: [
                            {
                                name: 'account',
                                value: 'ib89151',
                            },
                        ],
                    },
                },
            },
            {}
        );
    });

    describe('post /wave/dataconnectors/{connectorIdOrApiName}/ingest', () => {
        testControllerInput(
            {
                method: 'post',
                baseUri: WAVE_BASE_URI,
                basePath: `/dataconnectors/0ItS700000001YxKAI/ingest`,
            },
            [
                'WaveController.ingestDataConnector',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'post',
                baseUri: WAVE_BASE_URI,
                basePath: `/dataconnectors/0ItS700000001YxKAI/ingest`,
            },
            {}
        );
    });

    describe('get /wave/dataconnectors/{connectorIdOrApiName}/status', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: WAVE_BASE_URI,
                basePath: `/dataconnectors/0ItS700000001YxKAI/status`,
            },
            [
                'WaveController.getDataConnectorStatus',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'get',
                baseUri: WAVE_BASE_URI,
                basePath: `/dataconnectors/0ItS700000001YxKAI/status`,
            },
            {}
        );
    });

    describe('get /wave/dataconnectors', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: WAVE_BASE_URI,
                basePath: `/dataconnectors`,
            },
            [
                'WaveController.getDataConnectors',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        describe('with query params', () => {
            testControllerInput(
                {
                    method: 'get',
                    baseUri: WAVE_BASE_URI,
                    basePath: `/dataconnectors`,
                    queryParams: {
                        category: 'FileBased',
                        connectorType: 'AmazonS3',
                        scope: 'SharedWithMe',
                    },
                },
                [
                    'WaveController.getDataConnectors',
                    {
                        category: 'FileBased',
                        connectorType: 'AmazonS3',
                        scope: 'SharedWithMe',
                    },
                    { background: false, hotspot: true, longRunning: false },
                ]
            );
        });

        testResolveResponse(
            {
                method: 'get',
                baseUri: WAVE_BASE_URI,
                basePath: `/dataconnectors`,
            },
            {}
        );
    });

    describe('post /wave/dataconnectors', () => {
        testControllerInput(
            {
                method: 'post',
                baseUri: WAVE_BASE_URI,
                basePath: `/dataconnectors`,
                body: {
                    dataConnector: {
                        connectorType: 'SfdcLocal',
                        connectionProperties: [],
                        connectorHandler: 'Legacy',
                        folder: { name: '', namespace: '', id: '', url: '', label: '' },
                        targetConnector: { name: '', namespace: '', id: '', url: '', label: '' },
                        label: 'sfdc 2',
                        name: 'sfdc2',
                        description: 'second sfdc connector',
                    },
                },
            },
            [
                'WaveController.createDataConnector',
                {
                    dataConnector: {
                        connectorType: 'SfdcLocal',
                        connectionProperties: [],
                        connectorHandler: 'Legacy',
                        folder: { name: '', namespace: '', id: '', url: '', label: '' },
                        targetConnector: { name: '', namespace: '', id: '', url: '', label: '' },
                        label: 'sfdc 2',
                        name: 'sfdc2',
                        description: 'second sfdc connector',
                    },
                },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'post',
                baseUri: WAVE_BASE_URI,
                basePath: `/dataconnectors`,
            },
            {}
        );
    });

    describe('get /wave/dataconnectors/{connectorIdOrApiName}/sourceObjects', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: WAVE_BASE_URI,
                basePath: `/dataconnectors/0Itxx0000004C92CAE/sourceObjects`,
            },
            [
                'WaveController.getDataConnectorSourceObjects',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        describe('with query params', () => {
            testControllerInput(
                {
                    method: 'get',
                    baseUri: WAVE_BASE_URI,
                    basePath: `/dataconnectors/0Itxx0000004C92CAE/sourceObjects`,
                    queryParams: {
                        page: 'eyJwYWdlU2l6ZSI6NSwic29ydE9yZGVyIjoiTkFNRSIsImxhc3RJZCI6IjAwMDAwMDAwMDAwMDAwMCIsImxhc3ROYW1lIjoiQUlBcHBsaWNhdGlvbiJ9',
                        pageSize: 5,
                    },
                },
                [
                    'WaveController.getDataConnectorSourceObjects',
                    {
                        pageParam:
                            'eyJwYWdlU2l6ZSI6NSwic29ydE9yZGVyIjoiTkFNRSIsImxhc3RJZCI6IjAwMDAwMDAwMDAwMDAwMCIsImxhc3ROYW1lIjoiQUlBcHBsaWNhdGlvbiJ9',
                        pageSize: 5,
                    },
                    { background: false, hotspot: true, longRunning: false },
                ]
            );
        });

        testResolveResponse(
            {
                method: 'get',
                baseUri: WAVE_BASE_URI,
                basePath: `/dataconnectors/0Itxx0000004C92CAE/sourceObjects`,
            },
            {}
        );
    });

    describe('get /wave/dataconnectors/{connectorIdOrApiName}/sourceObjects/{sourceObjectName}', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: WAVE_BASE_URI,
                basePath: `/dataconnectors/0ItS700000001YxKAI/sourceObjects/AIApplication`,
            },
            [
                'WaveController.getDataConnectorSourceObject',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'get',
                baseUri: WAVE_BASE_URI,
                basePath: `/dataconnectors/0ItS700000001YxKAI/sourceObjects/AIApplication`,
            },
            {}
        );
    });

    describe('get /wave/dataconnectors/{connectorIdOrApiName}/sourceObjects/{sourceObjectName}/fields', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: WAVE_BASE_URI,
                basePath: `/dataconnectors/0ItS700000001YxKAI/sourceObjects/AIApplication/fields`,
            },
            [
                'WaveController.getDataConnectorSourceFields',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'get',
                baseUri: WAVE_BASE_URI,
                basePath: `/dataconnectors/0ItS700000001YxKAI/sourceObjects/AIApplication/fields`,
            },
            {}
        );
    });

    describe('get /wave/dataConnectorTypes', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: WAVE_BASE_URI,
                basePath: `/dataConnectorTypes`,
            },
            [
                'WaveController.getDataConnectorTypes',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testRejectFetchResponse({
            method: 'get',
            baseUri: WAVE_BASE_URI,
            basePath: `/dataConnectorTypes`,
        });

        testResolveResponse(
            {
                method: 'get',
                baseUri: WAVE_BASE_URI,
                basePath: `/dataConnectorTypes`,
            },
            {}
        );
    });

    describe('get /wave/dataflows', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: WAVE_BASE_URI,
                basePath: `/dataflows`,
            },
            [
                'WaveController.getDataflows',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        describe('with query params', () => {
            testControllerInput(
                {
                    method: 'get',
                    baseUri: WAVE_BASE_URI,
                    basePath: `/dataflows`,
                    queryParams: {
                        q: 'dataflow 3',
                    },
                },
                [
                    'WaveController.getDataflows',
                    {
                        q: 'dataflow 3',
                    },
                    { background: false, hotspot: true, longRunning: false },
                ]
            );
        });

        testResolveResponse(
            {
                method: 'get',
                baseUri: WAVE_BASE_URI,
                basePath: `/dataflows`,
            },
            {}
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

        describe('with query params', () => {
            testControllerInput(
                {
                    method: 'get',
                    baseUri: WAVE_BASE_URI,
                    basePath: `/dataflowjobs`,
                    queryParams: {
                        dataflowId: '02KRM0000002YXg2AM',
                        jobTypes: ['recipe'],
                        licenseType: 'Sonic',
                        page: 'eyJwYWdlU2',
                        pageSize: 10,
                        q: 'rcp 3',
                        startedAfter: '1622752558',
                        startedBefore: '1623450350',
                        status: 'Running',
                    },
                },
                [
                    'WaveController.getDataflowJobs',
                    {
                        dataflowId: '02KRM0000002YXg2AM',
                        jobTypes: ['recipe'],
                        licenseType: 'Sonic',
                        pageParam: 'eyJwYWdlU2',
                        pageSize: 10,
                        q: 'rcp 3',
                        startedAfter: '1622752558',
                        startedBefore: '1623450350',
                        status: 'Running',
                    },
                    { background: false, hotspot: true, longRunning: false },
                ]
            );
        });

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

    describe('post /wave/dataflowjobs', () => {
        testControllerInput(
            {
                method: 'post',
                baseUri: WAVE_BASE_URI,
                basePath: `/dataflowjobs`,
                body: { dataflowJob: { command: 'start', dataflowId: '1234567890ABCDE' } },
            },
            [
                'WaveController.startDataflow',
                { dataflowJob: { command: 'start', dataflowId: '1234567890ABCDE' } },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'post',
                baseUri: WAVE_BASE_URI,
                basePath: `/dataflowjobs`,
                body: { dataflowJob: { command: 'start', dataflowId: '1234567890ABCDE' } },
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

    describe('get /wave/datasets', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: WAVE_BASE_URI,
                basePath: `/datasets`,
            },
            [
                'WaveController.getDatasets',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        describe('with query params', () => {
            testControllerInput(
                {
                    method: 'get',
                    baseUri: WAVE_BASE_URI,
                    basePath: `/datasets`,
                    queryParams: {
                        datasetTypes: ['Default', 'Trended'],
                        folderId: '005xx000001XCD7AAO',
                        includeCurrentVersion: true,
                        licenseType: 'Sonic',
                        page: 'eyJwYWdlU2',
                        pageSize: 10,
                        q: 'opp dataset',
                        scope: 'LastModified',
                    },
                },
                [
                    'WaveController.getDatasets',
                    {
                        datasetTypes: ['Default', 'Trended'],
                        folderId: '005xx000001XCD7AAO',
                        includeCurrentVersion: true,
                        licenseType: 'Sonic',
                        pageParam: 'eyJwYWdlU2',
                        pageSize: 10,
                        q: 'opp dataset',
                        scope: 'LastModified',
                    },
                    { background: false, hotspot: true, longRunning: false },
                ]
            );
        });

        testResolveResponse(
            {
                method: 'get',
                baseUri: WAVE_BASE_URI,
                basePath: `/datasets`,
            },
            {}
        );
    });

    describe('get /wave/datasets/{datasetIdOrApiName}', () => {
        describe('with dataset id', () => {
            testControllerInput(
                {
                    method: 'get',
                    baseUri: WAVE_BASE_URI,
                    basePath: `/datasets/0Fbxx0000004Cx3CAE`,
                },
                [
                    'WaveController.getDataset',
                    {},
                    { background: false, hotspot: true, longRunning: false },
                ]
            );

            testResolveResponse(
                {
                    method: 'get',
                    baseUri: WAVE_BASE_URI,
                    basePath: `/datasets/0Fbxx0000004Cx3CAE`,
                },
                {}
            );
        });

        describe('with dataset name', () => {
            testControllerInput(
                {
                    method: 'get',
                    baseUri: WAVE_BASE_URI,
                    basePath: `/datasets/DTC_Opportunity_SAMPLE`,
                },
                [
                    'WaveController.getDataset',
                    {},
                    { background: false, hotspot: true, longRunning: false },
                ]
            );

            testResolveResponse(
                {
                    method: 'get',
                    baseUri: WAVE_BASE_URI,
                    basePath: `/datasets/DTC_Opportunity_SAMPLE`,
                },
                {}
            );
        });
    });

    describe('delete /wave/datsets/{id}', () => {
        testControllerInput(
            {
                method: 'delete',
                baseUri: WAVE_BASE_URI,
                basePath: `/datasets/05vRM00000003rZYAQ`,
                urlParams: {
                    datasetIdOrApiName: '05vRM00000003rZYAQ',
                },
            },
            [
                'WaveController.deleteDataset',
                {
                    datasetIdOrApiName: '05vRM00000003rZYAQ',
                },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testRejectFetchResponse({
            method: 'delete',
            baseUri: WAVE_BASE_URI,
            basePath: `/datasets/05vRM00000003rZYAQ`,
            urlParams: {
                datasetIdOrApiName: '05vRM00000003rZYAQ',
            },
        });

        testResolveResponse(
            {
                method: 'delete',
                baseUri: WAVE_BASE_URI,
                basePath: `/datasets/05vRM00000003rZYAQ`,
                urlParams: {
                    datasetIdOrApiName: '05vRM00000003rZYAQ',
                },
            },
            null
        );
    });

    describe('get /wave/datasets/{datasetIdOrApiName}/versions/{versionId}/xmds/{xmdType}', () => {
        describe('with dataset id', () => {
            testControllerInput(
                {
                    method: 'get',
                    baseUri: WAVE_BASE_URI,
                    basePath: `/datasets/0Fbxx0000004CyeCAE/versions/0Fcxx0000004CsCCAU/xmds/Asset`,
                },
                [
                    'WaveController.getXmd',
                    {},
                    { background: false, hotspot: true, longRunning: false },
                ]
            );

            testResolveResponse(
                {
                    method: 'get',
                    baseUri: WAVE_BASE_URI,
                    basePath: `/datasets/0Fbxx0000004CyeCAE/versions/0Fcxx0000004CsCCAU/xmds/Main`,
                },
                {}
            );
        });
        describe('with dataset name', () => {
            testControllerInput(
                {
                    method: 'get',
                    baseUri: WAVE_BASE_URI,
                    basePath: `/datasets/ABCWidgetSales2017/versions/0Fcxx0000004CsCCAU/xmds/System`,
                },
                [
                    'WaveController.getXmd',
                    {},
                    { background: false, hotspot: true, longRunning: false },
                ]
            );

            testResolveResponse(
                {
                    method: 'get',
                    baseUri: WAVE_BASE_URI,
                    basePath: `/datasets/ABCWidgetSales2017/versions/0Fcxx0000004CsCCAU/xmds/User`,
                },
                {}
            );
        });
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

    describe('post /wave/query', () => {
        testControllerInput(
            {
                method: 'post',
                baseUri: WAVE_BASE_URI,
                basePath: '/query',
                body: { query: { query: '', queryLanguage: 'Saql' } },
            },
            [
                'WaveController.executeQueryByInputRep',
                { query: { query: '', queryLanguage: 'Saql' } },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testRejectFetchResponse({
            method: 'post',
            baseUri: WAVE_BASE_URI,
            basePath: '/query',
        });

        testResolveResponse(
            {
                method: 'post',
                baseUri: WAVE_BASE_URI,
                basePath: '/query',
                body: { query: { query: '', queryLanguage: 'Sql' } },
            },
            {}
        );
    });

    describe('get /wave/recipes', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: WAVE_BASE_URI,
                basePath: `/recipes`,
            },
            [
                'WaveController.getRecipes',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        describe('with query params', () => {
            testControllerInput(
                {
                    method: 'get',
                    baseUri: WAVE_BASE_URI,
                    basePath: `/recipes`,
                    queryParams: {
                        format: 'R3',
                        licenseType: 'Sonic',
                        page: 'eyJwYWdlU2',
                        pageSize: 10,
                        q: 'rcp 3',
                        sort: 'Name',
                    },
                },
                [
                    'WaveController.getRecipes',
                    {
                        format: 'R3',
                        licenseType: 'Sonic',
                        pageParam: 'eyJwYWdlU2',
                        pageSize: 10,
                        q: 'rcp 3',
                        sortParam: 'Name',
                    },
                    { background: false, hotspot: true, longRunning: false },
                ]
            );
        });

        testRejectFetchResponse({
            method: 'get',
            baseUri: WAVE_BASE_URI,
            basePath: `/recipes`,
        });

        testResolveResponse(
            {
                method: 'get',
                baseUri: WAVE_BASE_URI,
                basePath: `/recipes`,
            },
            {}
        );
    });

    describe('get /wave/recipes/{id}', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: WAVE_BASE_URI,
                basePath: `/recipes/05vRM00000003rZYAQ`,
                urlParams: {
                    id: '05vRM00000003rZYAQ',
                },
                queryParams: {
                    format: 'R3',
                },
            },
            [
                'WaveController.getRecipe',
                {
                    format: 'R3',
                    id: '05vRM00000003rZYAQ',
                },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testRejectFetchResponse({
            method: 'get',
            baseUri: WAVE_BASE_URI,
            basePath: `/recipes/05vRM00000003rZYAQ`,
            urlParams: {
                id: '05vRM00000003rZYAQ',
            },
        });

        testResolveResponse(
            {
                method: 'get',
                baseUri: WAVE_BASE_URI,
                basePath: `/recipes/05vRM00000003rZYAQ`,
                urlParams: {
                    id: '05vRM00000003rZYAQ',
                },
            },
            {}
        );
    });

    describe('delete /wave/recipes/{id}', () => {
        testControllerInput(
            {
                method: 'delete',
                baseUri: WAVE_BASE_URI,
                basePath: `/recipes/05vRM00000003rZYAQ`,
                urlParams: {
                    id: '05vRM00000003rZYAQ',
                },
            },
            [
                'WaveController.deleteRecipe',
                {
                    id: '05vRM00000003rZYAQ',
                },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testRejectFetchResponse({
            method: 'delete',
            baseUri: WAVE_BASE_URI,
            basePath: `/recipes/05vRM00000003rZYAQ`,
            urlParams: {
                id: '05vRM00000003rZYAQ',
            },
        });

        testResolveResponse(
            {
                method: 'delete',
                baseUri: WAVE_BASE_URI,
                basePath: `/recipes/05vRM00000003rZYAQ`,
                urlParams: {
                    id: '05vRM00000003rZYAQ',
                },
            },
            null
        );
    });

    describe('patch /wave/recipes/{id}', () => {
        testControllerInput(
            {
                method: 'patch',
                baseUri: WAVE_BASE_URI,
                basePath: `/recipes/05vRM00000003rZYAQ`,
                urlParams: {
                    id: '05vRM00000003rZYAQ',
                },
            },
            [
                'WaveController.updateRecipe',
                {
                    id: '05vRM00000003rZYAQ',
                },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testRejectFetchResponse({
            method: 'patch',
            baseUri: WAVE_BASE_URI,
            basePath: `/recipes/05vRM00000003rZYAQ`,
            urlParams: {
                id: '05vRM00000003rZYAQ',
            },
        });

        testResolveResponse(
            {
                method: 'patch',
                baseUri: WAVE_BASE_URI,
                basePath: `/recipes/05vRM00000003rZYAQ`,
                urlParams: {
                    id: '05vRM00000003rZYAQ',
                },
            },
            null
        );
    });

    describe('get /wave/recipes/{id}/notification', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: WAVE_BASE_URI,
                basePath: `/recipes/05vRM00000003rZYAQ/notification`,
                urlParams: {
                    id: '05vRM00000003rZYAQ',
                },
            },
            [
                'WaveController.getRecipeNotification',
                {
                    id: '05vRM00000003rZYAQ',
                },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testRejectFetchResponse({
            method: 'get',
            baseUri: WAVE_BASE_URI,
            basePath: `/recipes/05vRM00000003rZYAQ/notification`,
            urlParams: {
                id: '05vRM00000003rZYAQ',
            },
        });

        testResolveResponse(
            {
                method: 'get',
                baseUri: WAVE_BASE_URI,
                basePath: `/recipes/05vRM00000003rZYAQ/notification`,
                urlParams: {
                    id: '05vRM00000003rZYAQ',
                },
            },
            {}
        );
    });

    describe('put /wave/recipes/{id}/notification', () => {
        testControllerInput(
            {
                method: 'put',
                baseUri: WAVE_BASE_URI,
                basePath: `/recipes/05vRM00000003rZYAQ/notification`,
                urlParams: {
                    id: '05vRM00000003rZYAQ',
                },
            },
            [
                'WaveController.updateRecipeNotification',
                {
                    id: '05vRM00000003rZYAQ',
                },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testRejectFetchResponse({
            method: 'put',
            baseUri: WAVE_BASE_URI,
            basePath: `/recipes/05vRM00000003rZYAQ/notification`,
            urlParams: {
                id: '05vRM00000003rZYAQ',
            },
        });

        testResolveResponse(
            {
                method: 'put',
                baseUri: WAVE_BASE_URI,
                basePath: `/recipes/05vRM00000003rZYAQ/notification`,
                urlParams: {
                    id: '05vRM00000003rZYAQ',
                },
            },
            {}
        );
    });

    describe('get /wave/replicatedDatasets', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: WAVE_BASE_URI,
                basePath: `/replicatedDatasets`,
            },
            [
                'WaveController.getReplicatedDatasets',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        describe('with query params', () => {
            testControllerInput(
                {
                    method: 'get',
                    baseUri: WAVE_BASE_URI,
                    basePath: `/replicatedDatasets`,
                    queryParams: {
                        category: 'Input',
                        connector: 'SFDC_LOCAL',
                        q: 'Oppor',
                        sourceObject: 'Opportunity',
                    },
                },
                [
                    'WaveController.getReplicatedDatasets',
                    {
                        category: 'Input',
                        connector: 'SFDC_LOCAL',
                        q: 'Oppor',
                        sourceObject: 'Opportunity',
                    },
                    { background: false, hotspot: true, longRunning: false },
                ]
            );
        });

        testRejectFetchResponse({
            method: 'get',
            baseUri: WAVE_BASE_URI,
            basePath: `/replicatedDatasets`,
        });

        testResolveResponse(
            {
                method: 'get',
                baseUri: WAVE_BASE_URI,
                basePath: `/replicatedDatasets`,
            },
            {}
        );
    });

    describe('post /wave/replicatedDatasets', () => {
        testControllerInput(
            {
                method: 'post',
                baseUri: WAVE_BASE_URI,
                basePath: `/replicatedDatasets`,
                body: {
                    replicatedDataset: {
                        connectorId: '0ItS700000001YxKAI',
                        sourceObjectName: 'Account',
                    },
                },
            },
            [
                'WaveController.createReplicatedDataset',
                {
                    replicatedDataset: {
                        connectorId: '0ItS700000001YxKAI',
                        sourceObjectName: 'Account',
                    },
                },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'post',
                baseUri: WAVE_BASE_URI,
                basePath: `/replicatedDatasets`,
                body: {
                    replicatedDataset: {
                        connectorId: '0ItS700000001YxKAI',
                        sourceObjectName: 'Account',
                    },
                },
            },
            {}
        );
    });

    describe('get /wave/replicatedDatasets/{id}', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: WAVE_BASE_URI,
                basePath: `/replicatedDatasets/0IuS70000004CqIKAU`,
            },
            [
                'WaveController.getReplicatedDataset',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'get',
                baseUri: WAVE_BASE_URI,
                basePath: `/replicatedDatasets/0IuS70000004CqIKAU`,
            },
            {}
        );
    });

    describe('patch /wave/replicatedDatasets/{id}', () => {
        testControllerInput(
            {
                method: 'patch',
                baseUri: WAVE_BASE_URI,
                basePath: `/replicatedDatasets/0IuS70000004CqIKAU`,
                body: { replicatedDataset: { connectionMode: 'Full' } },
            },
            [
                'WaveController.updateReplicatedDataset',
                { replicatedDataset: { connectionMode: 'Full' } },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'patch',
                baseUri: WAVE_BASE_URI,
                basePath: `/replicatedDatasets/0IuS70000004CqIKAU`,
                body: { replicatedDataset: { connectionMode: 'Full' } },
            },
            {}
        );
    });

    describe('delete /wave/replicatedDatasets/{id}', () => {
        testControllerInput(
            {
                method: 'delete',
                baseUri: WAVE_BASE_URI,
                basePath: `/replicatedDatasets/0IuS70000004CqIKAU`,
                urlParams: {
                    id: '0IuS70000004CqIKAU',
                },
            },
            [
                'WaveController.deleteReplicatedDataset',
                {
                    id: '0IuS70000004CqIKAU',
                },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testRejectFetchResponse({
            method: 'delete',
            baseUri: WAVE_BASE_URI,
            basePath: `/replicatedDatasets/0IuS70000004CqIKAU`,
            urlParams: {
                id: '0IuS70000004CqIKAU',
            },
        });

        testResolveResponse(
            {
                method: 'delete',
                baseUri: WAVE_BASE_URI,
                basePath: `/replicatedDatasets/0IuS70000004CqIKAU`,
                urlParams: {
                    id: '0IuS70000004CqIKAU',
                },
            },
            null
        );
    });

    describe('get /wave/replicatedDatasets/{id}/fields', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: WAVE_BASE_URI,
                basePath: `/replicatedDatasets/0IuS70000004CqXKAU/fields`,
            },
            [
                'WaveController.getReplicatedFields',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'get',
                baseUri: WAVE_BASE_URI,
                basePath: `/replicatedDatasets/0IuS70000004CqXKAU/fields`,
            },
            {}
        );
    });

    describe('patch /wave/replicatedDatasets/{id}/fields', () => {
        testControllerInput(
            {
                method: 'patch',
                baseUri: WAVE_BASE_URI,
                basePath: `/replicatedDatasets/0IuS70000004CqXKAU/fields`,
                body: {
                    replicatedFields: {
                        fields: [
                            { fieldType: 'text', label: 'Id', name: 'Id', skipped: 'false' },
                            { fieldType: 'text', label: 'Name', name: 'Name', skipped: 'false' },
                        ],
                    },
                },
            },
            [
                'WaveController.updateReplicatedFields',
                {
                    replicatedFields: {
                        fields: [
                            { fieldType: 'text', label: 'Id', name: 'Id', skipped: 'false' },
                            { fieldType: 'text', label: 'Name', name: 'Name', skipped: 'false' },
                        ],
                    },
                },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'patch',
                baseUri: WAVE_BASE_URI,
                basePath: `/replicatedDatasets/0IuS70000004CqXKAU/fields`,
                body: {
                    replicatedFields: {
                        fields: [
                            { fieldType: 'text', label: 'Id', name: 'Id', skipped: 'false' },
                            { fieldType: 'text', label: 'Name', name: 'Name', skipped: 'false' },
                        ],
                    },
                },
            },
            {}
        );
    });

    describe('get /asset/{assetId}/schedule', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: WAVE_BASE_URI,
                basePath: `/asset/05vRM00000003rZYAQ/schedule`,
            },
            [
                'WaveController.getSchedule',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testRejectFetchResponse({
            method: 'get',
            baseUri: WAVE_BASE_URI,
            basePath: `/asset/05vRM00000003rZYAQ/schedule`,
        });

        testResolveResponse(
            {
                method: 'get',
                baseUri: WAVE_BASE_URI,
                basePath: `/asset/05vRM00000003rZYAQ/schedule`,
            },
            {}
        );
    });

    describe('put /asset/{assetId}/schedule', () => {
        testControllerInput(
            {
                method: 'put',
                baseUri: WAVE_BASE_URI,
                basePath: `/asset/05vRM00000003rZYAQ/schedule`,
                body: {
                    schedule: {
                        frequency: 'monthly',
                        daysOfMonth: [1, 4, 8, 16, 30],
                        time: { hour: 0, minute: 15, timeZone: 'America/Los_Angeles' },
                    },
                },
            },
            [
                'WaveController.updateSchedule',
                {
                    schedule: {
                        frequency: 'monthly',
                        daysOfMonth: [1, 4, 8, 16, 30],
                        time: { hour: 0, minute: 15, timeZone: 'America/Los_Angeles' },
                    },
                },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'put',
                baseUri: WAVE_BASE_URI,
                basePath: `/asset/05vRM00000003rZYAQ/schedule`,
                body: {
                    schedule: {
                        frequency: 'monthly',
                        daysOfMonth: [1, 4, 8, 16, 30],
                        time: { hour: 0, minute: 15, timeZone: 'America/Los_Angeles' },
                    },
                },
            },
            {}
        );
    });

    describe('get /wave/folders', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: WAVE_BASE_URI,
                basePath: `/folders`,
            },
            [
                'WaveController.getWaveFolders',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        describe('with query params', () => {
            testControllerInput(
                {
                    method: 'get',
                    baseUri: WAVE_BASE_URI,
                    basePath: `/folders`,
                    queryParams: {
                        templateSourceId: '123456ABCDEF',
                        page: 'eyJwYWdlU2',
                        pageSize: 10,
                        q: 'Shared',
                        sort: 'Name',
                        isPinned: 'false',
                        scope: 'CREATED',
                        mobileOnlyFeaturedAssets: 'false',
                    },
                },
                [
                    'WaveController.getWaveFolders',
                    {
                        templateSourceId: '123456ABCDEF',
                        pageParam: 'eyJwYWdlU2',
                        pageSize: 10,
                        q: 'Shared',
                        sortParam: 'Name',
                        isPinned: 'false',
                        scope: 'CREATED',
                        mobileOnlyFeaturedAssets: 'false',
                    },
                    { background: false, hotspot: true, longRunning: false },
                ]
            );
        });

        testRejectFetchResponse({
            method: 'get',
            baseUri: WAVE_BASE_URI,
            basePath: `/folders`,
        });

        testResolveResponse(
            {
                method: 'get',
                baseUri: WAVE_BASE_URI,
                basePath: `/folders`,
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

    describe('get /connect/communities/{communityId}/managed-content/delivery', () => {
        testControllerInput(
            {
                baseUri: CONNECT_BASE_URI,
                basePath: `/communities/1234567890ABCDE/managed-content/delivery`,
            },
            [
                'ManagedContentController.getManagedContentByTopicsAndContentKeys',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testRejectFetchResponse({
            baseUri: CONNECT_BASE_URI,
            basePath: `/communities/1234567890ABCDE/managed-content/delivery`,
        });

        testResolveResponse(
            {
                baseUri: CONNECT_BASE_URI,
                basePath: `/communities/1234567890ABCDE/managed-content/delivery`,
            },
            {}
        );
    });

    describe('get /connect/sites/{siteId}/cms/delivery/collections/{collectionKeyOrId}/metadata', () => {
        testControllerInput(
            {
                baseUri: CONNECT_BASE_URI,
                basePath: `/sites/0DMT300000000idOAA/cms/delivery/collections/MC3XKWIYJC2JHUDDJB3LKZHG4ICM/metadata`,
            },
            [
                'ManagedContentDeliveryController.getCollectionMetadataForSite',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testRejectFetchResponse({
            baseUri: CONNECT_BASE_URI,
            basePath: `/sites/0DMT300000000idOAA/cms/delivery/collections/MC3XKWIYJC2JHUDDJB3LKZHG4ICM/metadata`,
        });

        testResolveResponse(
            {
                baseUri: CONNECT_BASE_URI,
                basePath: `/sites/0DMT300000000idOAA/cms/delivery/collections/MC3XKWIYJC2JHUDDJB3LKZHG4ICM/metadata`,
            },
            {}
        );
    });

    describe('get /connect/sites/{siteId}/cms/delivery/collections/{collectionKeyOrId}', () => {
        testControllerInput(
            {
                baseUri: CONNECT_BASE_URI,
                basePath: `/sites/0DMT300000000idOAA/cms/delivery/collections/MC3XKWIYJC2JHUDDJB3LKZHG4ICM`,
            },
            [
                'ManagedContentDeliveryController.getCollectionItemsForSite',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testRejectFetchResponse({
            baseUri: CONNECT_BASE_URI,
            basePath: `/sites/0DMT300000000idOAA/cms/delivery/collections/MC3XKWIYJC2JHUDDJB3LKZHG4ICM`,
        });

        testResolveResponse(
            {
                baseUri: CONNECT_BASE_URI,
                basePath: `/sites/0DMT300000000idOAA/cms/delivery/collections/MC3XKWIYJC2JHUDDJB3LKZHG4ICM`,
            },
            {}
        );
    });

    describe('get /connect/cms/delivery/channels/{channelId}/collections/{collectionKeyOrId}/metadata', () => {
        testControllerInput(
            {
                baseUri: CONNECT_BASE_URI,
                basePath: `/cms/delivery/channels/0apT300000000HLIAY/collections/MC3XKWIYJC2JHUDDJB3LKZHG4ICM/metadata`,
            },
            [
                'ManagedContentDeliveryController.getCollectionMetadataForChannel',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testRejectFetchResponse({
            baseUri: CONNECT_BASE_URI,
            basePath: `/cms/delivery/channels/0apT300000000HLIAY/collections/MC3XKWIYJC2JHUDDJB3LKZHG4ICM/metadata`,
        });

        testResolveResponse(
            {
                baseUri: CONNECT_BASE_URI,
                basePath: `/cms/delivery/channels/0apT300000000HLIAY/collections/MC3XKWIYJC2JHUDDJB3LKZHG4ICM/metadata`,
            },
            {}
        );
    });

    describe('get /connect/cms/delivery/channels/{channelId}/collections/{collectionKeyOrId}', () => {
        testControllerInput(
            {
                baseUri: CONNECT_BASE_URI,
                basePath: `/cms/delivery/channels/0apT300000000HLIAY/collections/MC3XKWIYJC2JHUDDJB3LKZHG4ICM`,
            },
            [
                'ManagedContentDeliveryController.getCollectionItemsForChannel',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testRejectFetchResponse({
            baseUri: CONNECT_BASE_URI,
            basePath: `/cms/delivery/channels/0apT300000000HLIAY/collections/MC3XKWIYJC2JHUDDJB3LKZHG4ICM`,
        });

        testResolveResponse(
            {
                baseUri: CONNECT_BASE_URI,
                basePath: `/cms/delivery/channels/0apT300000000HLIAY/collections/MC3XKWIYJC2JHUDDJB3LKZHG4ICM`,
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

    describe('get /connect/cms/content-types/{contentTypeFQN}', () => {
        testControllerInput(
            {
                baseUri: CONNECT_BASE_URI,
                basePath: `/cms/content-types/news`,
            },
            [
                'ManagedContentTypeController.getContentTypeSchema',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testRejectFetchResponse({
            baseUri: CONNECT_BASE_URI,
            basePath: `/cms/content-types/news`,
        });

        testResolveResponse(
            {
                baseUri: CONNECT_BASE_URI,
                basePath: `/cms/content-types/news`,
            },
            {}
        );
    });

    describe('get /connect/cms/contents/{contentKeyOrId}', () => {
        testControllerInput(
            {
                baseUri: CMS_BASE_URI,
                basePath: `/contents/MCMOEXXY57SNBAJID2SYYWJO45LM`,
                urlParams: {
                    contentKeyOrId: 'MCMOEXXY57SNBAJID2SYYWJO45LM',
                },
                queryParams: {
                    version: '5OUxx0000004DMqGAM',
                    language: 'en_US',
                },
            },
            [
                'ManagedContentController.getManagedContent',
                {
                    contentKeyOrId: 'MCMOEXXY57SNBAJID2SYYWJO45LM',
                    version: '5OUxx0000004DMqGAM',
                    language: 'en_US',
                },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testRejectFetchResponse({
            baseUri: CMS_BASE_URI,
            basePath: `/contents/MCMOEXXY57SNBAJID2SYYWJO45LM`,
            queryParams: {
                version: '5OUxx0000004DMqGAM',
                language: 'en_US',
            },
        });

        testResolveResponse(
            {
                baseUri: CMS_BASE_URI,
                basePath: `/contents/MCMOEXXY57SNBAJID2SYYWJO45LM`,
                queryParams: {
                    version: '5OUxx0000004DMqGAM',
                    language: 'en_US',
                },
            },
            {}
        );
    });

    describe('get /connect/cms/contents/variants/{managedContentVariantId}', () => {
        testControllerInput(
            {
                baseUri: CONNECT_BASE_URI,
                basePath: `/cms/contents/variants/9Psxx0000004CKKCA2`,
            },
            [
                'ManagedContentController.getManagedContentVariant',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testRejectFetchResponse({
            baseUri: CONNECT_BASE_URI,
            basePath: `/cms/contents/variants/9Psxx0000004CKKCA2`,
        });

        testResolveResponse(
            {
                baseUri: CONNECT_BASE_URI,
                basePath: `/cms/contents/variants/9Psxx0000004CKKCA2`,
            },
            {}
        );
    });

    describe('get /connect/cms/folders/{folderId}/items', () => {
        testControllerInput(
            {
                baseUri: CONNECT_BASE_URI,
                basePath: `/cms/folders/9PuRM00000003B60AI/items`,
            },
            [
                'ManagedContentController.getManagedContentSpaceFolderItems',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testRejectFetchResponse({
            baseUri: CONNECT_BASE_URI,
            basePath: `/cms/folders/9PuRM00000003B60AI/items`,
        });

        testResolveResponse(
            {
                baseUri: CONNECT_BASE_URI,
                basePath: `/cms/folders/9PuRM00000003B60AI/items`,
            },
            {}
        );
    });

    describe('put /connect/cms/contents/variants/{variantId}', () => {
        testControllerInput(
            {
                method: 'put',
                baseUri: CONNECT_BASE_URI,
                basePath: `/cms/contents/variants/9Psxx0000004DwKCAU`,
                body: {
                    variantId: '9Psxx0000004DwKCAU',
                    ManagedContentVariantInputParam: {
                        title: 'hello authoring 2.0',
                        urlName: 'testurl',
                        contentBody: {
                            title: 'hello authoring 2.0',
                            body: 'test body',
                            excerpt: 'test excerpt',
                        },
                    },
                },
            },
            [
                'ManagedContentController.replaceManagedContentVariant',
                {
                    variantId: '9Psxx0000004DwKCAU',
                    ManagedContentVariantInputParam: {
                        title: 'hello authoring 2.0',
                        urlName: 'testurl',
                        contentBody: {
                            title: 'hello authoring 2.0',
                            body: 'test body',
                            excerpt: 'test excerpt',
                        },
                    },
                },
                { background: false, hotspot: true, longRunning: false },
            ],
            {
                contentBody: {
                    title: 'Test authoring 2.0 - 1(update)',
                    body: '<html><body>test body 1</body></html>',
                    excerpt: 'test excerpt  1',
                },
                contentKey: 'MCP5UIGCCS3NHDVLFJFTC47QR5OM',
                contentSpace: {
                    id: '0Zuxx000000009hCAA',
                    resourceUrl: '/services/data/v54.0/connect/cms/spaces/0Zuxx000000009h',
                },
                contentType: {
                    fullyQualifiedName: 'news',
                },
                createdBy: {
                    id: '005xx000001X7fNAAS',
                    resourceUrl: '/services/data/v54.0/chatter/users/005xx000001X7fN',
                },
                createdDate: '2021-06-04T09:21:31.000Z',
                folder: {
                    id: '9Puxx0000004CSOCA2',
                    resourceUrl: '/services/data/v54.0/connect/cms/folders/9Puxx0000004CSO',
                },
                isPublished: false,
                language: 'en_US',
                lastModifiedBy: {
                    id: '005xx000001X7fNAAS',
                    resourceUrl: '/services/data/v54.0/chatter/users/005xx000001X7fN',
                },
                lastModifiedDate: '2021-06-04T11:55:24.000Z',
                managedContentId: '20Yxx0000011SooEAE',
                managedContentVariantId: '9Psxx0000004DwKCAU',
                managedContentVersionId: '5OUxx0000004E60GAE',
                title: 'Test authoring 2.0 - 1(replace)',
                urlName: 'testurl-1-update',
            }
        );
        testRejectFetchResponse({
            method: 'put',
            baseUri: CONNECT_BASE_URI,
            basePath: `/cms/contents/variants/9Psxx0000004DwKCAU`,
        });
        testResolveResponse(
            {
                method: 'put',
                baseUri: CONNECT_BASE_URI,
                basePath: `/cms/contents/variants/9Psxx0000004DwKCAU`,
                body: {
                    variantId: '9Psxx0000004DwKCAU',
                    ManagedContentVariantInputParam: {
                        title: 'hello authoring 2.0',
                        urlName: 'testurl',
                        contentBody: {
                            title: 'hello authoring 2.0',
                            body: 'test body',
                            excerpt: 'test excerpt',
                        },
                    },
                },
            },
            {
                contentBody: {
                    title: 'Test authoring 2.0 - 1(update)',
                    body: '<html><body>test body 1</body></html>',
                    excerpt: 'test excerpt  1',
                },
                contentKey: 'MCP5UIGCCS3NHDVLFJFTC47QR5OM',
                contentSpace: {
                    id: '0Zuxx000000009hCAA',
                    resourceUrl: '/services/data/v54.0/connect/cms/spaces/0Zuxx000000009h',
                },
                contentType: {
                    fullyQualifiedName: 'news',
                },
                createdBy: {
                    id: '005xx000001X7fNAAS',
                    resourceUrl: '/services/data/v54.0/chatter/users/005xx000001X7fN',
                },
                createdDate: '2021-06-04T09:21:31.000Z',
                folder: {
                    id: '9Puxx0000004CSOCA2',
                    resourceUrl: '/services/data/v54.0/connect/cms/folders/9Puxx0000004CSO',
                },
                isPublished: false,
                language: 'en_US',
                lastModifiedBy: {
                    id: '005xx000001X7fNAAS',
                    resourceUrl: '/services/data/v54.0/chatter/users/005xx000001X7fN',
                },
                lastModifiedDate: '2021-06-04T11:55:24.000Z',
                managedContentId: '20Yxx0000011SooEAE',
                managedContentVariantId: '9Psxx0000004DwKCAU',
                managedContentVersionId: '5OUxx0000004E60GAE',
                title: 'Test authoring 2.0 - 1(replace)',
                urlName: 'testurl-1-update',
            }
        );
    });

    describe('get /connect/interaction/orchestration/instances', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: CONNECT_BASE_URI,
                basePath: `/interaction/orchestration/instances`,
                queryParams: {
                    relatedRecordId: '001xx000003GYcFAAW',
                },
            },
            [
                'OrchestrationController.getOrchestrationInstanceCollection',
                { relatedRecordId: '001xx000003GYcFAAW' },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testRejectFetchResponse({
            method: 'get',
            baseUri: CONNECT_BASE_URI,
            basePath: `/interaction/orchestration/instances`,
            queryParams: {
                relatedRecordId: null,
            },
        });

        testResolveResponse(
            {
                method: 'get',
                baseUri: CONNECT_BASE_URI,
                basePath: `/interaction/orchestration/instances`,
                queryParams: {
                    relatedRecordId: '001xx000003GYcFAAW',
                },
            },
            {}
        );
    });

    describe('post /cms/deployments', () => {
        testControllerInput(
            {
                method: 'post',
                baseUri: CMS_NON_CONNECT_BASE_URI,
                basePath: `/deployments`,
                body: {
                    DeploymentInput: {
                        contentSpaceId: '0Zux0000000KykTCAS',
                    },
                },
            },
            [
                'ManagedContentController.createDeployment',
                {
                    DeploymentInput: {
                        contentSpaceId: '0Zux0000000KykTCAS',
                    },
                },
                { background: false, hotspot: true, longRunning: false },
            ],
            {
                createdBy: null,
                deploymentDescription: null,
                deploymentId: '0jkxx00000004d7AAA',
                deploymentItems: [
                    {
                        action: 'Unpublish',
                        deploymentId: '0jkxx00000004d7AAA',
                        deploymentItemId: '0jlxx00000004QDAAY',
                        snapshotId: '5OUxx0000004IeGGAU',
                        targetId: null,
                    },
                ],
                deploymentName: null,
                deploymentStatus: null,
                lastModifiedBy: null,
                scheduledDate: null,
            }
        );
        testRejectFetchResponse({
            method: 'post',
            baseUri: CMS_NON_CONNECT_BASE_URI,
            basePath: `/deployments`,
        });
        testResolveResponse(
            {
                method: 'post',
                baseUri: CMS_NON_CONNECT_BASE_URI,
                basePath: `/deployments`,
                body: {
                    DeploymentInput: {
                        contentSpaceId: '0Zux0000000KykTCAS',
                    },
                },
            },
            {
                createdBy: null,
                deploymentDescription: null,
                deploymentId: '0jkxx00000004d7AAA',
                deploymentItems: [
                    {
                        action: 'Unpublish',
                        deploymentId: '0jkxx00000004d7AAA',
                        deploymentItemId: '0jlxx00000004QDAAY',
                        snapshotId: '5OUxx0000004IeGGAU',
                        targetId: null,
                    },
                ],
                deploymentName: null,
                deploymentStatus: null,
                lastModifiedBy: null,
                scheduledDate: null,
            }
        );
    });

    describe('post /connect/cms/contents', () => {
        testControllerInput(
            {
                method: 'post',
                baseUri: CMS_BASE_URI,
                basePath: `/contents`,
                body: {
                    ManagedContentInputParam: {
                        contentSpaceOrFolderId: '0Zuxx00000001DpCAI',
                        contentType: 'news',
                        title: 'hello authoring 2.0',
                        urlName: 'testurl',
                        contentBody: {
                            title: 'hello authoring 2.0',
                            body: 'test body',
                            excerpt: 'test excerpt',
                        },
                    },
                },
            },
            [
                'ManagedContentController.createManagedContent',
                {
                    ManagedContentInputParam: {
                        contentSpaceOrFolderId: '0Zuxx00000001DpCAI',
                        contentType: 'news',
                        title: 'hello authoring 2.0',
                        urlName: 'testurl',
                        contentBody: {
                            title: 'hello authoring 2.0',
                            body: 'test body',
                            excerpt: 'test excerpt',
                        },
                    },
                },
                { background: false, hotspot: true, longRunning: false },
            ],
            {
                contentBody: {
                    title: 'Test authoring 2.0 - 1',
                    body: '<html><body>test body 1</body></html>',
                    excerpt: 'test excerpt  1',
                },
                contentKey: 'MCFXA42Q4MHNCKXER4YOLK4SE5KQ',
                contentSpace: {
                    id: '0Zuxx000000009hCAA',
                    resourceUrl: '/services/data/v54.0/connect/cms/spaces/0Zuxx000000009hCAA',
                },
                contentType: {
                    fullyQualifiedName: 'news',
                },
                createdBy: {
                    id: '005xx000001X7fNAAS',
                    resourceUrl: '/services/data/v54.0/chatter/users/005xx000001X7fNAAS',
                },
                createdDate: '2021-06-04T09:13:35.000Z',
                folder: {
                    id: '9Puxx0000004CSOCA2',
                    resourceUrl: '/services/data/v54.0/connect/cms/folders/9Puxx0000004CSOCA2',
                },
                isPublished: false,
                language: 'en_US',
                lastModifiedBy: {
                    id: '005xx000001X7fNAAS',
                    resourceUrl: '/services/data/v54.0/chatter/users/005xx000001X7fNAAS',
                },
                lastModifiedDate: '2021-06-04T09:13:35.000Z',
                managedContentId: '20Yxx0000011SjyEAE',
                managedContentVariantId: '9Psxx0000004DrUCAU',
                managedContentVersionId: '5OUxx0000004E1AGAU',
                title: 'Test authoring 2.0 - 1',
                urlName: 'testurl-1',
            }
        );
        testRejectFetchResponse({
            method: 'post',
            baseUri: CMS_BASE_URI,
            basePath: `/contents`,
        });
        testResolveResponse(
            {
                method: 'post',
                baseUri: CMS_BASE_URI,
                basePath: `/contents`,
                body: {
                    ManagedContentInputParam: {
                        contentSpaceOrFolderId: '0Zuxx00000001DpCAI',
                        contentType: 'news',
                        title: 'hello authoring 2.0',
                        urlName: 'testurl',
                        contentBody: {
                            title: 'hello authoring 2.0',
                            body: 'test body',
                            excerpt: 'test excerpt',
                        },
                    },
                },
            },
            {
                contentBody: {
                    title: 'Test authoring 2.0 - 1',
                    body: '<html><body>test body 1</body></html>',
                    excerpt: 'test excerpt  1',
                },
                contentKey: 'MCFXA42Q4MHNCKXER4YOLK4SE5KQ',
                contentSpace: {
                    id: '0Zuxx000000009hCAA',
                    resourceUrl: '/services/data/v54.0/connect/cms/spaces/0Zuxx000000009hCAA',
                },
                contentType: {
                    fullyQualifiedName: 'news',
                },
                createdBy: {
                    id: '005xx000001X7fNAAS',
                    resourceUrl: '/services/data/v54.0/chatter/users/005xx000001X7fNAAS',
                },
                createdDate: '2021-06-04T09:13:35.000Z',
                folder: {
                    id: '9Puxx0000004CSOCA2',
                    resourceUrl: '/services/data/v54.0/connect/cms/folders/9Puxx0000004CSOCA2',
                },
                isPublished: false,
                language: 'en_US',
                lastModifiedBy: {
                    id: '005xx000001X7fNAAS',
                    resourceUrl: '/services/data/v54.0/chatter/users/005xx000001X7fNAAS',
                },
                lastModifiedDate: '2021-06-04T09:13:35.000Z',
                managedContentId: '20Yxx0000011SjyEAE',
                managedContentVariantId: '9Psxx0000004DrUCAU',
                managedContentVersionId: '5OUxx0000004E1AGAU',
                title: 'Test authoring 2.0 - 1',
                urlName: 'testurl-1',
            }
        );
    });

    describe('get /connect/sites/{siteId}/search', () => {
        testControllerInput(
            {
                baseUri: CONNECT_BASE_URI,
                basePath: `/sites/1234567890ABCDE/search`,
            },
            [
                'SitesController.searchSite',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testRejectFetchResponse({
            baseUri: CONNECT_BASE_URI,
            basePath: `/sites/1234567890ABCDE/search`,
        });

        testResolveResponse(
            {
                baseUri: CONNECT_BASE_URI,
                basePath: `/sites/1234567890ABCDE/search`,
            },
            {}
        );
    });

    describe('post /connect/interaction/runtime/startFlow', () => {
        testControllerInput(
            {
                method: 'post',
                baseUri: CONNECT_BASE_URI,
                basePath: `/interaction/runtime/flow1/startFlow`,
                body: {
                    flowVersionId: '123',
                },
            },
            [
                'FlowRuntimeConnectController.startFlow',
                {
                    flowVersionId: '123',
                },
                { background: false, hotspot: true, longRunning: false },
            ],
            {
                error: null,
                response: {
                    interviewStatus: 'STARTED',
                    flowLabel: 'Simple flow',
                    locationName: 'Initial_Screen',
                    showHeader: true,
                    showFooter: true,
                    serializedEncodedState: 'AAAAW=',
                    apiVersionRuntime: 53.0,
                    guid: '244a840a3c94d1a7ff667a103417988905787-7f35',
                    fields: [
                        {
                            isRequired: false,
                            dataType: 'STRING',
                            label: '<p>Some display text</p>',
                            name: 'DisplayText1',
                            triggersUpdate: false,
                            fields: [],
                            fieldType: 'DISPLAY_TEXT',
                        },
                    ],
                    actions: [
                        {
                            id: 'FINISH',
                            label: 'Finish',
                        },
                    ],
                    errors: null,
                },
            }
        );
        testRejectFetchResponse({
            method: 'post',
            baseUri: CONNECT_BASE_URI,
            basePath: `/interaction/runtime/flow1/startFlow`,
        });
        testResolveResponse(
            {
                method: 'post',
                baseUri: CONNECT_BASE_URI,
                basePath: `/interaction/runtime/flow1/startFlow`,
            },
            {}
        );
    });

    describe('post /connect/interaction/runtime/navigateFlow', () => {
        testControllerInput(
            {
                method: 'post',
                baseUri: CONNECT_BASE_URI,
                basePath: `/interaction/runtime/flow1/navigateFlow`,
                body: {
                    action: 'NEXT',
                },
            },
            [
                'FlowRuntimeConnectController.navigateFlow',
                {
                    action: 'NEXT',
                },
                { background: false, hotspot: true, longRunning: false },
            ],
            {
                error: null,
                response: {
                    interviewStatus: 'STARTED',
                    flowLabel: 'Simple flow',
                    locationName: 'Initial_Screen',
                    showHeader: true,
                    showFooter: true,
                    serializedEncodedState: 'AAAAW=',
                    apiVersionRuntime: 53.0,
                    guid: '244a840a3c94d1a7ff667a103417988905787-7f35',
                    fields: [
                        {
                            isRequired: false,
                            dataType: 'STRING',
                            label: '<p>Some display text</p>',
                            name: 'DisplayText1',
                            triggersUpdate: false,
                            fields: [],
                            fieldType: 'DISPLAY_TEXT',
                        },
                    ],
                    actions: [
                        {
                            id: 'FINISH',
                            label: 'Finish',
                        },
                    ],
                    errors: null,
                },
            }
        );
        testRejectFetchResponse({
            method: 'post',
            baseUri: CONNECT_BASE_URI,
            basePath: `/interaction/runtime/flow1/navigateFlow`,
        });
        testResolveResponse(
            {
                method: 'post',
                baseUri: CONNECT_BASE_URI,
                basePath: `/interaction/runtime/flow1/navigateFlow`,
            },
            {}
        );
    });

    describe('post /connect/interaction/runtime/resumeFlow', () => {
        testControllerInput(
            {
                method: 'post',
                baseUri: CONNECT_BASE_URI,
                basePath: `/interaction/runtime/flow1/resumeFlow`,
                body: {
                    pausedInterviewId: '123',
                },
            },
            [
                'FlowRuntimeConnectController.resumeFlow',
                {
                    pausedInterviewId: '123',
                },
                { background: false, hotspot: true, longRunning: false },
            ],
            {
                error: null,
                response: {
                    interviewStatus: 'STARTED',
                    flowLabel: 'Simple flow',
                    locationName: 'Initial_Screen',
                    showHeader: true,
                    showFooter: true,
                    serializedEncodedState: 'AAAAW=',
                    apiVersionRuntime: 53.0,
                    guid: '244a840a3c94d1a7ff667a103417988905787-7f35',
                    fields: [
                        {
                            isRequired: false,
                            dataType: 'STRING',
                            label: '<p>Some display text</p>',
                            name: 'DisplayText1',
                            triggersUpdate: false,
                            fields: [],
                            fieldType: 'DISPLAY_TEXT',
                        },
                    ],
                    actions: [
                        {
                            id: 'FINISH',
                            label: 'Finish',
                        },
                    ],
                    errors: null,
                },
            }
        );
        testRejectFetchResponse({
            method: 'post',
            baseUri: CONNECT_BASE_URI,
            basePath: `/interaction/runtime/flow1/resumeFlow`,
        });
        testResolveResponse(
            {
                method: 'post',
                baseUri: CONNECT_BASE_URI,
                basePath: `/interaction/runtime/flow1/resumeFlow`,
            },
            {}
        );
    });

    describe('post /billing/batch/payments/schedulers', () => {
        testControllerInput(
            {
                method: 'post',
                baseUri: BILLING_BASE_URI,
                basePath: `/batch/payments/schedulers`,
                body: {
                    PaymentsBatchSchedulerInput: {
                        schedulerName: 'Batch Scheduler',
                        startDate: '2021-05-11T05:01:06.000Z',
                        endDate: '2021-05-15T05:01:06.000Z',
                        preferredTime: '10:00 AM',
                        frequencyCadence: 'Monthly',
                        recursEveryMonthOnDay: '28',
                        criteriaExpression: '1 AND 2',
                        status: 'Active',
                        filterCriteria: [
                            {
                                objectName: 'PaymentSchedule',
                                fieldName: 'ReferenceEntityAccount',
                                operation: 'Equals',
                                value: '001xx000003GiznAAC',
                                criteriaSequence: 1,
                            },
                            {
                                objectName: 'PaymentGateway',
                                fieldName: 'Id',
                                operation: 'Equals',
                                value: '0b0xx000000035xAAA',
                                criteriaSequence: 2,
                            },
                        ],
                    },
                },
            },
            [
                'BillingBatchApplicationController.createPaymentsBatchScheduler',
                {
                    PaymentsBatchSchedulerInput: {
                        schedulerName: 'Batch Scheduler',
                        startDate: '2021-05-11T05:01:06.000Z',
                        endDate: '2021-05-15T05:01:06.000Z',
                        preferredTime: '10:00 AM',
                        frequencyCadence: 'Monthly',
                        recursEveryMonthOnDay: '28',
                        criteriaExpression: '1 AND 2',
                        status: 'Active',
                        filterCriteria: [
                            {
                                objectName: 'PaymentSchedule',
                                fieldName: 'ReferenceEntityAccount',
                                operation: 'Equals',
                                value: '001xx000003GiznAAC',
                                criteriaSequence: 1,
                            },
                            {
                                objectName: 'PaymentGateway',
                                fieldName: 'Id',
                                operation: 'Equals',
                                value: '0b0xx000000035xAAA',
                                criteriaSequence: 2,
                            },
                        ],
                    },
                },
                { background: false, hotspot: true, longRunning: false },
            ],
            {
                schedulerDetails: {
                    billingBatchFilterCriteriaId: ['5BCR000000000K2OAI', '5BCR000000000KCOAY'],
                    billingBatchSchedulerId: '5BSR00000000030OAA',
                },
                paymentBatchRunCriteriaId: '5PCR000000000HvOAI',
            }
        );

        testRejectFetchResponse({
            method: 'post',
            baseUri: BILLING_BASE_URI,
            basePath: `/batch/payments/schedulers`,
        });

        testResolveResponse(
            {
                method: 'post',
                baseUri: BILLING_BASE_URI,
                basePath: `/batch/payments/schedulers`,
            },
            {
                schedulerDetails: {
                    billingBatchFilterCriteriaId: ['5BCR000000000K2OAI', '5BCR000000000KCOAY'],
                    billingBatchSchedulerId: '5BSR00000000030OAA',
                },
                paymentBatchRunCriteriaId: '5PCR000000000HvOAI',
            }
        );
    });

    describe('get /sites/{siteId}/marketing-integration/forms/{formId}', () => {
        testControllerInput(
            {
                baseUri: SITES_BASE_URI,
                basePath: `/0DM000000000000000/marketing-integration/forms/8Cm000000000000000`,
            },
            [
                'MarketingIntegrationController.getForm',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testRejectFetchResponse({
            baseUri: SITES_BASE_URI,
            basePath: `/0DM000000000000000/marketing-integration/forms/8Cm000000000000000`,
        });

        testResolveResponse(
            {
                baseUri: SITES_BASE_URI,
                basePath: `/0DM000000000000000/marketing-integration/forms/8Cm000000000000000`,
            },
            {}
        );
    });

    describe('post /sites/{siteId}/marketing-integration/forms', () => {
        testControllerInput(
            {
                method: 'post',
                baseUri: SITES_BASE_URI,
                basePath: `/0DM000000000000000/marketing-integration/forms`,
            },
            [
                'MarketingIntegrationController.saveForm',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testRejectFetchResponse({
            method: 'post',
            baseUri: SITES_BASE_URI,
            basePath: `/0DM000000000000000/marketing-integration/forms`,
        });

        testResolveResponse(
            {
                method: 'post',
                baseUri: SITES_BASE_URI,
                basePath: `/0DM000000000000000/marketing-integration/forms`,
            },
            {}
        );
    });

    describe('post /sites/{siteId}/marketing-integration/forms/{formId}/data', () => {
        testControllerInput(
            {
                method: 'post',
                baseUri: SITES_BASE_URI,
                basePath: `/0DM000000000000000/marketing-integration/forms/8Cm000000000000000/data`,
            },
            [
                'MarketingIntegrationController.submitForm',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testRejectFetchResponse({
            method: 'post',
            baseUri: SITES_BASE_URI,
            basePath: `/0DM000000000000000/marketing-integration/forms/8Cm000000000000000/data`,
        });

        testResolveResponse(
            {
                method: 'post',
                baseUri: SITES_BASE_URI,
                basePath: `/0DM000000000000000/marketing-integration/forms/8Cm000000000000000/data`,
            },
            {}
        );
    });

    describe('post /connect/health/video-visits/chime-meeting', () => {
        testControllerInput(
            {
                method: 'post',
                baseUri: CONNECT_BASE_URI,
                basePath: `/health/video-visits/chime-meeting`,
                body: {
                    JoinChimeMeetingInput: {
                        externalMeetingId: '1234',
                        region: 'us-west-2',
                    },
                },
            },
            [
                'VideoVisitController.chimeMeeting',
                {
                    JoinChimeMeetingInput: {
                        externalMeetingId: '1234',
                        region: 'us-west-2',
                    },
                },
                { background: false, hotspot: true, longRunning: false },
            ],
            {
                isSuccess: true,
            }
        );

        testRejectFetchResponse({
            method: 'post',
            baseUri: CONNECT_BASE_URI,
            basePath: `/health/video-visits/chime-meeting`,
        });

        testResolveResponse(
            {
                method: 'post',
                baseUri: CONNECT_BASE_URI,
                basePath: `/health/video-visits/chime-meeting`,
            },
            {
                isSuccess: true,
            }
        );
    });

    describe('get /interest-tags/assignments/entity/${recordId}', () => {
        testControllerInput(
            {
                baseUri: CONNECT_BASE_URI,
                basePath: `/interest-tags/assignments/entity/Record1`,
            },
            [
                'InterestTaggingFamilyController.getTagsByRecordId',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'get',
                baseUri: CONNECT_BASE_URI,
                basePath: `/interest-tags/assignments/entity/Record1`,
            },
            {}
        );
    });

    describe('get /interest-tags/assignments/tag/${tagId}', () => {
        testControllerInput(
            {
                baseUri: CONNECT_BASE_URI,
                basePath: `/interest-tags/assignments/tag/0qOxx0000004C93EAE`,
            },
            [
                'InterestTaggingFamilyController.getInterestTagEntityAssignments',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'get',
                baseUri: CONNECT_BASE_URI,
                basePath: `/interest-tags/assignments/tag/0qOxx0000004C93EAE`,
            },
            {}
        );
    });

    describe('get /interest-tags/tags', () => {
        testControllerInput(
            {
                baseUri: CONNECT_BASE_URI,
                basePath: `/interest-tags/tags`,
            },
            [
                'InterestTaggingFamilyController.getTagsByCategoryId',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'get',
                baseUri: CONNECT_BASE_URI,
                basePath: `/interest-tags/tags`,
            },
            {}
        );
    });

    describe('get /interest-tags/catogories', () => {
        testControllerInput(
            {
                baseUri: CONNECT_BASE_URI,
                basePath: `/interest-tags/catogories`,
            },
            [
                'InterestTaggingFamilyController.getTagCategoriesByTagId',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'get',
                baseUri: CONNECT_BASE_URI,
                basePath: `/interest-tags/catogories`,
            },
            {}
        );
    });

    describe('post /connect/communities/{communityId}/microbatching', () => {
        testControllerInput(
            {
                method: 'post',
                baseUri: CONNECT_BASE_URI,
                basePath: `/communities/1234567890ABCDE/microbatching`,
            },
            [
                'CommunitiesController.ingestRecord',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testRejectFetchResponse({
            method: 'post',
            baseUri: CONNECT_BASE_URI,
            basePath: `/communities/1234567890ABCDE/microbatching`,
        });

        testResolveResponse(
            {
                method: 'post',
                baseUri: CONNECT_BASE_URI,
                basePath: `/communities/1234567890ABCDE/microbatching`,
            },
            {}
        );
    });

    describe('get /contacts-interactions', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: CIB_BASE_URI,
                basePath: `/contacts-interactions`,
                queryParams: {
                    systemContext: false,
                    contactIds: ['003R000000T3K4EIAV', '003R000000T3K49IAF'],
                    relatedRecordId: '0lsR00000000014IAA',
                },
            },
            [
                'CibController.getContactsInteractions',
                {
                    systemContext: false,
                    contactIds: ['003R000000T3K4EIAV', '003R000000T3K49IAF'],
                    relatedRecordId: '0lsR00000000014IAA',
                },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testRejectFetchResponse({
            method: 'get',
            baseUri: CIB_BASE_URI,
            basePath: `/contacts-interactions`,
        });

        testResolveResponse(
            {
                method: 'get',
                baseUri: CIB_BASE_URI,
                basePath: `/contacts-interactions`,
            },
            {}
        );
    });

    describe('get /interaction-insights/{accountId}', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: CIB_BASE_URI,
                basePath: `/interaction-insights/001D2000001VFYCIA4`,
                queryParams: {
                    systemConext: false,
                    showACR: false,
                    limit: 10,
                    offset: 0,
                    isDirectContacts: false,
                },
            },
            [
                'CibController.getInteractionInsights',
                {
                    systemConext: false,
                    showACR: false,
                    limit: 10,
                    offset: 0,
                    isDirectContacts: false,
                },
                { background: false, hotspot: true, longRunning: false },
            ]
        );
        testRejectFetchResponse({
            method: 'get',
            baseUri: CIB_BASE_URI,
            basePath: `/interaction-insights/001D2000001VFYCIA4`,
        });

        testResolveResponse(
            {
                method: 'get',
                baseUri: CIB_BASE_URI,
                basePath: `/interaction-insights/001D2000001VFYCIA4`,
            },
            {}
        );
    });

    describe('get /deal-parties/{financialDealId}', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: CIB_BASE_URI,
                basePath: `/deal-parties/0lsR00000000014IAA`,
                queryParams: {
                    partyRoles: ['Competitor', 'Partner'],
                },
            },
            [
                'CibController.getDealParties',
                {
                    partyRoles: ['Competitor', 'Partner'],
                },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testRejectFetchResponse({
            method: 'get',
            baseUri: CIB_BASE_URI,
            basePath: `/deal-parties/0lsR00000000014IAA`,
        });

        testResolveResponse(
            {
                method: 'get',
                baseUri: CIB_BASE_URI,
                basePath: `/deal-parties/0lsR00000000014IAA`,
            },
            {}
        );
    });

    describe('get /analytics/data-service/sync/connectors', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: ADATS_SYNC_BASE_URI,
                basePath: `/connectors`,
            },
            [
                'AdatsController.getConnectors',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'get',
                baseUri: ADATS_SYNC_BASE_URI,
                basePath: `/connectors`,
            },
            {}
        );
    });

    describe('get /analytics/data-service/sync/connections', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: ADATS_SYNC_BASE_URI,
                basePath: `/connections`,
            },
            [
                'AdatsController.getConnections',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'get',
                baseUri: ADATS_SYNC_BASE_URI,
                basePath: `/connectors`,
            },
            {}
        );
    });

    describe('post /analytics/data-service/sync/connections', () => {
        testControllerInput(
            {
                method: 'post',
                baseUri: ADATS_SYNC_BASE_URI,
                basePath: '/connections',
                body: {
                    connectorId: 'SALESFORCE_ADS',
                    name: 'sfdc2',
                },
            },
            [
                'AdatsController.createConnection',
                {
                    connectorId: 'SALESFORCE_ADS',
                    name: 'sfdc2',
                },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'post',
                baseUri: ADATS_SYNC_BASE_URI,
                basePath: `/connections`,
            },
            {}
        );
    });

    describe('get /analytics/data-service/sync/connectors/{id}', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: ADATS_SYNC_BASE_URI,
                basePath: `/connectors/SALESFORCE_ADS`,
            },
            [
                'AdatsController.getConnector',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'get',
                baseUri: ADATS_SYNC_BASE_URI,
                basePath: `/connectors/SALESFORCE_ADS`,
            },
            {}
        );
    });

    describe('get /analytics/data-service/sync/connections/{id}', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: ADATS_SYNC_BASE_URI,
                basePath: `/connections/2d54cafe-1164-4b2f-a2af-d4d0bb50f812`,
            },
            [
                'AdatsController.getConnection',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'get',
                baseUri: ADATS_SYNC_BASE_URI,
                basePath: `/connections/2d54cafe-1164-4b2f-a2af-d4d0bb50f812`,
            },
            {}
        );
    });

    describe('get /analytics/data-service/sync/connections/{id}/source-objects/{sourceObjectName}/fields', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: ADATS_SYNC_BASE_URI,
                basePath: `/connections/2d54cafe-1164-4b2f-a2af-d4d0bb50f812/source-objects/Account/fields`,
            },
            [
                'AdatsController.getFields',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        describe('with query params', () => {
            testControllerInput(
                {
                    method: 'get',
                    baseUri: ADATS_SYNC_BASE_URI,
                    basePath: `/connections/2d54cafe-1164-4b2f-a2af-d4d0bb50f812/source-objects/Account/fields`,
                    queryParams: {
                        page: 1,
                        pageSize: 3,
                        q: 'acc',
                    },
                },
                [
                    'AdatsController.getFields',
                    {
                        pageParam: 1,
                        pageSize: 3,
                        q: 'acc',
                    },
                    { background: false, hotspot: true, longRunning: false },
                ]
            );
        });

        testResolveResponse(
            {
                method: 'get',
                baseUri: ADATS_SYNC_BASE_URI,
                basePath: `/connections/2d54cafe-1164-4b2f-a2af-d4d0bb50f812/source-objects/Account/fields`,
            },
            {}
        );
    });

    describe('get /analytics/data-service/sync/connections/{id}/source-objects', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: ADATS_SYNC_BASE_URI,
                basePath: `/connections/2d54cafe-1164-4b2f-a2af-d4d0bb50f812/source-objects`,
            },
            [
                'AdatsController.getConnectionSourceObjects',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'get',
                baseUri: ADATS_SYNC_BASE_URI,
                basePath: `/connections/2d54cafe-1164-4b2f-a2af-d4d0bb50f812/source-objects`,
            },
            {}
        );
    });

    describe('get /analytics/data-service/sync/connections/{id}/sourceO-objects/{source-objectName}', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: ADATS_SYNC_BASE_URI,
                basePath: `/connections/2d54cafe-1164-4b2f-a2af-d4d0bb50f812/source-objects/Account`,
            },
            [
                'AdatsController.getConnectionSourceObject',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'get',
                baseUri: ADATS_SYNC_BASE_URI,
                basePath: `/connections/2d54cafe-1164-4b2f-a2af-d4d0bb50f812/source-objects/Account`,
            },
            {}
        );
    });

    describe('get /analytics/data-service/sync/targets/{id}', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: ADATS_SYNC_BASE_URI,
                basePath: `/targets/c11fdb87-a196-46aa-8b44-5ad6e9e253c5`,
            },
            [
                'AdatsController.getTarget',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'get',
                baseUri: ADATS_SYNC_BASE_URI,
                basePath: `/targets/c11fdb87-a196-46aa-8b44-5ad6e9e253c5`,
            },
            {}
        );
    });

    describe('delete /analytics/data-service/sync/targets/{id}', () => {
        testControllerInput(
            {
                method: 'delete',
                baseUri: ADATS_SYNC_BASE_URI,
                basePath: `/targets/c11fdb87-a196-46aa-8b44-5ad6e9e253c5`,
            },
            [
                'AdatsController.deleteTarget',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'delete',
                baseUri: ADATS_SYNC_BASE_URI,
                basePath: `/targets/c11fdb87-a196-46aa-8b44-5ad6e9e253c5`,
            },
            {}
        );
    });

    describe('patch /analytics/data-service/sync/targets/{id}', () => {
        testControllerInput(
            {
                method: 'patch',
                baseUri: ADATS_SYNC_BASE_URI,
                basePath: `/targets/c11fdb87-a196-46aa-8b44-5ad6e9e253c5`,
                body: {
                    targetInput: {
                        connectionId: 'c08fdb87-a196-46aa-8b44-5ad6e9e253c4',
                        sourceObject: { name: 'Account' },
                        fields: [{ name: 'Id' }, { name: 'SystemModstamp' }, { name: 'IsDeleted' }],
                    },
                },
            },
            [
                'AdatsController.updateTarget',
                {
                    targetInput: {
                        connectionId: 'c08fdb87-a196-46aa-8b44-5ad6e9e253c4',
                        sourceObject: { name: 'Account' },
                        fields: [{ name: 'Id' }, { name: 'SystemModstamp' }, { name: 'IsDeleted' }],
                    },
                },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'post',
                baseUri: ADATS_SYNC_BASE_URI,
                basePath: `/targets`,
                body: {
                    targetInput: {
                        connectionId: 'c08fdb87-a196-46aa-8b44-5ad6e9e253c4',
                        sourceObject: { name: 'Account' },
                        fields: [{ name: 'Id' }, { name: 'SystemModstamp' }, { name: 'IsDeleted' }],
                    },
                },
            },
            {}
        );
    });

    describe('get /analytics/data-service/sync/targets', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: ADATS_SYNC_BASE_URI,
                basePath: `/targets`,
            },
            [
                'AdatsController.getTargets',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        describe('get /analytics/data-service/sync/targets', () => {
            testControllerInput(
                {
                    method: 'get',
                    baseUri: ADATS_SYNC_BASE_URI,
                    basePath: `/targets`,
                    queryParams: {
                        connectionId: 'c08fdb87-a196-46aa-8b44-5ad6e9e253c4',
                    },
                },
                [
                    'AdatsController.getTargets',
                    {
                        connectionId: 'c08fdb87-a196-46aa-8b44-5ad6e9e253c4',
                    },
                    { background: false, hotspot: true, longRunning: false },
                ]
            );
        });

        testResolveResponse(
            {
                method: 'get',
                baseUri: ADATS_SYNC_BASE_URI,
                basePath: `/targets`,
            },
            {}
        );
    });

    describe('post /analytics/data-service/sync/targets', () => {
        testControllerInput(
            {
                method: 'post',
                baseUri: ADATS_SYNC_BASE_URI,
                basePath: `/targets`,
                body: {
                    targetInput: {
                        connectionId: 'c08fdb87-a196-46aa-8b44-5ad6e9e253c4',
                        sourceObject: { name: 'Account' },
                        fields: [{ name: 'Id' }, { name: 'SystemModstamp' }, { name: 'IsDeleted' }],
                    },
                },
            },
            [
                'AdatsController.createTarget',
                {
                    targetInput: {
                        connectionId: 'c08fdb87-a196-46aa-8b44-5ad6e9e253c4',
                        sourceObject: { name: 'Account' },
                        fields: [{ name: 'Id' }, { name: 'SystemModstamp' }, { name: 'IsDeleted' }],
                    },
                },
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'post',
                baseUri: ADATS_SYNC_BASE_URI,
                basePath: `/targets`,
                body: {
                    targetInput: {
                        connectionId: 'c08fdb87-a196-46aa-8b44-5ad6e9e253c4',
                        sourceObject: { name: 'Account' },
                        fields: [{ name: 'Id' }, { name: 'SystemModstamp' }, { name: 'IsDeleted' }],
                    },
                },
            },
            {}
        );
    });

    describe('get /analytics/data-service/databases', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: ADATS_BASE_URI,
                basePath: `/databases`,
            },
            [
                'AdatsController.getDatabases',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'get',
                baseUri: ADATS_BASE_URI,
                basePath: `/databases`,
            },
            {}
        );
    });

    describe('get /analytics/data-service/databases/{databaseName}', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: ADATS_DATABASE_BASE_URI,
                basePath: `/testDatabase01`,
            },
            [
                'AdatsController.getDatabase',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'get',
                baseUri: ADATS_DATABASE_BASE_URI,
                basePath: `/testDatabase01`,
            },
            {}
        );
    });

    describe('get /analytics/data-service/databases/{databaseName}/schemas', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: ADATS_DATABASE_BASE_URI,
                basePath: `/testDatabase01/schemas`,
            },
            [
                'AdatsController.getSchemas',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'get',
                baseUri: ADATS_DATABASE_BASE_URI,
                basePath: `/testDatabase01/schemas`,
            },
            {}
        );
    });

    describe('get /analytics/data-service/databases/{databaseName}/schemas/{schemaName}', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: ADATS_DATABASE_BASE_URI,
                basePath: `/testDatabase01/schemas/testSchema01`,
            },
            [
                'AdatsController.getSchema',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'get',
                baseUri: ADATS_DATABASE_BASE_URI,
                basePath: `/testDatabase01/schemas/testSchema01`,
            },
            {}
        );
    });

    describe('get /analytics/data-service/databases/{databaseName}/schemas/{schemaName}/tables', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: ADATS_DATABASE_BASE_URI,
                basePath: `/testDatabase01/schemas/testSchema01/tables`,
            },
            [
                'AdatsController.getTables',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'get',
                baseUri: ADATS_DATABASE_BASE_URI,
                basePath: `/testDatabase01/schemas/testSchema01/tables`,
            },
            {}
        );
    });

    describe('get /analytics/data-service/databases/{databaseName}/schemas/{schemaName}/tables/{tableName}', () => {
        testControllerInput(
            {
                method: 'get',
                baseUri: ADATS_DATABASE_BASE_URI,
                basePath: `/testDatabase01/schemas/testSchema01/tables/testTable01`,
            },
            [
                'AdatsController.getTable',
                {},
                { background: false, hotspot: true, longRunning: false },
            ]
        );

        testResolveResponse(
            {
                method: 'get',
                baseUri: ADATS_DATABASE_BASE_URI,
                basePath: `/testDatabase01/schemas/testSchema01/tables/testTable01`,
            },
            {}
        );
    });

    describe('post /connect/identity-verification/search', () => {
        testControllerInput(
            {
                method: 'post',
                baseUri: IDENTITY_VERIFICATION_BASE_URI,
                basePath: `/search`,
                body: {
                    SearchRecordsContextData: {
                        searchTerm: 'test',
                        verificationContext: {
                            processDefinition: {
                                layoutType: 'Tab',
                                processDetail: [
                                    {
                                        dataSourceType: 'Salesforce',
                                        searchObjectName: 'Account',
                                        searchSequenceNo: 0,
                                        searchType: 'SOSL',
                                        searchResultUniqueIdField: 'Id',
                                        searchResultFilter: '',
                                        searchResultSortOrder: '',
                                        optionalVerifierCount: '1',
                                        apexClassName: '',
                                        verificationProcessFieldList: {
                                            verificationProcessFields: [
                                                {
                                                    developerName: 'dob',
                                                    dataSourceType: 'Salesforce',
                                                    fieldType: 'RequiredVerifier',
                                                    label: 'Date of Birth',
                                                    fieldName: 'BirthDate',
                                                },
                                                {
                                                    developerName: 'accountName',
                                                    dataSourceType: 'Salesforce',
                                                    fieldType: 'RequiredVerifier',
                                                    label: 'Account Name',
                                                    fieldName: 'Name',
                                                },
                                                {
                                                    developerName: 'zip',
                                                    dataSourceType: 'Salesforce',
                                                    fieldType: 'OptionalVerifier',
                                                    label: 'Zip',
                                                    fieldName: 'ZipCode',
                                                },
                                                {
                                                    developerName: 'name',
                                                    dataSourceType: 'Salesforce',
                                                    fieldType: 'ResultField',
                                                    label: 'Account Name',
                                                    fieldName: 'Name',
                                                },
                                            ],
                                        },
                                    },
                                ],
                            },
                            selectedSearchResult: {
                                objectName: '',
                                selectedRecordId: '',
                                selectedRecordObject: [],
                            },
                            verifiedResult: {
                                requiredVerifiers: [
                                    {
                                        developerName: 'ssn',
                                        verificationState: 'Yes',
                                    },
                                    {
                                        developerName: 'dob',
                                        verificationState: 'Yes',
                                    },
                                    {
                                        developerName: 'accountName',
                                        verificationState: 'Yes',
                                    },
                                ],
                                optionalVerifiers: [
                                    {
                                        developerName: 'street',
                                        verificationState: 'Unset',
                                    },
                                    {
                                        developerName: 'zip',
                                        verificationState: 'Yes',
                                    },
                                ],
                            },
                        },
                    },
                },
            },
            [
                'IdentityVerificationController.searchRecords',
                {
                    SearchRecordsContextData: {
                        searchTerm: 'test',
                        verificationContext: {
                            processDefinition: {
                                layoutType: 'Tab',
                                processDetail: [
                                    {
                                        dataSourceType: 'Salesforce',
                                        searchObjectName: 'Account',
                                        searchSequenceNo: 0,
                                        searchType: 'SOSL',
                                        searchResultUniqueIdField: 'Id',
                                        searchResultFilter: '',
                                        searchResultSortOrder: '',
                                        optionalVerifierCount: '1',
                                        apexClassName: '',
                                        verificationProcessFieldList: {
                                            verificationProcessFields: [
                                                {
                                                    developerName: 'dob',
                                                    dataSourceType: 'Salesforce',
                                                    fieldType: 'RequiredVerifier',
                                                    label: 'Date of Birth',
                                                    fieldName: 'BirthDate',
                                                },
                                                {
                                                    developerName: 'accountName',
                                                    dataSourceType: 'Salesforce',
                                                    fieldType: 'RequiredVerifier',
                                                    label: 'Account Name',
                                                    fieldName: 'Name',
                                                },
                                                {
                                                    developerName: 'zip',
                                                    dataSourceType: 'Salesforce',
                                                    fieldType: 'OptionalVerifier',
                                                    label: 'Zip',
                                                    fieldName: 'ZipCode',
                                                },
                                                {
                                                    developerName: 'name',
                                                    dataSourceType: 'Salesforce',
                                                    fieldType: 'ResultField',
                                                    label: 'Account Name',
                                                    fieldName: 'Name',
                                                },
                                            ],
                                        },
                                    },
                                ],
                            },
                            selectedSearchResult: {
                                objectName: '',
                                selectedRecordId: '',
                                selectedRecordObject: [],
                            },
                            verifiedResult: {
                                requiredVerifiers: [
                                    {
                                        developerName: 'ssn',
                                        verificationState: 'Yes',
                                    },
                                    {
                                        developerName: 'dob',
                                        verificationState: 'Yes',
                                    },
                                    {
                                        developerName: 'accountName',
                                        verificationState: 'Yes',
                                    },
                                ],
                                optionalVerifiers: [
                                    {
                                        developerName: 'street',
                                        verificationState: 'Unset',
                                    },
                                    {
                                        developerName: 'zip',
                                        verificationState: 'Yes',
                                    },
                                ],
                            },
                        },
                    },
                },
                { background: false, hotspot: true, longRunning: false },
            ],
            {
                message: 'SUCCESS',
                isSuccess: true,
                searchResult: [
                    {
                        searchFields: [
                            {
                                apiName: 'name',
                                value: 'Mister Tester',
                                dataType: 'TEXT',
                                displayLabel: 'Name',
                            },
                            {
                                apiName: 'id',
                                value: '001xx000003GYlTest',
                                dataType: 'TEXT',
                                displayLabel: 'Id',
                            },
                            {
                                apiName: 'dob',
                                value: '01-Apr-1976',
                                dataType: 'DATE',
                                displayLabel: 'Date Of Birth',
                            },
                        ],
                    },
                ],
            }
        );

        testRejectFetchResponse({
            method: 'post',
            baseUri: IDENTITY_VERIFICATION_BASE_URI,
            basePath: `/search`,
        });

        testResolveResponse(
            {
                method: 'post',
                baseUri: IDENTITY_VERIFICATION_BASE_URI,
                basePath: `/search`,
            },
            {
                message: 'SUCCESS',
                isSuccess: true,
                searchResult: [
                    {
                        searchFields: [
                            {
                                apiName: 'name',
                                value: 'Mister Tester',
                                dataType: 'TEXT',
                                displayLabel: 'Name',
                            },
                            {
                                apiName: 'id',
                                value: '001xx000003GYlTest',
                                dataType: 'TEXT',
                                displayLabel: 'Id',
                            },
                            {
                                apiName: 'dob',
                                value: '01-Apr-1976',
                                dataType: 'DATE',
                                displayLabel: 'Date Of Birth',
                            },
                        ],
                    },
                ],
            }
        );
    });

    // [IMPORTANT] this test has to be the last one in the suite to verify all registered routes have corresponding tests
    it.each(Object.keys(testedRoutes).map((key) => key.split(':')))(
        '%s %s route tested',
        (method, handlerName) => {
            expect(testedRoutes[`${method}:${handlerName}`]).toBe(true);
        }
    );
});
