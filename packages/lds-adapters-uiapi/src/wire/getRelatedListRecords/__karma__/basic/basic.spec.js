import { deleteRecord } from 'lds-adapters-uiapi';
import { getMock as globalGetMock, setupElement } from 'test-util';
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
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
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
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
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
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
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
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
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
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
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

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
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

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
        expect(element.pushCount()).toBe(1);

        await element.refresh();

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(refreshedMockData);
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

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
        expect(element.pushCount()).toBe(1);

        // Delete the record from lds, our component should refresh automatically
        mockDeleteRecordNetwork(recordId);
        await deleteRecord(recordId);

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(refreshedMockData);
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

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
        expect(element.pushCount()).toBe(1);

        await element.refresh();

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(refreshedMockData);
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
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
        expect(element.getWiredData()).toBeImmutable();
    });
});
