import { createResourceParams, keyBuilderFromResourceParams, ingestSuccess } from '../index';
import { ResourceRequestConfig } from '../../../generated/resources/postByApexMethodAndApexClass';

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
