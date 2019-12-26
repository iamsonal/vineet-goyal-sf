import { getMock as globalGetMock, setupElement } from 'test-util';
import { expireActions, mockGetRecordActionsNetwork } from 'uiapi-test-util';

import RecordActions from '../lwc/record-actions';

const MOCK_PREFIX = 'wire/getRecordActions/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('fetches data from network', async () => {
        const mockData = getMock('record-actions');
        const recordIds = Object.keys(mockData.actions);
        const config = {
            recordId: recordIds,
            sections: ['PAGE'],
        };
        mockGetRecordActionsNetwork(config, mockData);

        const element = await setupElement(config, RecordActions);

        expect(element.getWiredData()).toEqualActionsSnapshot(mockData);
    });
});

describe('caching', () => {
    it('returns cached result when cached data is available', async () => {
        const mockData = getMock('record-actions');
        const recordIds = Object.keys(mockData.actions);
        const config = {
            recordId: recordIds,
            sections: ['PAGE'],
        };
        mockGetRecordActionsNetwork(config, mockData);

        // populate cache
        await setupElement(config, RecordActions);

        // second component should have the cached data without hitting network
        const element = await setupElement(config, RecordActions);

        expect(element.getWiredData()).toEqualActionsSnapshot(mockData);
    });

    it('retrieves data from network when cached data is expired', async () => {
        const mockData = getMock('record-actions');
        const updatedData = getMock('record-actions');
        const recordIds = Object.keys(mockData.actions);
        updatedData.actions[recordIds[0]].actions.shift();

        const config = {
            recordId: recordIds,
            sections: ['PAGE'],
        };
        mockGetRecordActionsNetwork(config, [mockData, updatedData]);

        // populate cache
        await setupElement(config, RecordActions);

        // expire cache
        expireActions();

        // second component should retrieve from network with updated data
        const element = await setupElement(config, RecordActions);

        expect(element.getWiredData()).toEqualActionsSnapshot(updatedData);
    });
});

describe('data emit', () => {
    it('emits updated data to wire with same config', async () => {
        const mockData = getMock('record-actions');
        const updatedData = getMock('record-actions');
        const recordIds = Object.keys(mockData.actions);
        updatedData.actions[recordIds[0]].actions.shift();

        const config = {
            recordId: recordIds,
            sections: ['PAGE'],
        };
        mockGetRecordActionsNetwork(config, [mockData, updatedData]);

        const element = await setupElement(config, RecordActions);
        expireActions();

        // fetches updated data from network
        await setupElement(config, RecordActions);

        expect(element.pushCount()).toBe(2);
        expect(element.getWiredData()).toEqualActionsSnapshot(updatedData);
    });

    it('should not emit data to wires if data from network is same', async () => {
        const mockData = getMock('record-actions');
        const recordIds = Object.keys(mockData.actions);

        const config = {
            recordId: recordIds,
            sections: ['PAGE'],
        };
        mockGetRecordActionsNetwork(config, [mockData, mockData]);

        const element = await setupElement(config, RecordActions);
        expireActions();

        // fetches updated data from network
        await setupElement(config, RecordActions);

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredData()).toEqualActionsSnapshot(mockData);
    });

    it('should not emit data to wire with different apiNames', async () => {
        const mockData = getMock('record-actions');
        const recordIds = Object.keys(mockData.actions);

        const config = {
            recordId: recordIds,
            sections: ['PAGE'],
        };
        mockGetRecordActionsNetwork(config, mockData);

        const apiNamesMockData = getMock('record-actions-apiNames-Follow,Global.NewTask');
        const apiNamesConfig = {
            recordId: recordIds,
            apiNames: ['Follow', 'Global.NewTask'],
        };
        mockGetRecordActionsNetwork(apiNamesConfig, apiNamesMockData);

        const wireA = await setupElement(config, RecordActions);
        expect(wireA.getWiredData()).toEqualActionsSnapshot(mockData);

        const wireB = await setupElement(apiNamesConfig, RecordActions);
        expect(wireB.getWiredData()).toEqualActionsSnapshot(apiNamesMockData);

        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualActionsSnapshot(mockData);
    });

    it('should not emit data to wire with different retrievalMode', async () => {
        const mockData = getMock('record-actions');
        const recordIds = Object.keys(mockData.actions);

        const config = {
            recordId: recordIds,
            sections: ['PAGE'],
        };
        mockGetRecordActionsNetwork(config, mockData);

        const retrievalModeMockData = getMock('record-actions-retrievalMode-All');
        const retrievalModeConfig = {
            recordId: recordIds,
            sections: ['PAGE'],
            retrievalMode: 'All',
        };
        mockGetRecordActionsNetwork(retrievalModeConfig, retrievalModeMockData);

        const wireA = await setupElement(config, RecordActions);
        expect(wireA.getWiredData()).toEqualActionsSnapshot(mockData);

        const wireB = await setupElement(retrievalModeConfig, RecordActions);
        expect(wireB.getWiredData()).toEqualActionsSnapshot(retrievalModeMockData);

        // verify data for wireB won't be emitted to wireA
        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualActionsSnapshot(mockData);
    });

    it('should not emit data to wire with different actionType', async () => {
        const mockData = getMock('record-actions');
        const recordIds = Object.keys(mockData.actions);

        const config = {
            recordId: recordIds,
            sections: ['PAGE'],
        };
        mockGetRecordActionsNetwork(config, mockData);

        const actionTypesMockData = getMock('record-actions-actionTypes-StandardButton');
        const actionTypesConfig = {
            recordId: recordIds,
            sections: ['PAGE'],
            actionTypes: ['StandardButton'],
        };
        mockGetRecordActionsNetwork(actionTypesConfig, actionTypesMockData);

        const wireA = await setupElement(config, RecordActions);
        expect(wireA.getWiredData()).toEqualActionsSnapshot(mockData);

        const wireB = await setupElement(actionTypesConfig, RecordActions);
        expect(wireB.getWiredData()).toEqualActionsSnapshot(actionTypesMockData);

        // verify data for wireB won't be emitted to wireA
        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualActionsSnapshot(mockData);
    });

    it('should not emit data to wire with different formFactor', async () => {
        const mockData = getMock('record-actions-apiNames-Follow,Global.NewTask');
        const recordIds = Object.keys(mockData.actions);

        const config = {
            recordId: recordIds,
            apiNames: ['Follow', 'Global.NewTask'],
        };
        mockGetRecordActionsNetwork(config, mockData);

        const formFactorMockData = getMock(
            'record-actions-apiNames-Follow,Global.NewTask-formFactor-Small'
        );
        const formFactorConfig = {
            recordId: recordIds,
            apiNames: ['Follow', 'Global.NewTask'],
            formFactor: 'Small',
        };
        mockGetRecordActionsNetwork(formFactorConfig, formFactorMockData);

        const wireA = await setupElement(config, RecordActions);
        expect(wireA.getWiredData()).toEqualActionsSnapshot(mockData);

        const wireB = await setupElement(formFactorConfig, RecordActions);
        expect(wireB.getWiredData()).toEqualActionsSnapshot(formFactorMockData);

        // verify data for wireB won't be emitted to wireA
        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualActionsSnapshot(mockData);
    });

    it('should not emit data to wire with different sections', async () => {
        const mockData = getMock('record-actions');
        const recordIds = Object.keys(mockData.actions);

        const config = {
            recordId: recordIds,
            sections: ['PAGE'],
        };
        mockGetRecordActionsNetwork(config, mockData);

        const sectionsMockData = getMock('record-actions-sections-SingleActionLinks');
        const sectionsConfig = {
            recordId: recordIds,
            sections: ['SingleActionLinks'],
        };
        mockGetRecordActionsNetwork(sectionsConfig, sectionsMockData);

        const wireA = await setupElement(config, RecordActions);
        expect(wireA.getWiredData()).toEqualActionsSnapshot(mockData);

        const wireB = await setupElement(sectionsConfig, RecordActions);
        expect(wireB.getWiredData()).toEqualActionsSnapshot(sectionsMockData);

        // verify data for wireB won't be emitted to wireA
        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualActionsSnapshot(mockData);
    });
});
