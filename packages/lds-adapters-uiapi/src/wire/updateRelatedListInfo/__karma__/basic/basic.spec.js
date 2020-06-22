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

describe('updateRelatedListInfo', () => {
    it('passes all parameters to HTTP request, and sends the correct response', async () => {
        const mockData = getMock('related-list-info-Custom');
        const keyConfig = {
            parentObjectApiName: mockData.listReference.parentObjectApiName,
            recordTypeId: mockData.listReference.recordTypeId,
            relatedListId: mockData.listReference.relatedListId,
        };
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
        mockUpdateNetwork(keyConfig, updateParams, mockData);

        const props = {
            orderedByInfo: [],
            parentObjectApiName: mockData.listReference.parentObjectApiName,
            recordTypeId: mockData.listReference.recordTypeId,
            relatedListId: mockData.listReference.relatedListId,
            userPreferences: mockData.userPreferences,
        };
        const response = await updateRelatedListInfo(props);
        expect(response.data).toEqualSnapshotWithoutEtags(mockData);
    });

    // excluded until the issue regarding updateRLInfo incorrectly inspecting the cache is resolved
    it('properly emits when data has been updated', async () => {
        const mockData = getMock('related-list-info-Custom');
        const mockUpdatedResponse = getMock('related-list-info-Custom');
        mockUpdatedResponse.userPreferences.columnWrap.Name = true;

        const keyConfig = extractParamsFromMockData(mockData);

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
        mockGetNetwork(keyConfig, mockData);
        mockUpdateNetwork(keyConfig, updateConfig, mockUpdatedResponse);

        const element = await setupElement(keyConfig, RelatedListBasic);

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);

        await updateRelatedListInfo(updateConfig);

        expect(element.pushCount()).toBe(2);
    });

    // excluded until the issue regarding updateRLInfo incorrectly inspecting the cache is resolved
    it('hits the network twice when two update calls are made', async () => {
        const mockData = getMock('related-list-info-Custom');
        const mockFirstUpdate = getMock('related-list-info-Custom');
        mockFirstUpdate.userPreferences.columnWrap.Name = true;
        const mockSecondUpdate = getMock('related-list-info-Custom');
        mockSecondUpdate.userPreferences.columnWidths.Name = 10;

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

        const keyConfig = extractParamsFromMockData(mockData);

        mockUpdateNetwork(keyConfig, updateConfig, mockFirstUpdate);
        mockUpdateNetwork(keyConfig, updateSecondConfig, mockSecondUpdate);

        const firstResult = await updateRelatedListInfo(updateConfig);
        expect(firstResult.data).toEqualSnapshotWithoutEtags(mockFirstUpdate);
        const secondResult = await updateRelatedListInfo(updateSecondConfig);
        expect(secondResult.data).toEqualSnapshotWithoutEtags(mockSecondUpdate);
    });

    it('updates values on elements when an update is made', async () => {
        const mockData = getMock('related-list-info-Custom');
        const mockUpdateData = getMock('related-list-info-updated');

        const keyConfig = extractParamsFromMockData(mockData);
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
        mockGetNetwork(keyConfig, mockData);
        mockUpdateNetwork(keyConfig, updateParams, mockUpdateData);

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
        const element = await setupElement(keyConfig, RelatedListBasic);

        expireRelatedListInfo();

        await updateRelatedListInfo(props);

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockUpdateData);
        expect(element.pushCount()).toEqual(2);
    });
});
