import { deleteRecord } from 'lds-adapters-uiapi';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockDeleteRecordNetwork,
    mockGetRelatedListRecordsNetwork,
} from '../../../../../karma/uiapi-test-util';

import RelatedListBasic from '../lwc/related-list-basic';

const MOCK_PREFIX = 'wire/getRelatedListRecords/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets data with valid parentRecordId and relatedListId', async () => {
        const mockData = getMock('related-list-records-Custom');
        const resourceConfig = {
            parentRecordId: mockData.listReference.inContextOfRecordId,
            relatedListId: mockData.listReference.relatedListId,
            fields: mockData.fields,
        };
        mockGetRelatedListRecordsNetwork(resourceConfig, mockData);

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
            parentRecordId: mockData.listReference.inContextOfRecordId,
            relatedListId: mockData.listReference.relatedListId,
            fields: mockData.fields,
            optionalFields: mockData.optionalFields,
        };
        mockGetRelatedListRecordsNetwork(resourceConfig, mockData);

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
            parentRecordId: mockData.listReference.inContextOfRecordId,
            relatedListId: mockData.listReference.relatedListId,
            fields: mockData.fields,
            optionalFields: mockData.optionalFields,
        };
        mockGetRelatedListRecordsNetwork(resourceConfig, mockData);

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
            parentRecordId: mockData.listReference.inContextOfRecordId,
            relatedListId: mockData.listReference.relatedListId,
            fields: mockData.fields,
            optionalFields: mockData.optionalFields,
        };
        mockGetRelatedListRecordsNetwork(resourceConfig, mockData);

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
            parentRecordId: mockData.listReference.inContextOfRecordId,
            relatedListId: mockData.listReference.relatedListId,
            fields: mockData.fields,
            optionalFields: mockData.optionalFields,
            pageSize: mockData.pageSize,
        };
        mockGetRelatedListRecordsNetwork(resourceConfig, mockData);

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
            parentRecordId: mockData.listReference.inContextOfRecordId,
            relatedListId: mockData.listReference.relatedListId,
            fields: mockData.fields,
        };
        mockGetRelatedListRecordsNetwork(resourceConfig, mockData);

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
            parentRecordId: mockData.listReference.inContextOfRecordId,
            relatedListId: mockData.listReference.relatedListId,
            fields: mockData.fields,
        };
        mockGetRelatedListRecordsNetwork(resourceConfig, [mockData, refreshedMockData]);

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

    // Test disabled until W-7096496 is fixed
    xit('delete record refreshes related list records', async () => {
        const mockData = getMock('related-list-records-Custom');
        const refreshedMockData = getMock('related-list-records-Custom');

        const resourceConfig = {
            parentRecordId: mockData.listReference.inContextOfRecordId,
            relatedListId: mockData.listReference.relatedListId,
            fields: mockData.fields,
        };

        const recordId = refreshedMockData.records.splice(0, 1)[0].id;
        mockGetRelatedListRecordsNetwork(resourceConfig, [mockData, refreshedMockData]);

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

    // Test disabled until W-7096496 is fixed
    xit('refresh list with deleted records', async () => {
        const mockData = getMock('related-list-records-Custom');
        const refreshedMockData = getMock('related-list-records-Custom');
        refreshedMockData.records.splice(0, 1); // remove the first record

        const resourceConfig = {
            parentRecordId: mockData.listReference.inContextOfRecordId,
            relatedListId: mockData.listReference.relatedListId,
            fields: mockData.fields,
        };
        mockGetRelatedListRecordsNetwork(resourceConfig, [mockData, refreshedMockData]);

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
});
