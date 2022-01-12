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
} from '../index';
import { ResourceRequestConfig } from '../../../generated/resources/postByApexMethodAndApexClass';
import * as utils from '../../../util/shared';
import { invoker as factory } from '../../postApex';

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
        body: {},
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

describe('isContinuation Header', () => {
    it('handles continuations', async () => {
        const store = new Store();
        const environment = new Environment(store, jest.fn().mockResolvedValue({}));
        const dispatchSpy = jest.spyOn(environment, 'dispatchResourceRequest');
        const luvio = new Luvio(environment);

        jest.spyOn(utils, 'isCacheable').mockReturnValue(false);

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

        const adapter = await factory(luvio, invokerParams);
        adapter(config);
        expect(dispatchSpy).toHaveBeenCalledTimes(1);

        const expectedRequest = {
            baseUri: '/lwr/apex/v55.0',
            basePath: '/wkdw__TestController/getString',
            method: 'post',
            priority: 'normal',
            body: {
                apexMethod: 'getString',
                apexClass: 'TestController',
                xSFDCAllowContinuation: 'true',
            },
            urlParams: {
                apexMethod: 'getString',
                apexClass: 'wkdw__TestController',
            },
            queryParams: {},
            headers: {
                'X-SFDC-Allow-Continuation': 'true',
            },
        };
        expect(dispatchSpy).toHaveBeenCalledWith(expectedRequest);
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
            headers: { [utils.CACHE_CONTROL]: 'private' },
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

describe('no-cache response header', () => {
    it('skips cache lookup', async () => {
        const store = jest.fn();
        const environment = new Environment(
            store as unknown as Store,
            jest.fn().mockResolvedValue({})
        );
        const luvio = new Luvio(environment);

        const dispatchSpy = jest.spyOn(environment, 'dispatchResourceRequest');
        jest.spyOn(utils, 'isCacheable').mockReturnValue(false);

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

        const adapter = factory(luvio, invokerParams);
        await adapter(config);

        expect(store).not.toHaveBeenCalled();
        expect(dispatchSpy).toHaveBeenCalledTimes(1);
    });
});
