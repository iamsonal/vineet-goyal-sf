import { factory as getApex, createResourceParams, keyBuilderFromResourceParams } from '../index';

describe('getApex', () => {
    it('calls storeLookup on valid input', async () => {
        const mockInvokerParams = {
            namespace: '',
            classname: 'TestController',
            method: 'getString',
            isContinuation: false,
        };
        const mockLuvio = {
            storeLookup: jest.fn().mockReturnValue({ state: 'Fulfilled', data: {} }),
            snapshotAvailable: jest.fn().mockReturnValue(true),
        };
        await getApex(mockLuvio as any, mockInvokerParams)({});
        expect(mockLuvio.storeLookup.mock.calls.length).toBe(1);
    });
    it('returns null when config contains undefined values', async () => {
        const mockInvokerParams = {
            namespace: '',
            classname: 'TestController',
            method: 'getString',
            isContinuation: false,
        };
        const mockConfig = {
            validVal: 'valid',
            undefVal: undefined,
        };
        // Luvio not needed for this test
        const mockLuvio = null;
        const adapter = await getApex(mockLuvio, mockInvokerParams)(mockConfig);
        expect(adapter).toBeNull();
    });
    it('calls resolveUnfulfilledSnapshot when Snapshot is Unfulfilled', async () => {
        const mockInvokerParams = {
            namespace: '',
            classname: 'TestController',
            method: 'getString',
            isContinuation: false,
        };
        const mockLuvio = {
            storeLookup: jest.fn().mockReturnValue({ state: 'Unfulfilled', data: {} }),
            snapshotAvailable: jest.fn().mockReturnValue(false),
            resolveUnfulfilledSnapshot: jest.fn().mockResolvedValueOnce({}),
        };
        await getApex(mockLuvio as any, mockInvokerParams)({});
        expect(mockLuvio.storeLookup.mock.calls.length).toBe(1);
        expect(mockLuvio.resolveUnfulfilledSnapshot.mock.calls.length).toBe(1);
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
