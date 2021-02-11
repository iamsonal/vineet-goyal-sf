import { getMock as globalGetMock, setupElement } from 'test-util';
import { mockGetListInfoByNameNetwork, expireListInfo } from 'uiapi-test-util';

import ListBasic from '../lwc/list-basic';

const MOCK_PREFIX = 'wire/getListInfoByName/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('gets data with valid objectApiName and listViewApiName', async () => {
        const mockData = getMock('list-info-AllAccounts');
        const config = {
            objectApiName: mockData.listReference.objectApiName,
            listViewApiName: mockData.listReference.listViewApiName,
        };

        const networkConfig = { ...config };
        mockGetListInfoByNameNetwork(networkConfig, mockData);
        const element = await setupElement(config, ListBasic);

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
    });

    it('tests cache hit on second request', async () => {
        const mockData = getMock('list-info-AllAccounts');
        const config = {
            objectApiName: mockData.listReference.objectApiName,
            listViewApiName: mockData.listReference.listViewApiName,
        };

        const networkConfig = { ...config };
        mockGetListInfoByNameNetwork(networkConfig, mockData);
        const element = await setupElement(config, ListBasic);
        const element2 = await setupElement(config, ListBasic);

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
        expect(element2.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
    });

    it('tests cache miss on expired info', async () => {
        const mockData = getMock('list-info-AllAccounts');
        const config = {
            objectApiName: mockData.listReference.objectApiName,
            listViewApiName: mockData.listReference.listViewApiName,
        };

        const networkConfig = { ...config };
        mockGetListInfoByNameNetwork(networkConfig, [mockData, mockData]);

        // Create one element, expire list info, create another
        const element = await setupElement(config, ListBasic);
        expireListInfo();
        const element2 = await setupElement(config, ListBasic);

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
        expect(element2.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
    });

    it('tests list info refreshes correctly', async () => {
        const mockData = getMock('list-info-AllAccounts');
        const refreshed = getMock('list-info-AllAccounts');
        refreshed.eTag = refreshed.eTag + '999';
        refreshed.cloneable = false;

        const config = {
            objectApiName: mockData.listReference.objectApiName,
            listViewApiName: mockData.listReference.listViewApiName,
        };

        const networkConfig = { ...config };

        mockGetListInfoByNameNetwork(networkConfig, [mockData, refreshed]);

        const element = await setupElement(config, ListBasic);
        expect(element.pushCount()).toBe(1);
        await element.refresh();
        expect(element.pushCount()).toBe(2);
    });

    it('validates 404 response from server', async () => {
        const mockError = [
            {
                errorCode: 'NOT_FOUND',
                message: 'The requested resource does not exist',
            },
        ];

        const mockErrorResponse = {
            status: 404,
            statusText: 'Not Found',
            ok: false,
            reject: true,
            data: mockError,
        };

        const config = {
            objectApiName: 'Test',
            listViewApiName: 'Test',
        };

        const networkConfig = { ...config };

        mockGetListInfoByNameNetwork(networkConfig, mockErrorResponse);

        const element = await setupElement(config, ListBasic);
        const error = element.getError();
        expect(error.status).toBe(404);
        expect(error).toContainErrorResponse(mockError);
    });

    it('validates 404 cache hit', async () => {
        const mockError = [
            {
                errorCode: 'NOT_FOUND',
                message: 'The requested resource does not exist',
            },
        ];

        const mockErrorResponse = {
            status: 404,
            statusText: 'Not Found',
            ok: false,
            reject: true,
            data: mockError,
        };

        const config = {
            objectApiName: 'Test',
            listViewApiName: 'Test',
        };

        const networkConfig = { ...config };

        mockGetListInfoByNameNetwork(networkConfig, mockErrorResponse);

        const element = await setupElement(config, ListBasic);
        const element2 = await setupElement(config, ListBasic);

        expect(element.pushCount()).toBe(1);
        expect(element2.pushCount()).toBe(1);
    });

    it('validates 404 cache miss', async () => {
        const mockError = [
            {
                errorCode: 'NOT_FOUND',
                message: 'The requested resource does not exist',
            },
        ];

        const mockErrorResponse = {
            status: 404,
            statusText: 'Not Found',
            ok: false,
            reject: true,
            data: mockError,
        };

        const config = {
            objectApiName: 'Test',
            listViewApiName: 'Test',
        };

        const networkConfig = { ...config };

        mockGetListInfoByNameNetwork(networkConfig, [mockErrorResponse, mockErrorResponse]);

        const element = await setupElement(config, ListBasic);
        expireListInfo();
        const element2 = await setupElement(config, ListBasic);

        expect(element.getError()).toContainErrorResponse(mockError);
        expect(element2.getError()).toContainErrorResponse(mockError);
    });
});

describe('list info search results', () => {
    it('tests search result api name', async () => {
        const mockData = getMock('list-info-__SearchResult');
        const config = {
            objectApiName: mockData.listReference.objectApiName,
            listViewApiName: mockData.listReference.listViewApiName,
        };

        const networkConfig = { ...config };
        mockGetListInfoByNameNetwork(networkConfig, mockData);
        const element = await setupElement(config, ListBasic);

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
    });
});
