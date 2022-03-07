import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    mockGetRelatedListPreferencesNetwork,
    expireRelatedListUserPreferences,
} from 'uiapi-test-util';

import RelatedListPreferences from '../lwc/related-list-preferences';

const MOCK_PREFIX = 'wire/getRelatedListPreferences/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets data with valid preferencesId', async () => {
        const mockData = getMock('related-list-preferences-Random');
        const config = {
            preferencesId: mockData.preferencesId,
        };

        const networkConfig = { ...config };
        mockGetRelatedListPreferencesNetwork(networkConfig, mockData);
        const element = await setupElement(config, RelatedListPreferences);

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
    });

    it('tests cache hit on second request', async () => {
        const mockData = getMock('related-list-preferences-Random');
        const config = {
            preferencesId: mockData.preferencesId,
        };
        const networkConfig = { ...config };
        mockGetRelatedListPreferencesNetwork(networkConfig, mockData);
        const element = await setupElement(config, RelatedListPreferences);
        const element2 = await setupElement(config, RelatedListPreferences);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
        expect(element2.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
    });

    it('tests cache miss on expired info', async () => {
        const mockData = getMock('related-list-preferences-Random');
        const config = {
            preferencesId: mockData.preferencesId,
        };
        const networkConfig = { ...config };
        mockGetRelatedListPreferencesNetwork(networkConfig, [mockData, mockData]);
        // Create one element, expire rl user preferences, create another
        const element = await setupElement(config, RelatedListPreferences);
        expireRelatedListUserPreferences();
        const element2 = await setupElement(config, RelatedListPreferences);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
        expect(element2.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
    });

    it('validates 404 response from server', async () => {
        const mockError = getMock('related-list-preferences-Missing');
        const config = {
            preferencesId: 'Test',
        };
        const networkConfig = { ...config };

        mockGetRelatedListPreferencesNetwork(networkConfig, {
            reject: true,
            data: mockError,
        });

        const element = await setupElement(config, RelatedListPreferences);
        const error = element.getError();
        expect(error.status).toBe(404);
        expect(error).toEqual(mockError);
    });

    it('validates 404 cache hit', async () => {
        const mockError = getMock('related-list-preferences-Missing');
        const config = {
            preferencesId: 'Test',
        };
        const networkConfig = { ...config };
        mockGetRelatedListPreferencesNetwork(networkConfig, {
            reject: true,
            data: mockError,
        });
        const element = await setupElement(config, RelatedListPreferences);
        const element2 = await setupElement(config, RelatedListPreferences);
        expect(element.pushCount()).toBe(1);
        expect(element2.pushCount()).toBe(1);
    });

    it('validates 404 cache miss', async () => {
        const mockError1 = getMock('related-list-preferences-Missing');
        const mockError2 = getMock('related-list-preferences-Missing');
        const config = {
            preferencesId: 'Test',
        };
        const networkConfig = { ...config };
        mockGetRelatedListPreferencesNetwork(networkConfig, [
            {
                reject: true,
                data: mockError1,
            },
            {
                reject: true,
                data: mockError2,
            },
        ]);
        const element = await setupElement(config, RelatedListPreferences);
        expireRelatedListUserPreferences();
        const element2 = await setupElement(config, RelatedListPreferences);
        expect(element.getError()).toEqual(mockError1);
        expect(element2.getError()).toEqual(mockError2);
    });
});
