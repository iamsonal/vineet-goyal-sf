import { karmaNetworkAdapter } from 'lds';
import sinon from 'sinon';
import { mockNetworkOnce, getMock as globalGetMock, setupElement } from 'test-util';
import { URL_BASE, expireRelatedListInfo } from 'uiapi-test-util';
import { updateRelatedListInfo } from 'lds';

import RelatedListBasic from '../lwc/related-list-basic';

const MOCK_PREFIX = 'wire/updateRelatedListInfo/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

function mockUpdateNetwork(keys, params, mockData) {
    const { parentObjectApiName, recordTypeId, relatedListId } = keys;
    const updateParams = { ...params };

    const paramMatch = sinon.match({
        path: `${URL_BASE}/related-list-info/${parentObjectApiName}/${recordTypeId}/${relatedListId}`,
        method: 'patch',
        body: updateParams,
    });
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function mockGetNetwork(keys, mockData) {
    const { parentObjectApiName, recordTypeId, relatedListId } = keys;
    const queryParams = { ...keys };
    delete queryParams.parentObjectApiName;
    delete queryParams.recordTypeId;
    delete queryParams.relatedListId;

    const paramMatch = sinon.match({
        path: `${URL_BASE}/related-list-info/${parentObjectApiName}/${recordTypeId}/${relatedListId}`,
        method: 'get',
        queryParams,
    });
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

describe('update record', () => {
    // TODO: update mock data to be compatible with v49
    it('passes all parameters to HTTP request, and sends the correct response', async () => {
        const mockData = getMock(
            'related-list-info-CObjParent__c -012000000000000AAA -CObjChilds__r'
        );
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
    xit('properly emits when data has been updated', async () => {
        const mockData = getMock(
            'related-list-info-CObjParent__c -012000000000000AAA -CObjChilds__r'
        );
        const mockUpdatedResponse = getMock(
            'related-list-info-CObjParent__c -012000000000000AAA -CObjChilds__r'
        );
        mockUpdatedResponse.userPreferences.columnWrap = true;

        const keyConfig = {
            parentObjectApiName: mockData.listReference.parentObjectApiName,
            recordTypeId: mockData.listReference.recordTypeId,
            relatedListId: mockData.listReference.relatedListId,
        };

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
    xit('hits the network twice when two update calls are made', async () => {
        const mockData = getMock(
            'related-list-info-CObjParent__c -012000000000000AAA -CObjChilds__r'
        );
        const mockFirstUpdate = getMock(
            'related-list-info-CObjParent__c -012000000000000AAA -CObjChilds__r'
        );
        mockFirstUpdate.userPreferences.columnWrap = true;
        const mockSecondUpdate = getMock(
            'related-list-info-CObjParent__c -012000000000000AAA -CObjChilds__r'
        );
        mockSecondUpdate.userPreferences.columnWidths = 10;

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

        const keyConfig = {
            parentObjectApiName: mockData.listReference.parentObjectApiName,
            recordTypeId: mockData.listReference.recordTypeId,
            relatedListId: mockData.listReference.relatedListId,
        };

        mockUpdateNetwork(keyConfig, updateConfig, mockFirstUpdate);
        mockUpdateNetwork(keyConfig, updateSecondConfig, mockSecondUpdate);

        await updateRelatedListInfo(updateConfig);
        await updateRelatedListInfo(updateSecondConfig);
    });

    it('updates values on elements when an update is made', async () => {
        const mockData = getMock(
            'related-list-info-CObjParent__c -012000000000000AAA -CObjChilds__r'
        );
        const mockUpdateData = getMock(
            'related-list-info-CObjParent__c -012000000000000AAA -CObjChilds__r-updated'
        );

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
