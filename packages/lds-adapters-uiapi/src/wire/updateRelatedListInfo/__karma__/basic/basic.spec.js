import { karmaNetworkAdapter } from 'lds-engine';
import sinon from 'sinon';
import { mockNetworkOnce, getMock as globalGetMock, setupElement } from 'test-util';
import { URL_BASE, expireRelatedListInfo } from 'uiapi-test-util';
import { updateRelatedListInfo } from 'lds-adapters-uiapi';

import RelatedListBasic from '../lwc/related-list-basic';

const MOCK_PREFIX = 'wire/updateRelatedListInfo/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

function buildSinonMatch(obj) {
    if (Array.isArray(obj)) {
        const next = obj.map(value => {
            if (typeof value === 'object' && value !== null) {
                return buildSinonMatch(value);
            }
            return value;
        });

        return sinon.match(next);
    }

    const next = Object.keys(obj).reduce((seed, key) => {
        let value = obj[key];
        if (typeof value === 'object' && value !== null) {
            value = buildSinonMatch(value);
        }

        seed[key] = value;

        return seed;
    }, {});

    return sinon.match(next);
}

function mockUpdateNetwork(keys, params, mockData) {
    const { parentObjectApiName, relatedListId } = keys;
    const updateParams = { ...params };
    const queryParams = { ...keys };
    delete queryParams.parentObjectApiName;
    delete queryParams.relatedListId;
    delete updateParams.parentObjectApiName;
    delete updateParams.recordTypeId;
    delete updateParams.relatedListId;

    const paramMatch = buildSinonMatch({
        basePath: `${URL_BASE}/related-list-info/${parentObjectApiName}/${relatedListId}`,
        queryParams: queryParams,
        method: 'patch',
        body: updateParams,
    });
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function mockGetNetwork(keys, mockData) {
    const { parentObjectApiName, relatedListId } = keys;
    const queryParams = { ...keys };
    delete queryParams.parentObjectApiName;
    delete queryParams.relatedListId;

    const paramMatch = sinon.match({
        basePath: `${URL_BASE}/related-list-info/${parentObjectApiName}/${relatedListId}`,
        method: 'get',
        queryParams,
    });
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function extractParamsFromMockData(mockData) {
    return {
        parentObjectApiName: mockData.listReference.parentObjectApiName,
        recordTypeId: mockData.listReference.recordTypeId,
        relatedListId: mockData.listReference.relatedListId,
    };
}
// This tells sinon to not expect null recordTypeId in the request params to match. The validation code
// for this adapter strips out non-string values (including null)
function extractNetworkParamsFromMockData(mockData) {
    return {
        parentObjectApiName: mockData.listReference.parentObjectApiName,
        recordTypeId: mockData.listReference.recordTypeId
            ? mockData.listReference.recordTypeId
            : undefined,
        relatedListId: mockData.listReference.relatedListId,
    };
}

describe('updateRelatedListInfo', () => {
    it('passes all parameters to HTTP request, and sends the correct response', async () => {
        const mockData = getMock('related-list-info-Custom');
        const networkConfig = extractNetworkParamsFromMockData(mockData);
        const updateParams = {
            orderedByInfo: [],
            userPreferences: {
                columnWidths: {
                    Name: -1,
                },
                columnWrap: {
                    Name: false,
                },
            },
        };
        mockUpdateNetwork(networkConfig, updateParams, mockData);

        const props = {
            orderedByInfo: [],
            parentObjectApiName: mockData.listReference.parentObjectApiName,
            recordTypeId: mockData.listReference.recordTypeId,
            relatedListId: mockData.listReference.relatedListId,
            userPreferences: mockData.userPreferences,
        };
        const response = await updateRelatedListInfo(props);
        expect(response).toEqualSnapshotWithoutEtags(mockData);
    });

    it('properly emits when data has been updated', async () => {
        const mockData = getMock('related-list-info-Custom');
        const mockUpdatedResponse = getMock('related-list-info-Custom');
        mockUpdatedResponse.userPreferences.columnWrap.Name = true;
        mockUpdatedResponse.eTag = mockUpdatedResponse.eTag + '999';

        const networkConfig = extractNetworkParamsFromMockData(mockData);
        const componentConfig = extractParamsFromMockData(mockData);

        const updateConfig = {
            orderedByInfo: [],
            parentObjectApiName: mockData.listReference.parentObjectApiName,
            recordTypeId: mockData.listReference.recordTypeId,
            relatedListId: mockData.listReference.relatedListId,
            userPreferences: {
                columnWidths: {
                    Name: -1,
                },
                columnWrap: {
                    Name: true,
                },
            },
        };
        mockGetNetwork(networkConfig, mockData);
        mockUpdateNetwork(networkConfig, updateConfig, mockUpdatedResponse);

        const element = await setupElement(componentConfig, RelatedListBasic);

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);

        await updateRelatedListInfo(updateConfig);

        expect(element.pushCount()).toBe(2);
    });

    it('hits the network twice when two update calls are made', async () => {
        const mockData = getMock('related-list-info-Custom');
        const mockFirstUpdate = getMock('related-list-info-Custom');
        mockFirstUpdate.userPreferences.columnWrap.Name = true;
        mockFirstUpdate.eTag = mockFirstUpdate.eTag + '999';
        const mockSecondUpdate = getMock('related-list-info-Custom');
        mockSecondUpdate.userPreferences.columnWidths.Name = 10;
        mockSecondUpdate.eTag = mockSecondUpdate.eTag + '888';

        const updateConfig = {
            orderedByInfo: [],
            parentObjectApiName: mockData.listReference.parentObjectApiName,
            recordTypeId: mockData.listReference.recordTypeId,
            relatedListId: mockData.listReference.relatedListId,
            userPreferences: {
                columnWidths: {
                    Name: -1,
                },
                columnWrap: {
                    Name: true,
                },
            },
        };
        const updateSecondConfig = {
            orderedByInfo: [],
            parentObjectApiName: mockData.listReference.parentObjectApiName,
            recordTypeId: mockData.listReference.recordTypeId,
            relatedListId: mockData.listReference.relatedListId,
            userPreferences: {
                columnWidths: {
                    Name: 10,
                },
                columnWrap: {
                    Name: true,
                },
            },
        };

        const networkConfig = extractNetworkParamsFromMockData(mockData);

        mockUpdateNetwork(networkConfig, updateConfig, mockFirstUpdate);
        mockUpdateNetwork(networkConfig, updateSecondConfig, mockSecondUpdate);

        const firstResult = await updateRelatedListInfo(updateConfig);
        expect(firstResult).toEqualSnapshotWithoutEtags(mockFirstUpdate);
        const secondResult = await updateRelatedListInfo(updateSecondConfig);
        expect(secondResult).toEqualSnapshotWithoutEtags(mockSecondUpdate);
    });

    it('updates values on elements when an update is made', async () => {
        const mockData = getMock('related-list-info-Custom');
        const mockUpdateData = getMock('related-list-info-updated');

        const networkConfig = extractNetworkParamsFromMockData(mockData);
        const componentConfig = extractParamsFromMockData(mockData);
        const updateParams = {
            orderedByInfo: [],
            userPreferences: {
                columnWidths: {
                    Name: -1,
                },
                columnWrap: {
                    Name: false,
                },
            },
        };
        mockGetNetwork(networkConfig, mockData);
        mockUpdateNetwork(networkConfig, updateParams, mockUpdateData);

        const props = {
            orderedByInfo: [],
            parentObjectApiName: mockData.listReference.parentObjectApiName,
            recordTypeId: mockData.listReference.recordTypeId,
            relatedListId: mockData.listReference.relatedListId,
            userPreferences: {
                columnWidths: {
                    Name: -1,
                },
                columnWrap: {
                    Name: false,
                },
            },
        };
        const element = await setupElement(componentConfig, RelatedListBasic);

        expireRelatedListInfo();

        await updateRelatedListInfo(props);

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockUpdateData);
        expect(element.pushCount()).toEqual(2);
    });
});
