import { factory as getApex, createResourceParams, keyBuilderFromResourceParams } from '../index';

describe('getApex', () => {
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
        await getApex(mockLds as any, mockInvokerParams)({});
        expect(mockLds.storeLookup.mock.calls.length).toBe(1);
    });
    it('calls resolveUnfulfilledSnapshot when Snapshot is Unfulfilled', async () => {
        const mockInvokerParams = {
            namespace: '',
            classname: 'TestController',
            method: 'getString',
            isContinuation: false,
        };
        const mockLds = {
            storeLookup: jest.fn().mockReturnValue({ state: 'Unfulfilled', data: {} }),
            snapshotAvailable: jest.fn().mockReturnValue(false),
            resolveUnfulfilledSnapshot: jest.fn().mockResolvedValueOnce({}),
        };
        await getApex(mockLds as any, mockInvokerParams)({});
        expect(mockLds.storeLookup.mock.calls.length).toBe(1);
        expect(mockLds.resolveUnfulfilledSnapshot.mock.calls.length).toBe(1);
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
});
