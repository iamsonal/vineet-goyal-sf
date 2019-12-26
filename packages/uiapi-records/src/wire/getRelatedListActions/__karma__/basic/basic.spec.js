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
            recordId: recordIds,
            relatedListIds: [relatedListId],
        };
        mockGetRelatedListActionsNetwork(config, mockData);

        const element = await setupElement(config, RelatedListActions);

        expect(element.getWiredData()).toEqualActionsSnapshot(mockData);
    });
});

describe('caching', () => {
    it('returns cached result when cached data is available', async () => {
        const mockData = getMock('related-list-actions');
        const recordIds = Object.keys(mockData.actions);
        const relatedListId = mockData.actions[recordIds[0]].actions[0].relatedSourceObject;
        const config = {
            recordId: recordIds,
            relatedListIds: [relatedListId],
        };
        mockGetRelatedListActionsNetwork(config, mockData);

        // populate cache
        await setupElement(config, RelatedListActions);

        // second component should have the cached data without hitting network
        const element = await setupElement(config, RelatedListActions);

        expect(element.getWiredData()).toEqualActionsSnapshot(mockData);
    });

    it('retrieves data from network when cached data is expired', async () => {
        const mockData = getMock('related-list-actions');
        const updatedData = getMock('related-list-actions');
        const recordIds = Object.keys(mockData.actions);
        const relatedListId = mockData.actions[recordIds[0]].actions[0].relatedSourceObject;
        updatedData.actions[recordIds[0]].actions.shift();

        const config = {
            recordId: recordIds,
            relatedListIds: [relatedListId],
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
            recordId: recordIds,
            relatedListIds: [relatedListId],
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
            recordId: recordIds,
            relatedListIds: [relatedListId],
        };
        mockGetRelatedListActionsNetwork(config, [mockData, mockData]);

        const element = await setupElement(config, RelatedListActions);
        expireActions();

        // fetches updated data from network
        await setupElement(config, RelatedListActions);

        expect(element.pushCount()).toBe(1);
    });
});
