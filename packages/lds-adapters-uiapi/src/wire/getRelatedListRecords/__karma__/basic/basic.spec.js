import { deleteRecord } from 'lds';
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

// TODO: Remove this code once extra fields aren't returned from uiapi (test only issue since they're stripped out at runtime by lds)
function stripExtraFields(mockData) {
    mockData.records.forEach(record => {
        Object.keys(record.fields).forEach(key => {
            const requestedFields = mockData.fields.concat(mockData.optionalFields);
            if (!(requestedFields.indexOf(key) > -1)) {
                delete record.fields[key];
            }
        });
    });
    return mockData;
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
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(stripExtraFields(mockData));
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

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(stripExtraFields(mockData));
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

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(stripExtraFields(mockData));
        expect(element.pushCount()).toBe(1);

        await element.refresh();

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(
            stripExtraFields(refreshedMockData)
        );
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

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(stripExtraFields(mockData));
        expect(element.pushCount()).toBe(1);

        // Delete the record from lds, our component should refresh automatically
        mockDeleteRecordNetwork(recordId);
        await deleteRecord(recordId);

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(
            stripExtraFields(refreshedMockData)
        );
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

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(stripExtraFields(mockData));
        expect(element.pushCount()).toBe(1);

        await element.refresh();

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(
            stripExtraFields(refreshedMockData)
        );
        expect(element.pushCount()).toBe(2);
    });
});
