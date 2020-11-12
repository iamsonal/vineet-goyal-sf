import { getMock as globalGetMock, setupElement } from 'test-util';
import { expireActions, mockGetRelatedListsActionsNetwork } from 'uiapi-test-util';
import RelatedListsActions from '../lwc/related-lists-actions';

const MOCK_PREFIX = 'wire/getRelatedListsActions/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('fetches data from network', async () => {
        const mockData = getMock('related-lists-actions');
        const recordIds = Object.keys(mockData.results[0].result.actions);
        const relatedListId =
            mockData.results[0].result.actions[recordIds[0]].actions[0].relatedSourceObject;

        const config = {
            recordIds: recordIds,
            relatedListIds: [relatedListId],
        };
        mockGetRelatedListsActionsNetwork(config, mockData);

        const element = await setupElement(config, RelatedListsActions);

        expect(element.getWiredData()).toEqualActionsBatchSnapshot(mockData);
    });
});

describe('caching', () => {
    it('returns cached result when cached data is available', async () => {
        const mockData = getMock('related-lists-actions');
        const recordIds = Object.keys(mockData.results[0].result.actions);
        const relatedListId =
            mockData.results[0].result.actions[recordIds[0]].actions[0].relatedSourceObject;
        const config = {
            recordIds: recordIds,
            relatedListIds: [relatedListId],
        };
        mockGetRelatedListsActionsNetwork(config, mockData);

        // populate cache
        await setupElement(config, RelatedListsActions);

        // second component should have the cached data without hitting network
        const element = await setupElement(config, RelatedListsActions);

        expect(element.getWiredData()).toEqualActionsBatchSnapshot(mockData);
    });

    it('retrieves data from network when cached data is expired', async () => {
        const mockData = getMock('related-lists-actions');
        const updatedData = getMock('related-lists-actions');
        const recordIds = Object.keys(mockData.results[0].result.actions);
        const relatedListId =
            mockData.results[0].result.actions[recordIds[0]].actions[0].relatedSourceObject;
        updatedData.results[0].result.actions[recordIds[0]].actions.shift();

        const config = {
            recordIds: recordIds,
            relatedListIds: [relatedListId],
        };
        mockGetRelatedListsActionsNetwork(config, [mockData, updatedData]);

        // populate cache
        await setupElement(config, RelatedListsActions);

        // expire cache
        expireActions();

        // second component should retrieve from network with updated data
        const element = await setupElement(config, RelatedListsActions);

        expect(element.getWiredData()).toEqualActionsBatchSnapshot(updatedData);
    });
});

describe('data emit', () => {
    it('emits updated data to wire with same config', async () => {
        const mockData = getMock('related-lists-actions');
        const updatedData = getMock('related-lists-actions');
        const recordIds = Object.keys(mockData.results[0].result.actions);
        const relatedListId =
            mockData.results[0].result.actions[recordIds[0]].actions[0].relatedSourceObject;
        updatedData.results[0].result.actions[recordIds[0]].actions.shift();

        const config = {
            recordIds: recordIds,
            relatedListIds: [relatedListId],
        };
        mockGetRelatedListsActionsNetwork(config, [mockData, updatedData]);

        const element = await setupElement(config, RelatedListsActions);
        expireActions();

        // fetches updated data from network
        await setupElement(config, RelatedListsActions);

        expect(element.pushCount()).toBe(2);
        expect(element.getWiredData()).toEqualActionsBatchSnapshot(updatedData);
    });

    it('should not emit data to wires if data from network is same', async () => {
        const mockData = getMock('related-lists-actions');
        const recordIds = Object.keys(mockData.results[0].result.actions);
        const relatedListId =
            mockData.results[0].result.actions[recordIds[0]].actions[0].relatedSourceObject;

        const config = {
            recordIds: recordIds,
            relatedListIds: [relatedListId],
        };
        mockGetRelatedListsActionsNetwork(config, [mockData, mockData]);

        const element = await setupElement(config, RelatedListsActions);
        expireActions();

        // fetches updated data from network
        await setupElement(config, RelatedListsActions);

        expect(element.pushCount()).toBe(1);
    });
});
