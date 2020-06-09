import { getMock as globalGetMock, setupElement, mockNetworkErrorOnce } from 'test-util';
import {
    expireDuplicateConfiguration,
    mockGetDuplicatesConfigurationNetwork,
    URL_BASE,
} from 'uiapi-test-util';

import GetDuplicatesConfiguration from '../lwc/get-duplicate-configuration';
import sinon from 'sinon';
import { karmaNetworkAdapter } from 'lds';

const MOCK_PREFIX = 'wire/getDuplicateConfiguration/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

function mockNetworkError(config, mockData) {
    const paramMatch = getParamMatch(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getParamMatch(config) {
    let { objectApiName, ...queryParams } = config;
    return sinon.match({
        basePath: `${URL_BASE}/duplicates/${objectApiName}`,
        queryParams,
    });
}

describe('duplicate configuration', () => {
    it('should make http request when data is not present in cache', async () => {
        const mock = getMock('duplicate-configuration-Account');

        const config = {
            objectApiName: 'Account',
        };

        mockGetDuplicatesConfigurationNetwork(config, mock);

        const elm = await setupElement(config, GetDuplicatesConfiguration);

        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });
    it('should not make http request when data is present in cache', async () => {
        const mock = getMock('duplicate-configuration-Account');

        const config = {
            objectApiName: 'Account',
        };

        mockGetDuplicatesConfigurationNetwork(config, mock);

        const wireA = await setupElement(config, GetDuplicatesConfiguration);

        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        const wireB = await setupElement(config, GetDuplicatesConfiguration);

        expect(wireB.pushCount()).toBe(1);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });
    it('should make http request when data is not present in cache but expired', async () => {
        const mock = getMock('duplicate-configuration-Account');

        const config = {
            objectApiName: 'Account',
        };

        mockGetDuplicatesConfigurationNetwork(config, [mock, mock]);

        const wireA = await setupElement(config, GetDuplicatesConfiguration);

        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        expireDuplicateConfiguration();

        const wireB = await setupElement(config, GetDuplicatesConfiguration);

        expect(wireB.pushCount()).toBe(1);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        // wireA should not receive new value
        expect(wireA.pushCount()).toBe(1);
    });
    it('should return cached data when data from network has same integrity fields (eTag)', async () => {
        const mockData = getMock('duplicate-configuration-Account');
        const mockDataCopy = getMock('duplicate-configuration-Account');

        // modify a field from the data for testing purpose
        mockDataCopy.dedupeEnabled = !mockDataCopy.dedupeEnabled;

        const resourceConfig = { objectApiName: 'Account' };
        mockGetDuplicatesConfigurationNetwork(resourceConfig, [mockData, mockDataCopy]);

        // populate cache
        const props = { objectApiName: 'Account' };
        await setupElement(props, GetDuplicatesConfiguration);

        // expire cache
        expireDuplicateConfiguration();
        // second component retrieves data from network
        const element = await setupElement(props, GetDuplicatesConfiguration);

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
    });
    it('should push new data when data from network has changed integrity fields (eTag)', async () => {
        const mock = getMock('duplicate-configuration-Account');
        const mockDataCopy = getMock('duplicate-configuration-Account');

        mockDataCopy.eTag = 'changed';
        mockDataCopy.dedupeEnabled = false;

        const config = {
            objectApiName: 'Account',
        };

        mockGetDuplicatesConfigurationNetwork(config, [mock, mockDataCopy]);

        const wireA = await setupElement(config, GetDuplicatesConfiguration);

        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        expireDuplicateConfiguration();

        const wireB = await setupElement(config, GetDuplicatesConfiguration);

        expect(wireB.pushCount()).toBe(1);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(mockDataCopy);

        // wireA should receive new value
        expect(wireA.pushCount()).toBe(2);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mockDataCopy);
    });
    it('should be a cache miss if two components request different objectApiName', async () => {
        const accountMock = getMock('duplicate-configuration-Account');
        const leadMock = getMock('duplicate-configuration-Lead');

        const accountConfig = {
            objectApiName: 'Account',
        };
        const leadConfig = {
            objectApiName: 'Lead',
        };

        mockGetDuplicatesConfigurationNetwork(accountConfig, accountMock);
        mockGetDuplicatesConfigurationNetwork(leadConfig, leadMock);

        const accountWire = await setupElement(accountConfig, GetDuplicatesConfiguration);

        expect(accountWire.pushCount()).toBe(1);
        expect(accountWire.getWiredData()).toEqualSnapshotWithoutEtags(accountMock);

        const leadWire = await setupElement(leadConfig, GetDuplicatesConfiguration);

        expect(leadWire.pushCount()).toBe(1);
        expect(leadWire.getWiredData()).toEqualSnapshotWithoutEtags(leadMock);

        // Each should have received 1 push
        expect(accountWire.pushCount()).toBe(1);
        expect(leadWire.pushCount()).toBe(1);
    });
    it(`should return error for invalid objectApiName param`, async () => {
        const mockData = getMock('duplicate-configuration-invalid-objectApiName');
        const invalidObjectApiConfig = {
            objectApiName: 'Invalid',
        };
        mockNetworkError(invalidObjectApiConfig, mockData);

        const element = await setupElement(invalidObjectApiConfig, GetDuplicatesConfiguration);

        const error = element.getWiredError();
        expect(error.body).toEqualSnapshotWithoutEtags(mockData);
    });
});
