import {
    buildSuccessMockPayload,
    MockPayload,
    buildMockNetworkAdapter,
    getMockNetworkAdapterCallCount,
} from '@luvio/adapter-test-library';
import { populateDurableStore, buildOfflineLuvio } from '../../../../jest/offline';

import { factory as getApex } from '../../getApex';
import { invoker as postApex } from '../index';

import getContactList from '../__karma__/data/apex-getContactList.json';
import { ApexInvokerParams } from '../../../util/shared';

const emptyConfig = {};

describe('postApex adapter offline', () => {
    it('should make another HTTP request when getApex returns with no-cache header', async () => {
        const invokerParams: ApexInvokerParams = {
            namespace: '',
            classname: 'ContactController',
            method: 'getContactList',
            isContinuation: false,
        };

        const getApexRequestArgs: MockPayload['networkArgs'] = {
            method: 'get',
            basePath: `/${invokerParams.classname}/${invokerParams.method}`,
            baseUri: '/lwr/apex/v55.0',
        };
        const getApexRecordPayload: MockPayload = buildSuccessMockPayload(
            getApexRequestArgs,
            getContactList,
            {
                'Cache-Control': 'no-cache',
            }
        );
        // populate durable store with getApex
        const durableStore = await populateDurableStore(
            getApex,
            invokerParams,
            emptyConfig,
            getApexRecordPayload
        );

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
        // instantiate new LDS instance with durable environment
        const { luvio, network } = buildOfflineLuvio(
            durableStore,
            buildMockNetworkAdapter([postApexRecordPayload])
        );
        const dsReadSpy = jest.spyOn(durableStore, 'getEntries');
        const adapter = postApex(luvio, invokerParams);

        // call postApex with same config
        await (adapter(emptyConfig) as Promise<any>);

        // adapter will have read from DS only once for the adapter context,
        // but not for any data (since Cache-Control header was set to no-cache)
        expect(dsReadSpy).toHaveBeenCalledTimes(1);
        expect(dsReadSpy).toHaveBeenCalledWith(['apex__shared__NAMED_CONTEXT'], 'ADAPTER-CONTEXT');

        // should have read from network
        const callCount = getMockNetworkAdapterCallCount(network);
        expect(callCount).toBe(1);
    });
});
