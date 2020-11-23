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
    buildOfflineLds,
} from '@salesforce/lds-jest';

import { factory as getListUi } from '../index';
import { GetListUiByListViewIdConfig } from '../../../generated/adapters/getListUiByListViewId';
import { GetListUiByApiNameConfig } from '../../../generated/adapters/getListUiByApiName';
import { responseRecordRepresentationRetrievers } from '../../../generated/records/retrievers';

import response from './data/list-ui-All-Opportunities.json';

// expire the records within list representation
import { TTL } from '../../../generated/types/RecordRepresentation';

const requestArgs: MockPayload['networkArgs'] = {
    method: 'get',
    basePath: `/ui-api/list-ui/${response.info.listReference.id}`,
};
const payload: MockPayload = buildSuccessMockPayload(requestArgs, response);

const configUsingListViewId: GetListUiByListViewIdConfig = {
    listViewId: response.info.listReference.id,
};

const configUsingApiName: GetListUiByApiNameConfig = {
    listViewApiName: response.info.listReference.listViewApiName,
    objectApiName: response.info.listReference.objectApiName,
};

describe('getListUi adapter offline', () => {
    it('returns stale snapshot when data is expired', async () => {
        await testDataEmittedWhenStale(
            getListUi,
            configUsingListViewId,
            payload,
            TTL,
            undefined,
            responseRecordRepresentationRetrievers
        );
    });

    it('does not hit the network when durable store is populated', async () => {
        await testDurableHitDoesNotHitNetwork(
            getListUi,
            configUsingListViewId,
            payload,
            undefined,
            responseRecordRepresentationRetrievers
        );
    });

    it('should not make another HTTP request when using different props of listReference', async () => {
        // populate durable store with config that explicitly sets rtId
        const durableStore = await populateDurableStore(getListUi, configUsingListViewId, payload);

        // instantiate new LDS instance with durable environment
        const { lds, network } = buildOfflineLds(durableStore, buildMockNetworkAdapter([payload]));
        const adapter = getListUi(lds);

        // call adapter without rtId set
        const result = await (adapter(configUsingApiName) as Promise<any>);
        expect(result.state).toBe('Fulfilled');
        const callCount = getMockNetworkAdapterCallCount(network);
        expect(callCount).toBe(0);
    });
});
