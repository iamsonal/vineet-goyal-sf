import { deleteRecord } from 'lds-adapters-uiapi';
import { getMock as globalGetMock, setupElement, updateElement } from 'test-util';
import {
    expireRelatedListRecordCollection,
    mockDeleteRecordNetwork,
    mockGetRelatedListRecordsNetworkPost,
} from 'uiapi-test-util';

import RelatedListBasic from '../lwc/related-list-basic';

const MOCK_PREFIX = 'wire/getRelatedListRecords/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets data with valid parentRecordId and relatedListId', async () => {
        const mockData = getMock('related-list-records-Custom');
        const resourceConfig = {
            uriParams: {
                parentRecordId: mockData.listReference.inContextOfRecordId,
                relatedListId: mockData.listReference.relatedListId,
            },
            body: {
                fields: mockData.fields,
            },
        };

        mockGetRelatedListRecordsNetworkPost(resourceConfig, mockData);

        const props = {
            parentRecordId: mockData.listReference.inContextOfRecordId,
            relatedListId: mockData.listReference.relatedListId,
            fields: mockData.fields,
        };
        const element = await setupElement(props, RelatedListBasic);
        expect(element.getWiredData()).toEqualSyntheticCursorListSnapshot(mockData);
    });

    it('gets data when specifying optionalFields and they are NOT returned', async () => {
        const mockData = getMock('related-list-records-OptionalFields-Custom');
        const resourceConfig = {
            uriParams: {
                parentRecordId: mockData.listReference.inContextOfRecordId,
                relatedListId: mockData.listReference.relatedListId,
            },
            body: {
                fields: mockData.fields,
                optionalFields: mockData.optionalFields,
            },
        };
        mockGetRelatedListRecordsNetworkPost(resourceConfig, mockData);

        const props = {
            parentRecordId: mockData.listReference.inContextOfRecordId,
            relatedListId: mockData.listReference.relatedListId,
            fields: mockData.fields,
            optionalFields: mockData.optionalFields,
        };
        const element = await setupElement(props, RelatedListBasic);
        expect(element.getWiredData()).toEqualSyntheticCursorListSnapshot(mockData);
    });

    it('gets data when specifying optionalFields and they are returned', async () => {
        const mockData = getMock('related-list-records-OptionalFieldsIncluded-Custom');
        const resourceConfig = {
            uriParams: {
                parentRecordId: mockData.listReference.inContextOfRecordId,
                relatedListId: mockData.listReference.relatedListId,
            },
            body: {
                fields: mockData.fields,
                optionalFields: mockData.optionalFields,
            },
        };
        mockGetRelatedListRecordsNetworkPost(resourceConfig, mockData);

        const props = {
            parentRecordId: mockData.listReference.inContextOfRecordId,
            relatedListId: mockData.listReference.relatedListId,
            fields: mockData.fields,
            optionalFields: mockData.optionalFields,
        };
        const element = await setupElement(props, RelatedListBasic);
        expect(element.getWiredData()).toEqualSyntheticCursorListSnapshot(mockData);
    });

    it('gets data when specifying fields + optionalFields with entity prefix', async () => {
        const mockData = getMock('related-list-records-prefixed-fields');
        const resourceConfig = {
            uriParams: {
                parentRecordId: mockData.listReference.inContextOfRecordId,
                relatedListId: mockData.listReference.relatedListId,
            },
            body: {
                fields: mockData.fields,
                optionalFields: mockData.optionalFields,
            },
        };
        mockGetRelatedListRecordsNetworkPost(resourceConfig, mockData);

        const props = {
            parentRecordId: mockData.listReference.inContextOfRecordId,
            relatedListId: mockData.listReference.relatedListId,
            fields: mockData.fields,
            optionalFields: mockData.optionalFields,
        };
        const element = await setupElement(props, RelatedListBasic);
        expect(element.getWiredData()).toEqualSyntheticCursorListSnapshot(mockData);
    });

    it('gets data when specifying junction object fields', async () => {
        const mockData = getMock('related-list-records-junction-object-fields');
        const resourceConfig = {
            uriParams: {
                parentRecordId: mockData.listReference.inContextOfRecordId,
                relatedListId: mockData.listReference.relatedListId,
            },
            body: {
                fields: mockData.fields,
                optionalFields: mockData.optionalFields,
                pageSize: mockData.pageSize,
            },
        };
        mockGetRelatedListRecordsNetworkPost(resourceConfig, mockData);

        const props = {
            parentRecordId: mockData.listReference.inContextOfRecordId,
            relatedListId: mockData.listReference.relatedListId,
            fields: mockData.fields,
            optionalFields: mockData.optionalFields,
            pageSize: mockData.pageSize,
        };
        const element = await setupElement(props, RelatedListBasic);
        expect(element.getWiredData()).toEqualSyntheticCursorListSnapshot(mockData);
    });

    it('gets data with no records', async () => {
        const mockData = getMock('related-list-records-empty-Custom');
        const resourceConfig = {
            uriParams: {
                parentRecordId: mockData.listReference.inContextOfRecordId,
                relatedListId: mockData.listReference.relatedListId,
            },
            body: {
                fields: mockData.fields,
            },
        };
        mockGetRelatedListRecordsNetworkPost(resourceConfig, mockData);

        const props = {
            parentRecordId: mockData.listReference.inContextOfRecordId,
            relatedListId: mockData.listReference.relatedListId,
            fields: mockData.fields,
        };
        const element = await setupElement(props, RelatedListBasic);

        expect(element.getWiredData()).toEqualSyntheticCursorListSnapshot(mockData);
    });

    it('refreshes related list records', async () => {
        const mockData = getMock('related-list-records-Custom');
        const refreshedMockData = getMock('related-list-records-Custom');
        const firstRecord = refreshedMockData.records[0];

        // Update the refreshed record data to be different
        firstRecord.fields.Name.value += ' new';
        firstRecord.eTag += '999';

        const resourceConfig = {
            uriParams: {
                parentRecordId: mockData.listReference.inContextOfRecordId,
                relatedListId: mockData.listReference.relatedListId,
            },
            body: {
                fields: mockData.fields,
            },
        };
        mockGetRelatedListRecordsNetworkPost(resourceConfig, [mockData, refreshedMockData]);

        const props = {
            parentRecordId: mockData.listReference.inContextOfRecordId,
            relatedListId: mockData.listReference.relatedListId,
            fields: mockData.fields,
        };
        const element = await setupElement(props, RelatedListBasic);

        expect(element.getWiredData()).toEqualSyntheticCursorListSnapshot(mockData);
        expect(element.pushCount()).toBe(1);

        await element.refresh();

        expect(element.getWiredData()).toEqualSyntheticCursorListSnapshot(refreshedMockData);
        expect(element.pushCount()).toBe(2);
    });

    it('delete record refreshes related list records', async () => {
        const mockData = getMock('related-list-records-Custom');
        const refreshedMockData = getMock('related-list-records-Custom');

        const resourceConfig = {
            uriParams: {
                parentRecordId: mockData.listReference.inContextOfRecordId,
                relatedListId: mockData.listReference.relatedListId,
            },
            body: {
                fields: mockData.fields,
            },
        };

        const recordId = refreshedMockData.records.splice(0, 1)[0].id;
        refreshedMockData.count = refreshedMockData.count - 1;
        mockGetRelatedListRecordsNetworkPost(resourceConfig, [mockData, refreshedMockData]);

        const props = {
            parentRecordId: mockData.listReference.inContextOfRecordId,
            relatedListId: mockData.listReference.relatedListId,
            fields: mockData.fields,
        };
        const element = await setupElement(props, RelatedListBasic);

        expect(element.getWiredData()).toEqualSyntheticCursorListSnapshot(mockData);
        expect(element.pushCount()).toBe(1);

        // Delete the record from lds, our component should refresh automatically
        mockDeleteRecordNetwork(recordId);
        await deleteRecord(recordId);

        expect(element.getWiredData()).toEqualSyntheticCursorListSnapshot(refreshedMockData);
        expect(element.pushCount()).toBe(2);
    });

    it('refresh list with deleted records', async () => {
        const mockData = getMock('related-list-records-Custom');
        const refreshedMockData = getMock('related-list-records-Custom');
        refreshedMockData.records.splice(0, 1); // remove the first record
        refreshedMockData.count = refreshedMockData.count - 1;

        const resourceConfig = {
            uriParams: {
                parentRecordId: mockData.listReference.inContextOfRecordId,
                relatedListId: mockData.listReference.relatedListId,
            },
            body: {
                fields: mockData.fields,
            },
        };
        mockGetRelatedListRecordsNetworkPost(resourceConfig, [mockData, refreshedMockData]);

        const props = {
            parentRecordId: mockData.listReference.inContextOfRecordId,
            relatedListId: mockData.listReference.relatedListId,
            fields: mockData.fields,
        };
        const element = await setupElement(props, RelatedListBasic);

        expect(element.getWiredData()).toEqualSyntheticCursorListSnapshot(mockData);
        expect(element.pushCount()).toBe(1);

        await element.refresh();

        expect(element.getWiredData()).toEqualSyntheticCursorListSnapshot(refreshedMockData);
        expect(element.pushCount()).toBe(2);
    });

    it('returns updated result when cached data is expired with no record linking', async () => {
        const mockData = getMock('related-list-records-Custom');
        const noRecordsMockData = getMock('related-list-no-records-Custom');
        const resourceConfig = {
            uriParams: {
                parentRecordId: mockData.listReference.inContextOfRecordId,
                relatedListId: mockData.listReference.relatedListId,
            },
            body: {
                fields: mockData.fields,
            },
        };

        const componentConfig = {
            parentRecordId: mockData.listReference.inContextOfRecordId,
            relatedListId: mockData.listReference.relatedListId,
            fields: mockData.fields,
        };

        mockGetRelatedListRecordsNetworkPost(resourceConfig, [noRecordsMockData, mockData]);

        // populate cache
        await setupElement(componentConfig, RelatedListBasic);

        expireRelatedListRecordCollection();
        // second component should have the updated data by hitting network
        const element = await setupElement(componentConfig, RelatedListBasic);
        expect(element.getWiredData()).toEqualSyntheticCursorListSnapshot(mockData);
    });

    it('reuses cached records and only request missing records', async () => {
        const page1MockData = getMock('mockData-token-0-pageSize-2');

        const page1NetworkConfig = {
            uriParams: {
                parentRecordId: page1MockData.listReference.inContextOfRecordId,
                relatedListId: page1MockData.listReference.relatedListId,
            },
            body: {
                pageSize: 2,
                fields: page1MockData.fields,
            },
        };
        mockGetRelatedListRecordsNetworkPost(page1NetworkConfig, page1MockData);

        const page1Config = {
            ...page1NetworkConfig.uriParams,
            ...page1NetworkConfig.body,
        };
        // request initial page with page size 2
        const element = await setupElement(page1Config, RelatedListBasic);
        const page1Data = element.getWiredData();
        expect(page1Data).toEqualSyntheticCursorListSnapshot(page1MockData);

        const page2MockData = getMock('mockData-token-2-pageSize-2');
        const page2NetworkConfig = {
            uriParams: {
                parentRecordId: page1MockData.listReference.inContextOfRecordId,
                relatedListId: page1MockData.listReference.relatedListId,
            },
            body: {
                pageSize: 2,
                pageToken: '2',
                fields: page1MockData.fields,
            },
        };
        mockGetRelatedListRecordsNetworkPost(page2NetworkConfig, page2MockData);

        // component asks for more items with page size 4,
        // the adapter only request missing items with page size 2
        await updateElement(element, { pageSize: 4 });
        const pageSize4Data = element.getWiredData();
        expect(pageSize4Data.records.length).toEqual(4);

        const page3MockData = getMock('mockData-token-4-pageSize-2');
        const page3NetworkConfig = {
            uriParams: {
                parentRecordId: page1MockData.listReference.inContextOfRecordId,
                relatedListId: page1MockData.listReference.relatedListId,
            },
            body: {
                pageSize: 2,
                pageToken: '4',
                fields: page1MockData.fields,
            },
        };
        mockGetRelatedListRecordsNetworkPost(page3NetworkConfig, page3MockData);

        // component asks for more items with page size 6,
        // the adapter only request the missing items with page size 2,
        // the full list only has 5 items
        await updateElement(element, { pageSize: 6 });
        const pageSize6MockData = getMock('mockData-token-0-pageSize-6'); // contains 5 records
        expect(element.getWiredData()).toEqualSyntheticCursorListSnapshot(pageSize6MockData);
    });
});
