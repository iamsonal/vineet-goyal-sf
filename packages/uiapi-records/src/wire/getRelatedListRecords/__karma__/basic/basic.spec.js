import { karmaNetworkAdapter, deleteRecord } from 'lds';
import sinon from 'sinon';
import {
    mockNetworkOnce,
    mockNetworkSequence,
    getMock as globalGetMock,
    setupElement,
} from 'test-util';
import { URL_BASE, mockDeleteRecordNetwork } from 'uiapi-test-util';

import RelatedListBasic from '../lwc/related-list-basic';

const MOCK_PREFIX = 'wire/getRelatedListRecords/__karma__/basic/data/';
const NON_AT_WIRE_PROPERTIES = [
    'currentPageUrl',
    'listReference',
    'fields',
    'optionalFields',
    'pageSize',
    'sortBy',
];

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

function mockNetwork(config, mockData) {
    const { parentRecordId, relatedListId } = config;
    const queryParams = { ...config };
    delete queryParams.parentRecordId;
    delete queryParams.relatedListId;

    const paramMatch = sinon.match({
        path: `${URL_BASE}/related-list-records/${parentRecordId}/${relatedListId}`,
        queryParams,
    });

    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function stripNonAtWireProperties(mockData) {
    return Object.keys(mockData).reduce((result, key) => {
        if (!NON_AT_WIRE_PROPERTIES.includes(key)) {
            result[key] = mockData[key];
        }

        return result;
    }, {});
}

describe('basic', () => {
    it('gets data with valid parentRecordId and relatedListId', async () => {
        const mockData = getMock('related-list-records-Custom');
        const resourceConfig = {
            parentRecordId: mockData.listReference.inContextOfRecordId,
            relatedListId: mockData.listReference.relatedListId,
            fields: mockData.fields,
        };
        mockNetwork(resourceConfig, mockData);

        const props = {
            parentRecordId: mockData.listReference.inContextOfRecordId,
            relatedListId: mockData.listReference.relatedListId,
            fields: mockData.fields,
        };
        const element = await setupElement(props, RelatedListBasic);

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(
            stripNonAtWireProperties(mockData)
        );
    });

    it('gets data with no records', async () => {
        const mockData = getMock('related-list-records-empty-Custom');
        const resourceConfig = {
            parentRecordId: mockData.listReference.inContextOfRecordId,
            relatedListId: mockData.listReference.relatedListId,
            fields: mockData.fields,
        };
        mockNetwork(resourceConfig, mockData);

        const props = {
            parentRecordId: mockData.listReference.inContextOfRecordId,
            relatedListId: mockData.listReference.relatedListId,
            fields: mockData.fields,
        };
        const element = await setupElement(props, RelatedListBasic);

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(
            stripNonAtWireProperties(mockData)
        );
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
        mockNetwork(resourceConfig, [mockData, refreshedMockData]);

        const props = {
            parentRecordId: mockData.listReference.inContextOfRecordId,
            relatedListId: mockData.listReference.relatedListId,
            fields: mockData.fields,
        };
        const element = await setupElement(props, RelatedListBasic);

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(
            stripNonAtWireProperties(mockData)
        );
        expect(element.pushCount()).toBe(1);

        await element.refresh();

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(
            stripNonAtWireProperties(refreshedMockData)
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
        mockNetwork(resourceConfig, [mockData, refreshedMockData]);

        const props = {
            parentRecordId: mockData.listReference.inContextOfRecordId,
            relatedListId: mockData.listReference.relatedListId,
            fields: mockData.fields,
        };
        const element = await setupElement(props, RelatedListBasic);

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(
            stripNonAtWireProperties(mockData)
        );
        expect(element.pushCount()).toBe(1);

        // Delete the record from lds, our component should refresh automatically
        mockDeleteRecordNetwork(recordId);
        await deleteRecord(recordId);

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(
            stripNonAtWireProperties(refreshedMockData)
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
        mockNetwork(resourceConfig, [mockData, refreshedMockData]);

        const props = {
            parentRecordId: mockData.listReference.inContextOfRecordId,
            relatedListId: mockData.listReference.relatedListId,
            fields: mockData.fields,
        };
        const element = await setupElement(props, RelatedListBasic);

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(
            stripNonAtWireProperties(mockData)
        );
        expect(element.pushCount()).toBe(1);

        await element.refresh();

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(
            stripNonAtWireProperties(refreshedMockData)
        );
        expect(element.pushCount()).toBe(2);
    });
});
