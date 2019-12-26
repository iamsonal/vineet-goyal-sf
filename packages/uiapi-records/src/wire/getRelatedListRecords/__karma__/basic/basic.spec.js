import { karmaNetworkAdapter } from 'lds';
import sinon from 'sinon';
import { mockNetworkOnce, getMock as globalGetMock, setupElement } from 'test-util';
import { URL_BASE } from 'uiapi-test-util';

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
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
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
            fields: ['Id', 'Name'],
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
            fields: ['Id'],
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
});
