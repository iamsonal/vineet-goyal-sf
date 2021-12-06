import {
    buildSuccessMockPayload,
    MockPayload,
    buildMockNetworkAdapter,
    getMockNetworkAdapterCallCount,
} from '@luvio/adapter-test-library';
import {
    testDataEmittedWhenStale,
    testDurableHitDoesNotHitNetwork,
    populateDurableStore,
    buildOfflineLuvio,
} from '../../../../jest/offline';

import { factory as getApex } from '../index';
import { invoker as postApex } from '../../postApex';

import getContactList from '../__karma__/data/apex-getContactList.json';
import { APEX_TTL as TTL, ApexInvokerParams } from '../../../util/shared';

const invokerParams: ApexInvokerParams = {
    namespace: '',
    classname: 'ContactController',
    method: 'getContactList',
    isContinuation: false,
};

const requestArgs: MockPayload['networkArgs'] = {
    method: 'get',
    basePath: `/${invokerParams.classname}/${invokerParams.method}`,
    baseUri: '/lwr/apex/v55.0',
};
const recordPayload: MockPayload = buildSuccessMockPayload(requestArgs, getContactList, {
    'Cache-Control': 'private',
});

const emptyConfig = {};

describe('getApex adapter offline', () => {
    it('returns stale snapshot when data is expired', async () => {
        await testDataEmittedWhenStale(getApex, invokerParams, emptyConfig, recordPayload, TTL);
    });

    it('does not hit the network when durable store is populated', async () => {
        await testDurableHitDoesNotHitNetwork(getApex, invokerParams, emptyConfig, recordPayload);
    });

    it('should not make another HTTP request when durable store is populated with postApex call with same recordId', async () => {
        // populate durable store with postApex
        const postRequestArgs: MockPayload['networkArgs'] = {
            method: 'post',
            basePath: `/${invokerParams.classname}/${invokerParams.method}`,
            baseUri: '/lwr/apex/v55.0',
        };
        const postApexRecordPayload: MockPayload = buildSuccessMockPayload(
            postRequestArgs,
            getContactList,
            {
                'Cache-Control': 'private',
            }
        );
        const durableStore = await populateDurableStore(
            postApex,
            invokerParams,
            emptyConfig,
            postApexRecordPayload
        );

        // instantiate new LDS instance with durable environment
        const { luvio, network } = buildOfflineLuvio(
            durableStore,
            buildMockNetworkAdapter([recordPayload])
        );
        const adapter = getApex(luvio, invokerParams);

        // call getApex with same config
        const result = await (adapter(emptyConfig) as Promise<any>);
        expect(result.state).toBe('Fulfilled');
        const callCount = getMockNetworkAdapterCallCount(network);
        expect(callCount).toBe(0);
    });
});
