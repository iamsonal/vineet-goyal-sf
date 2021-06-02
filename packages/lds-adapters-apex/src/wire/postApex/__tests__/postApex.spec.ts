import { invoker as postApex, createResourceParams, keyBuilderFromResourceParams } from '../index';

describe('postApex', () => {
    it('calls storeLookup on valid input', async () => {
        const mockInvokerParams = {
            namespace: '',
            classname: 'TestController',
            method: 'getString',
            isContinuation: false,
        };
        const mockLds = {
            storeLookup: jest.fn().mockReturnValue({ state: 'Fulfilled', data: {} }),
            snapshotAvailable: jest.fn().mockReturnValue(true),
        };
        await postApex(mockLds as any, mockInvokerParams)({});
        expect(mockLds.storeLookup.mock.calls.length).toBe(2);
    });
    it('calls buildNetworkSnapshot when isCacheable returns false', async () => {
        const mockInvokerParams = {
            namespace: '',
            classname: 'TestController',
            method: 'getString',
            isContinuation: false,
        };
        const mockLds = {
            storeLookup: jest.fn().mockReturnValue({ state: 'Unfulfilled', data: {} }),
            snapshotAvailable: jest.fn().mockReturnValue(false),
            dispatchResourceRequest: jest.fn().mockResolvedValueOnce({}),
        };
        await postApex(mockLds as any, mockInvokerParams)({});
        expect(mockLds.storeLookup.mock.calls.length).toBe(1);
        expect(mockLds.dispatchResourceRequest.mock.calls.length).toBe(1);
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
