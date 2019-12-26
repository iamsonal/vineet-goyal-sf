import { karmaNetworkAdapter } from 'lds';
import {
    getMock as globalGetMock,
    mockNetworkOnce,
    mockNetworkSequence,
    setupElement,
} from 'test-util';
import { URL_BASE, expireActions } from 'uiapi-test-util';
import sinon from 'sinon';

import Basic from '../lwc/basic';

const MOCK_PREFIX = 'wire/getRecordEditActions/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

function mockNetwork(config, mockData) {
    const { urlParams, queryParams } = config;
    const paramMatch = sinon.match({
        path: `${URL_BASE}/actions/record/${urlParams.recordId.sort().join(',')}/record-edit`,
        urlParams,
        queryParams,
    });

    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

describe('basic', () => {
    it('gets data', async () => {
        const mockData = getMock('record-edit-actions');
        const mockDataActionsKeys = Object.keys(mockData.actions);
        const resourceConfig = {
            urlParams: {
                recordId: mockDataActionsKeys,
            },
            queryParams: {
                actionTypes: undefined,
                formFactor: undefined,
                sections: undefined,
            },
        };
        mockNetwork(resourceConfig, mockData);

        const props = { recordId: mockDataActionsKeys };
        const element = await setupElement(props, Basic);

        expect(element.getWiredData()).toEqualActionsSnapshot(mockData);
    });
});

describe('caching', () => {
    it('returns cached result when cached data is available', async () => {
        const mockData = getMock('record-edit-actions');
        const mockDataActionsKeys = Object.keys(mockData.actions);
        const resourceConfig = {
            urlParams: {
                recordId: mockDataActionsKeys,
            },
            queryParams: {
                actionTypes: undefined,
                formFactor: undefined,
                sections: undefined,
            },
        };
        mockNetwork(resourceConfig, mockData);

        // populate cache
        const props = { recordId: mockDataActionsKeys };
        await setupElement(props, Basic);

        // second component should have the cached data without hitting network
        const element = await setupElement(props, Basic);

        expect(element.getWiredData()).toEqualActionsSnapshot(mockData);
    });

    it('retrieves data from network when cached data is expired', async () => {
        const mockData = getMock('record-edit-actions');
        const updatedData = getMock('record-edit-actions');
        const mockDataActionsKeys = Object.keys(mockData.actions);
        Object.assign(updatedData, {
            eTag: 'e7c7f7e02c57bdcfa9d751b5a508f907',
        });
        const resourceConfig = {
            urlParams: {
                recordId: mockDataActionsKeys,
            },
            queryParams: {
                actionTypes: undefined,
                formFactor: undefined,
                sections: undefined,
            },
        };
        mockNetwork(resourceConfig, [mockData, updatedData]);

        // populate cache
        const props = { recordId: mockDataActionsKeys };
        await setupElement(props, Basic);

        // expire cache
        expireActions();

        // second component should retrieve from network with updated data
        const element = await setupElement(props, Basic);

        expect(element.getWiredData()).toEqualActionsSnapshot(updatedData);
    });
});
