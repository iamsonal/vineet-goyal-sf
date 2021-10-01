import {
    buildMockNetworkAdapter,
    buildSuccessMockPayload,
    buildErrorMockPayload,
    MockPayload,
    getMockNetworkAdapterCallCount,
} from '@luvio/adapter-test-library';
import { Environment, Luvio, Store, NetworkAdapter } from '@luvio/engine';
import { setDefaultLuvio } from '@salesforce/lds-default-luvio';
import { customMatchers, flushPromises } from '@salesforce/lds-jest';
import { getRecord_imperative } from '../../../../sfdc';
import singleRecordWithIdName from './mockData/record-Account-fields-Account.Id,Account.Name.json';

const recordId_Account = singleRecordWithIdName.id;
const recordFields_Account = ['Account.Id', 'Account.Name'];
const recordRequest_Account: MockPayload['networkArgs'] = {
    method: 'get',
    basePath: `/ui-api/records/${recordId_Account}`,
    queryParams: { fields: recordFields_Account },
};
const mockError = {
    status: 404,
    headers: {},
    statusText: 'Not Found',
    ok: false,
    body: [
        {
            errorCode: 'NOT_FOUND',
            message: 'The requested resource does not exist',
        },
    ],
};
const recordPayload_Account: MockPayload = buildSuccessMockPayload(
    recordRequest_Account,
    singleRecordWithIdName
);
const recordPayload_Error: MockPayload = buildErrorMockPayload(
    recordRequest_Account,
    mockError.body,
    mockError.status,
    mockError.statusText,
    mockError.headers
);

const privateProperties = ['eTag', 'weakEtag'];

expect.extend(customMatchers);

function buildLds(network: NetworkAdapter = buildMockNetworkAdapter([])) {
    const store = new Store();
    const env = new Environment(store, network);
    const luvio = new Luvio(env);

    return {
        luvio,
        store,
        env,
    };
}

describe('basic', () => {
    it('should fetch data from network', async () => {
        const callback = jest.fn();
        const config = {
            recordId: recordId_Account,
            fields: recordFields_Account,
        };
        const network = buildMockNetworkAdapter([recordPayload_Account]);
        const { luvio } = buildLds(network);
        setDefaultLuvio({ luvio });

        getRecord_imperative.invoke(config, {}, callback);
        await flushPromises();

        expect(callback).toHaveBeenCalledWithDataTuple(singleRecordWithIdName, privateProperties);
        expect(callback).toBeCalledTimes(1);
        expect(getMockNetworkAdapterCallCount(network)).toBe(1);
    });

    it('should be a cache hit if valid data in cache', async () => {
        const callback = jest.fn();
        const config = {
            recordId: recordId_Account,
            fields: recordFields_Account,
        };
        const network = buildMockNetworkAdapter([recordPayload_Account]);
        const { luvio } = buildLds(network);
        setDefaultLuvio({ luvio });

        getRecord_imperative.invoke(config, {}, callback);
        await flushPromises();
        getRecord_imperative.invoke(config, {}, callback);

        expect(callback).toHaveBeenCalledWithDataTuple(singleRecordWithIdName, privateProperties);
        expect(callback).toBeCalledTimes(2);
        expect(getMockNetworkAdapterCallCount(network)).toBe(1);
    });

    it('should return an error when server returns a 404', async () => {
        const callback = jest.fn();
        const network = buildMockNetworkAdapter([recordPayload_Error]);
        const config = {
            recordId: recordId_Account,
            fields: recordFields_Account,
        };
        const { luvio } = buildLds(network);
        setDefaultLuvio({ luvio });

        getRecord_imperative.invoke(config, {}, callback);
        await flushPromises();

        expect(callback).toHaveBeenCalledWith({ data: undefined, error: mockError });
        expect(callback).toBeCalledTimes(1);
        expect(getMockNetworkAdapterCallCount(network)).toBe(1);
    });

    describe('custom errors', () => {
        it('should return a custom error if called with invalid config', async () => {
            process.env.NODE_ENV = 'production';
            try {
                const config = {
                    recordId: '',
                };
                const callback = jest.fn();
                const { luvio } = buildLds();
                setDefaultLuvio({ luvio });
                const customError = {
                    data: undefined,
                    error: {
                        body: undefined,
                        headers: {},
                        ok: false,
                        status: 400,
                        statusText: 'INVALID_CONFIG',
                    },
                };

                getRecord_imperative.invoke(config, {}, callback);

                expect(callback).toHaveBeenCalledWith(customError);
                expect(callback).toBeCalledTimes(1);
            } finally {
                process.env.NODE_ENV = 'test';
            }
        });
    });
});
