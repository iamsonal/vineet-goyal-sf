import { karmaNetworkAdapter } from 'lds-engine';
import {
    getMock as globalGetMock,
    mockNetworkOnce,
    mockNetworkSequence,
    setupElement,
} from 'test-util';
import { URL_BASE, expireActions } from 'uiapi-test-util';
import sinon from 'sinon';

import RelatedListRecordActions from '../lwc/related-list-record-actions';

const MOCK_PREFIX = 'wire/getRelatedListRecordActions/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

function mockNetwork(config, mockData) {
    const { recordIds, relatedListRecordIds, ...queryParams } = config;

    const paramMatch = sinon.match({
        basePath: `${URL_BASE}/actions/record/${recordIds
            .sort()
            .join(',')}/related-list-record/${relatedListRecordIds.sort().join(',')}`,
        queryParams,
    });

    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

describe('basic', () => {
    it('fetches data from network', async () => {
        const mockData = getMock('related-list-record-actions');
        const recordIds = Object.keys(mockData.actions);
        const relatedListRecordId = mockData.actions[recordIds[0]].actions[0].relatedListRecordId;
        const resourceConfig = {
            recordIds: recordIds,
            relatedListRecordIds: [relatedListRecordId],
        };
        mockNetwork(resourceConfig, mockData);

        const element = await setupElement(resourceConfig, RelatedListRecordActions);

        expect(element.getWiredData()).toEqualActionsSnapshot(mockData);
    });
});

describe('config', () => {
    it('gets data with single recordId as string', async () => {
        const mockData = getMock('related-list-record-actions');
        const singleRecordId = Object.keys(mockData.actions).pop();
        const relatedListRecordId = mockData.actions[singleRecordId].actions[0].relatedListRecordId;

        const props = {
            recordIds: [singleRecordId],
            relatedListRecordIds: [relatedListRecordId],
        };
        mockNetwork(props, mockData);

        const config = {
            recordIds: singleRecordId,
            relatedListRecordIds: relatedListRecordId,
        };
        const element = await setupElement(config, RelatedListRecordActions);

        expect(element.getWiredData()).toEqualActionsSnapshot(mockData);
    });
});

describe('caching', () => {
    it('returns cached result when cached data is available', async () => {
        const mockData = getMock('related-list-record-actions');
        const recordIds = Object.keys(mockData.actions);
        const relatedListRecordId = mockData.actions[recordIds[0]].actions[0].relatedListRecordId;
        const config = {
            recordIds: recordIds,
            relatedListRecordIds: [relatedListRecordId],
        };
        mockNetwork(config, mockData);

        // populate cache
        await setupElement(config, RelatedListRecordActions);

        // second component should have the cached data without hitting network
        const element = await setupElement(config, RelatedListRecordActions);

        expect(element.getWiredData()).toEqualActionsSnapshot(mockData);
    });

    it('retrieves data from network when cached data is expired', async () => {
        const mockData = getMock('related-list-record-actions');
        const updatedData = getMock('related-list-record-actions');
        const recordIds = Object.keys(mockData.actions);
        const relatedListRecordId = mockData.actions[recordIds[0]].actions[0].relatedListRecordId;

        updatedData.actions[recordIds[0]].actions.shift();

        const config = {
            recordIds: recordIds,
            relatedListRecordIds: [relatedListRecordId],
        };
        mockNetwork(config, [mockData, updatedData]);

        // populate cache
        await setupElement(config, RelatedListRecordActions);

        // expire cache
        expireActions();

        // second component should retrieve from network with updated data
        const element = await setupElement(config, RelatedListRecordActions);

        expect(element.getWiredData()).toEqualActionsSnapshot(updatedData);
    });
});

describe('data emit', () => {
    it('emits updated data to wire with same config', async () => {
        const mockData = getMock('related-list-record-actions');
        const updatedData = getMock('related-list-record-actions');
        const recordIds = Object.keys(mockData.actions);
        const relatedListRecordId = mockData.actions[recordIds[0]].actions[0].relatedListRecordId;

        updatedData.actions[recordIds[0]].actions.shift();

        const config = {
            recordIds: recordIds,
            relatedListRecordIds: [relatedListRecordId],
        };
        mockNetwork(config, [mockData, updatedData]);

        const element = await setupElement(config, RelatedListRecordActions);
        expireActions();

        // fetches updated data from network
        await setupElement(config, RelatedListRecordActions);

        expect(element.pushCount()).toBe(2);
        expect(element.getWiredData()).toEqualActionsSnapshot(updatedData);
    });

    it('should not emit data to wires if data from network is same', async () => {
        const mockData = getMock('related-list-record-actions');
        const recordIds = Object.keys(mockData.actions);
        const relatedListRecordId = mockData.actions[recordIds[0]].actions[0].relatedListRecordId;

        const config = {
            recordIds: recordIds,
            relatedListRecordIds: [relatedListRecordId],
        };
        mockNetwork(config, [mockData, mockData]);

        const element = await setupElement(config, RelatedListRecordActions);
        expireActions();

        // fetches updated data from network
        await setupElement(config, RelatedListRecordActions);

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredData()).toEqualActionsSnapshot(mockData);
    });
    it('should not emit data to wire with different formFactor', async () => {
        const mockData = getMock('related-list-record-actions');
        const recordIds = Object.keys(mockData.actions);
        const relatedListRecordId = mockData.actions[recordIds[0]].actions[0].relatedListRecordId;

        const config = {
            recordIds: recordIds,
            relatedListRecordIds: [relatedListRecordId],
        };
        mockNetwork(config, mockData);

        const formFactorMockData = getMock('related-list-record-actions-formFactor-Small');
        const formFactorConfig = {
            ...config,
            formFactor: 'Small',
        };
        mockNetwork(formFactorConfig, formFactorMockData);

        const wireA = await setupElement(config, RelatedListRecordActions);
        expect(wireA.getWiredData()).toEqualActionsSnapshot(mockData);

        const wireB = await setupElement(formFactorConfig, RelatedListRecordActions);
        expect(wireB.getWiredData()).toEqualActionsSnapshot(formFactorMockData);

        // verify data for wireB won't be emitted to wireA
        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualActionsSnapshot(mockData);
    });

    it('should not emit data to wire with different sections', async () => {
        const mockData = getMock('related-list-record-actions');
        const recordIds = Object.keys(mockData.actions);
        const relatedListRecordId = mockData.actions[recordIds[0]].actions[0].relatedListRecordId;

        const config = {
            recordIds: recordIds,
            relatedListRecordIds: [relatedListRecordId],
        };
        mockNetwork(config, mockData);

        const sectionsMockData = getMock('related-list-record-actions-sections-Page');
        const sectionsConfig = {
            ...config,
            sections: ['Page'],
        };
        mockNetwork(sectionsConfig, sectionsMockData);

        const wireA = await setupElement(config, RelatedListRecordActions);
        expect(wireA.getWiredData()).toEqualActionsSnapshot(mockData);

        const wireB = await setupElement(sectionsConfig, RelatedListRecordActions);
        expect(wireB.getWiredData()).toEqualActionsSnapshot(sectionsMockData);

        // verify data for wireB won't be emitted to wireA
        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualActionsSnapshot(mockData);
    });

    it('should not emit data to wire with different actionsTypes', async () => {
        const mockData = getMock('related-list-record-actions');
        const recordIds = Object.keys(mockData.actions);
        const relatedListRecordId = mockData.actions[recordIds[0]].actions[0].relatedListRecordId;

        const config = {
            recordIds: recordIds,
            relatedListRecordIds: [relatedListRecordId],
        };
        mockNetwork(config, mockData);

        const actionTypesMockData = getMock(
            'related-list-record-actions-actionTypes-StandardButton'
        );
        const actionTypesConfig = {
            ...config,
            actionTypes: ['StandardButton'],
        };
        mockNetwork(actionTypesConfig, actionTypesMockData);

        const wireA = await setupElement(config, RelatedListRecordActions);
        expect(wireA.getWiredData()).toEqualActionsSnapshot(mockData);

        const wireB = await setupElement(actionTypesConfig, RelatedListRecordActions);
        expect(wireB.getWiredData()).toEqualActionsSnapshot(actionTypesMockData);

        // verify data for wireB won't be emitted to wireA
        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualActionsSnapshot(mockData);
    });
});
