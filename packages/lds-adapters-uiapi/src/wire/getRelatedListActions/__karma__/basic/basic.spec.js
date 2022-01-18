import { getMock as globalGetMock, setupElement } from 'test-util';
import { expireActions, mockGetRelatedListActionsNetwork } from 'uiapi-test-util';
import RelatedListActions from '../lwc/related-list-actions';

const MOCK_PREFIX = 'wire/getRelatedListActions/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('fetches data from network', async () => {
        const mockData = getMock('related-list-actions');
        const recordIds = Object.keys(mockData.actions);
        const relatedListId = mockData.actions[recordIds[0]].actions[0].relatedSourceObject;
        const config = {
            recordIds: recordIds,
            relatedListId: relatedListId,
        };
        mockGetRelatedListActionsNetwork(config, mockData);

        const element = await setupElement(config, RelatedListActions);
        expect(element.getWiredData()).toEqualActionsSnapshot(mockData);
        expect(element.getWiredData().actions['a02RM0000001KfqYAE'].actions.length).toEqual(3);
        expect(element.getWiredData().actions['a02RM0000001KfqYAE'].actions[0].apiName).toEqual(
            'New'
        );
        expect(element.getWiredData().actions['a02RM0000001KfqYAE'].actions[1].apiName).toEqual(
            'testMassA'
        );
        expect(element.getWiredData().actions['a02RM0000001KfqYAE'].actions[2].apiName).toEqual(
            'testMassB'
        );

        const mockDataApiNames = getMock('related-list-actions-apiNames'); // only defines testMassA, testMassB
        const configApiNames = {
            recordIds: recordIds,
            relatedListId: relatedListId,
            apiNames: ['testMassA', 'testMassB'],
        };
        mockGetRelatedListActionsNetwork(configApiNames, mockDataApiNames);

        const elementApiNames = await setupElement(configApiNames, RelatedListActions);
        expect(elementApiNames.getWiredData()).toEqualActionsSnapshot(mockDataApiNames);
        expect(elementApiNames.getWiredData().actions['a02RM0000001KfqYAE'].actions.length).toEqual(
            2
        );
        expect(
            elementApiNames.getWiredData().actions['a02RM0000001KfqYAE'].actions[0].apiName
        ).toEqual('testMassA');
        expect(
            elementApiNames.getWiredData().actions['a02RM0000001KfqYAE'].actions[1].apiName
        ).toEqual('testMassB');

        const mockDataRetrievalMode = getMock('related-list-actions-retrievalMode'); // only defines New
        const configRetrievalMode = {
            recordIds: recordIds,
            relatedListId: relatedListId,
            retrievalMode: 'PageLayout',
        };
        mockGetRelatedListActionsNetwork(configRetrievalMode, mockDataRetrievalMode);

        const elementRetrievalMode = await setupElement(configRetrievalMode, RelatedListActions);
        expect(elementRetrievalMode.getWiredData()).toEqualActionsSnapshot(mockDataRetrievalMode);
        expect(
            elementRetrievalMode.getWiredData().actions['a02RM0000001KfqYAE'].actions.length
        ).toEqual(1);
        expect(
            elementRetrievalMode.getWiredData().actions['a02RM0000001KfqYAE'].actions[0].apiName
        ).toEqual('New');
    });
});

describe('caching', () => {
    it('returns cached result when cached data is available', async () => {
        const mockData = getMock('related-list-actions');
        const recordIds = Object.keys(mockData.actions);
        const relatedListId = mockData.actions[recordIds[0]].actions[0].relatedSourceObject;
        const config = {
            recordIds: recordIds,
            relatedListId: relatedListId,
        };
        mockGetRelatedListActionsNetwork(config, mockData);
        // populate cache
        await setupElement(config, RelatedListActions);
        // second component should have the cached data without hitting network
        const element = await setupElement(config, RelatedListActions);
        expect(element.getWiredData()).toEqualActionsSnapshot(mockData);
        expect(element.getWiredData().actions['a02RM0000001KfqYAE'].actions[0].apiName).toEqual(
            'New'
        );
        expect(element.getWiredData().actions['a02RM0000001KfqYAE'].actions[1].apiName).toEqual(
            'testMassA'
        );
        expect(element.getWiredData().actions['a02RM0000001KfqYAE'].actions[2].apiName).toEqual(
            'testMassB'
        );

        const configUndefined = {
            recordIds: recordIds,
            relatedListId: relatedListId,
            apiNames: undefined,
            retrievalMode: undefined,
        };
        // this test verifies that passing in apiNames and retrievalMode as undefined hits the cache
        const elementUndefined = await setupElement(configUndefined, RelatedListActions);
        expect(elementUndefined.getWiredData()).toEqualActionsSnapshot(mockData);

        const configNull = {
            recordIds: recordIds,
            relatedListId: relatedListId,
            apiNames: null,
            retrievalMode: null,
        };
        // this test verifies that passing in apiNames and retrievalMode as null hits the cache
        const elementNull = await setupElement(configNull, RelatedListActions);
        expect(elementNull.getWiredData()).toEqualActionsSnapshot(mockData);

        const mockDataApiNames = getMock('related-list-actions-apiNames'); // only defines testMassA, testMassB
        const configApiNames = {
            recordIds: recordIds,
            relatedListId: relatedListId,
            apiNames: ['testMassA', 'testMassB'],
        };
        mockGetRelatedListActionsNetwork(configApiNames, mockDataApiNames);
        // populate cache
        await setupElement(configApiNames, RelatedListActions);
        // second component should have the cached data without hitting network
        const elementApiNames = await setupElement(configApiNames, RelatedListActions);
        expect(elementApiNames.getWiredData()).toEqualActionsSnapshot(mockDataApiNames);
        expect(
            elementApiNames.getWiredData().actions['a02RM0000001KfqYAE'].actions[0].apiName
        ).toEqual('testMassA');
        expect(
            elementApiNames.getWiredData().actions['a02RM0000001KfqYAE'].actions[1].apiName
        ).toEqual('testMassB');

        const mockDataRetrievalMode = getMock('related-list-actions-retrievalMode'); // only defines New
        const configRetrievalMode = {
            recordIds: recordIds,
            relatedListId: relatedListId,
            retrievalMode: 'PageLayout',
        };
        mockGetRelatedListActionsNetwork(configRetrievalMode, mockDataRetrievalMode);
        // populate cache
        await setupElement(configRetrievalMode, RelatedListActions);
        // second component should have the cached data without hitting network
        const elementRetrievalMode = await setupElement(configRetrievalMode, RelatedListActions);
        expect(elementRetrievalMode.getWiredData()).toEqualActionsSnapshot(mockDataRetrievalMode);
        expect(
            elementRetrievalMode.getWiredData().actions['a02RM0000001KfqYAE'].actions.length
        ).toEqual(1);
        expect(
            elementRetrievalMode.getWiredData().actions['a02RM0000001KfqYAE'].actions[0].apiName
        ).toEqual('New');
    });

    it('retrieves data from network when cached data is expired', async () => {
        const mockData = getMock('related-list-actions');
        const updatedData = getMock('related-list-actions');
        const recordIds = Object.keys(mockData.actions);
        const relatedListId = mockData.actions[recordIds[0]].actions[0].relatedSourceObject;
        updatedData.actions[recordIds[0]].actions.shift();

        const config = {
            recordIds: recordIds,
            relatedListId: relatedListId,
        };
        mockGetRelatedListActionsNetwork(config, [mockData, updatedData]);

        // populate cache
        await setupElement(config, RelatedListActions);

        // expire cache
        expireActions();

        // second component should retrieve from network with updated data
        const element = await setupElement(config, RelatedListActions);

        expect(element.getWiredData()).toEqualActionsSnapshot(updatedData);
    });
});

describe('data emit', () => {
    it('emits updated data to wire with same config', async () => {
        const mockData = getMock('related-list-actions');
        const updatedData = getMock('related-list-actions');
        const recordIds = Object.keys(mockData.actions);
        const relatedListId = mockData.actions[recordIds[0]].actions[0].relatedSourceObject;
        updatedData.actions[recordIds[0]].actions.shift();

        const config = {
            recordIds: recordIds,
            relatedListId: relatedListId,
        };
        mockGetRelatedListActionsNetwork(config, [mockData, updatedData]);

        const element = await setupElement(config, RelatedListActions);
        expireActions();

        // fetches updated data from network
        await setupElement(config, RelatedListActions);

        expect(element.pushCount()).toBe(2);
        expect(element.getWiredData()).toEqualActionsSnapshot(updatedData);
    });

    it('should not emit data to wires if data from network is same', async () => {
        const mockData = getMock('related-list-actions');
        const recordIds = Object.keys(mockData.actions);
        const relatedListId = mockData.actions[recordIds[0]].actions[0].relatedSourceObject;

        const config = {
            recordIds: recordIds,
            relatedListId: relatedListId,
        };
        mockGetRelatedListActionsNetwork(config, [mockData, mockData]);

        const element = await setupElement(config, RelatedListActions);
        expireActions();

        // fetches updated data from network
        await setupElement(config, RelatedListActions);

        expect(element.pushCount()).toBe(1);
    });
});
