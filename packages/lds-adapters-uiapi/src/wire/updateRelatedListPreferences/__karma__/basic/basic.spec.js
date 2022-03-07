import { karmaNetworkAdapter } from 'lds-engine';
import sinon from 'sinon';
import { mockNetworkOnce, getMock as globalGetMock, setupElement } from 'test-util';
import {
    URL_BASE,
    expireRelatedListUserPreferences,
    mockGetRelatedListPreferencesNetwork,
} from 'uiapi-test-util';
import { updateRelatedListPreferences } from 'lds-adapters-uiapi';

import RelatedListPreferences from '../lwc/related-list-preferences';

const MOCK_PREFIX = 'wire/updateRelatedListPreferences/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

function buildSinonMatch(obj) {
    if (Array.isArray(obj)) {
        const next = obj.map((value) => {
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
    const { preferencesId } = keys;
    const updateParams = { ...params };
    const queryParams = { ...keys };
    delete queryParams.preferencesId;
    delete updateParams.preferencesId;

    const paramMatch = buildSinonMatch({
        basePath: `${URL_BASE}/related-list-preferences/${preferencesId}`,
        queryParams: queryParams,
        method: 'patch',
        body: updateParams,
    });
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

describe('updateRelatedListPreferences', () => {
    it('passes all parameters to HTTP request, and sends the correct response', async () => {
        const mockData = getMock('related-list-preferences-Random');
        const networkConfig = {
            preferencesId: mockData.preferencesId,
        };
        const updateParams = {
            columnWidths: mockData.columnWidths,
            columnWrap: mockData.columnWrap,
            orderedBy: [],
        };
        mockUpdateNetwork(networkConfig, updateParams, mockData);

        const props = {
            preferencesId: mockData.preferencesId,
            columnWidths: mockData.columnWidths,
            columnWrap: mockData.columnWrap,
            orderedBy: [],
        };
        const response = await updateRelatedListPreferences(props);
        expect(response).toEqualSnapshotWithoutEtags(mockData);
    });

    it('properly emits when data has been updated', async () => {
        const mockData = getMock('related-list-preferences-Random');
        const mockUpdatedResponse = getMock('related-list-preferences-Random');
        mockUpdatedResponse.columnWidths.testSetPreferences_ultpt = 60;

        const networkConfig = {
            preferencesId: mockData.preferencesId,
        };
        const componentConfig = {
            preferencesId: mockData.preferencesId,
        };

        const updateConfig = {
            preferencesId: mockData.preferencesId,
            columnWidths: mockUpdatedResponse.columnWidths,
            columnWrap: mockData.columnWrap,
            orderedBy: [],
        };
        mockGetRelatedListPreferencesNetwork(networkConfig, mockData);
        mockUpdateNetwork(networkConfig, updateConfig, mockUpdatedResponse);

        const element = await setupElement(componentConfig, RelatedListPreferences);

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);

        await updateRelatedListPreferences(updateConfig);

        expect(element.pushCount()).toBe(2);
    });

    it('hits the network twice when two update calls are made', async () => {
        const mockData = getMock('related-list-preferences-Random');
        const mockFirstUpdate = getMock('related-list-preferences-Random');
        mockFirstUpdate.columnWidths.testSetPreferences_ultpt = 60;
        const mockSecondUpdate = getMock('related-list-preferences-Random');
        mockSecondUpdate.columnWidths.testSetPreferences_ultpt = 50;

        const updateConfig = {
            preferencesId: mockFirstUpdate.preferencesId,
            columnWidths: mockFirstUpdate.columnWidths,
            columnWrap: mockFirstUpdate.columnWrap,
            orderedBy: [],
        };
        const updateSecondConfig = {
            preferencesId: mockSecondUpdate.preferencesId,
            columnWidths: mockSecondUpdate.columnWidths,
            columnWrap: mockSecondUpdate.columnWrap,
            orderedBy: [],
        };

        const networkConfig = {
            preferencesId: mockData.preferencesId,
        };

        mockUpdateNetwork(networkConfig, updateConfig, mockFirstUpdate);
        mockUpdateNetwork(networkConfig, updateSecondConfig, mockSecondUpdate);

        const firstResult = await updateRelatedListPreferences(updateConfig);
        expect(firstResult).toEqualSnapshotWithoutEtags(mockFirstUpdate);
        const secondResult = await updateRelatedListPreferences(updateSecondConfig);
        expect(secondResult).toEqualSnapshotWithoutEtags(mockSecondUpdate);
    });

    it('updates values on elements when an update is made', async () => {
        const mockData = getMock('related-list-preferences-Random');
        const mockUpdatedResponse = getMock('related-list-preferences-Random');
        mockUpdatedResponse.columnWidths.testSetPreferences_ultpt = 60;

        const networkConfig = {
            preferencesId: mockData.preferencesId,
        };
        const componentConfig = {
            preferencesId: mockData.preferencesId,
        };

        const updateConfig = {
            preferencesId: mockUpdatedResponse.preferencesId,
            columnWidths: mockUpdatedResponse.columnWidths,
            columnWrap: mockUpdatedResponse.columnWrap,
            orderedBy: [],
        };
        mockGetRelatedListPreferencesNetwork(networkConfig, mockData);
        mockUpdateNetwork(networkConfig, updateConfig, mockUpdatedResponse);

        const element = await setupElement(componentConfig, RelatedListPreferences);

        expireRelatedListUserPreferences();

        await updateRelatedListPreferences(updateConfig);

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockUpdatedResponse);
        expect(element.pushCount()).toEqual(2);
    });
});
