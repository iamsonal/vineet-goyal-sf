import {
    AdapterContext,
    Environment,
    FulfilledSnapshot,
    Luvio,
    ResourceResponse,
    Store,
} from '@luvio/engine';

import {
    createResourceParams,
    keyBuilderFromResourceParams,
    ingestSuccess,
    onResourceResponseSuccess,
    factory,
} from '../index';
import { ResourceRequestConfig } from '../../../generated/resources/getByApexMethodAndApexClass';
import { CACHE_CONTROL } from '../../../util/shared';

describe('ingestSuccess', () => {
    const mockLuvio: any = {
        storeIngest: jest.fn(),
        snapshotAvailable: jest.fn().mockReturnValue(true),
    };
    const resourceParams: ResourceRequestConfig = {
        urlParams: {
            apexClass: 'TestController',
            apexMethod: 'getString',
        },
        queryParams: {},
        headers: {
            xSFDCAllowContinuation: 'false',
        },
    };
    const response: any = {
        body: {},
        headers: {},
    };

    it('returns a fulfilled snapshot', () => {
        mockLuvio.storeLookup = jest.fn().mockReturnValue({ state: 'Fulfilled', data: {} });
        const snapshot = ingestSuccess(mockLuvio, resourceParams, response);
        expect(snapshot).toStrictEqual({ state: 'Fulfilled', data: {} });
    });

    it('throws error for invalid network response when not in production environment', () => {
        process.env.NODE_ENV = 'foo';
        mockLuvio.storeLookup = jest.fn().mockReturnValue({ state: 'Unfulfilled', data: {} });
        expect(() => {
            ingestSuccess(mockLuvio, resourceParams, response);
        }).toThrow(
            'Invalid network response. Expected resource response to result in Fulfilled snapshot'
        );
        process.env.NODE_ENV = 'production';
    });

    it('throws error for invalid resource response when not in production environment', () => {
        process.env.NODE_ENV = 'foo';
        mockLuvio.storeLookup = jest.fn().mockReturnValue({ state: 'Unfulfilled', data: {} });
        expect(() => {
            ingestSuccess(mockLuvio, resourceParams, { body: {} } as any);
        }).toThrow(
            'Invalid resource response. Expected resource response to result in Fulfilled or Stale snapshot'
        );
        process.env.NODE_ENV = 'production';
    });
});

describe('keyBuilderFromResourceParams', () => {
    it('returns correct cache key', () => {
        const expectedKey = 'TestController:getString:false:{"foo":"bar","name":"LWC"}';
        const params = createResourceParams({
            apexMethod: 'getString',
            apexClass: 'TestController',
            methodParams: { name: 'LWC', foo: 'bar' },
            xSFDCAllowContinuation: 'false',
        });
        expect(keyBuilderFromResourceParams(params)).toBe(expectedKey);
    });
    it('returns correct cache key for ApexContinuation', () => {
        const expectedKey = 'TestController:getString:true:{"foo":"bar","name":"LWC"}';
        const params = createResourceParams({
            apexMethod: 'getString',
            apexClass: 'TestController',
            methodParams: { name: 'LWC', foo: 'bar' },
            xSFDCAllowContinuation: 'true',
        });
        expect(keyBuilderFromResourceParams(params)).toBe(expectedKey);
    });
    it('returns correct cache key if params created in different order, especially on nested objects of params', () => {
        const expectedKey =
            'TestController:getString:false:{"foo":{"bar":"baz","jane":"doe"},"name":"LWC"}';
        const config = {
            apexMethod: 'getString',
            apexClass: 'TestController',
            methodParams: { name: 'LWC', foo: { jane: 'doe', bar: 'baz' } },
            xSFDCAllowContinuation: 'false',
        };
        const params = createResourceParams(config);

        const params2 = createResourceParams({
            ...config,
            methodParams: { name: 'LWC', foo: { bar: 'baz', jane: 'doe' } },
        });

        expect(keyBuilderFromResourceParams(params)).toBe(expectedKey);
        expect(keyBuilderFromResourceParams(params2)).toBe(keyBuilderFromResourceParams(params));
    });
});

describe('isContinuation Header', () => {
    it('handles continuations', () => {
        const mockLuvio: any = {
            storeIngest: jest.fn(),
            storeLookup: jest.fn(),
            applyCachePolicy: jest
                .fn()
                .mockImplementation(
                    (_cachePolicy, buildSnapshotContext, _buildInMemoryFunc, buildNetworkFunc) => {
                        // have mock implementation call buildNetworkSnapshot so we can
                        // validate dispatchResourceRequest is called with correct params
                        return buildNetworkFunc(buildSnapshotContext);
                    }
                ),
            dispatchResourceRequest: jest.fn().mockReturnValue(Promise.resolve({})),
            withContext: (fn: any) => fn,
            snapshotAvailable: jest.fn().mockReturnValue(false),
            resolveSnapshot: (snapshot: any, refresh: any) => refresh.resolve(),
        };

        const invokerParams = {
            method: 'getString',
            classname: 'TestController',
            isContinuation: true,
            namespace: 'wkdw',
        };

        const config = {
            apexMethod: 'getString',
            apexClass: 'TestController',
            xSFDCAllowContinuation: 'true',
        };

        const adapter = factory(mockLuvio, invokerParams);
        adapter(config);
        expect(mockLuvio.dispatchResourceRequest).toHaveBeenCalledTimes(1);

        const expectedRequest = {
            basePath: '/wkdw__TestController/getString',
            baseUri: '/lwr/apex/v54.0',
            body: null,
            headers: {
                'X-SFDC-Allow-Continuation': 'true',
            },
            method: 'get',
            queryParams: {
                methodParams: {
                    apexClass: 'TestController',
                    apexMethod: 'getString',
                    xSFDCAllowContinuation: 'true',
                },
            },
            urlParams: {
                apexClass: 'wkdw__TestController',
                apexMethod: 'getString',
            },
        };

        expect(mockLuvio.dispatchResourceRequest).toHaveBeenCalledWith(expectedRequest, undefined);
    });
});

describe('onResourceResponseSuccess', () => {
    it('skips storeIngest if cache header not set', () => {
        const mockLuvio: any = {
            storeIngest: jest.fn(),
            storeLookup: jest.fn(),
        };
        const context = { get: jest.fn(), set: jest.fn() } as AdapterContext;
        const config = {
            apexClass: 'foo',
            apexMethod: 'bar',
            xSFDCAllowContinuation: 'false',
        };
        const resourceParams = createResourceParams(config);
        const response = { headers: {} } as ResourceResponse<any>;

        onResourceResponseSuccess(mockLuvio, context, config, resourceParams, response);

        expect(mockLuvio.storeIngest).not.toHaveBeenCalled();
        expect(mockLuvio.storeLookup).not.toHaveBeenCalled();
    });

    it('calls storeIngest if cache header is set', () => {
        const store = new Store();
        const environment = new Environment(store, jest.fn());
        const ingestSpy = jest.spyOn(environment, 'storeIngest');
        const luvio = new Luvio(environment);
        const context = { get: jest.fn(), set: jest.fn() } as AdapterContext;
        const config = {
            apexClass: 'foo',
            apexMethod: 'bar',
            xSFDCAllowContinuation: 'false',
        };
        const expectedKey = 'foo:bar:false:';
        const resourceParams = createResourceParams(config);
        const response = {
            body: 'some string',
            ok: true,
            status: 200,
            headers: { [CACHE_CONTROL]: 'private' },
        } as ResourceResponse<any>;

        const result = onResourceResponseSuccess(luvio, context, config, resourceParams, response);

        expect(context.set).toHaveBeenCalledWith(`${expectedKey}_cacheable`, 'private');
        expect(ingestSpy).toHaveBeenCalledTimes(1);
        expect(result).toEqual(
            expect.objectContaining({
                state: 'Fulfilled',
                recordId: expectedKey,
                data: response.body,
            } as FulfilledSnapshot<any, any>)
        );
        expect(store.records[expectedKey]).toBe(response.body);
    });
});
