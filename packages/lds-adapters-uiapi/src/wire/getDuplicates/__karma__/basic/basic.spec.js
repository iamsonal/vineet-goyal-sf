import { getMock as globalGetMock, setupElement, mockNetworkErrorOnce } from 'test-util';
import {
    expireDuplicatesRepresentation,
    mockGetDuplicatesNetwork,
    URL_BASE,
} from 'uiapi-test-util';

import GetDuplicates from '../lwc/get-duplicates';
import sinon from 'sinon';
import { karmaNetworkAdapter } from 'lds-engine';

const MOCK_PREFIX = 'wire/getDuplicates/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

function mockNetworkError(config, mockData) {
    const paramMatch = getParamMatch(config);
    mockNetworkErrorOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function getParamMatch(config) {
    return sinon.match({
        basePath: `${URL_BASE}/predupe`,
        method: 'post',
        body: config,
    });
}

describe('get duplicates', () => {
    it('should make http request when data is not present in cache', async () => {
        const mock = getMock('duplicates-Lead');

        const config = {
            apiName: 'Lead',
            fields: {
                FirstName: 'Jim',
                LastName: 'Steele',
                Email: 'info@salesforce.com',
            },
        };

        mockGetDuplicatesNetwork(config, mock);

        const elm = await setupElement(config, GetDuplicates);

        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });
    it('should not make http request when data is present in cache', async () => {
        const mock = getMock('duplicates-Lead');

        const config = {
            apiName: 'Lead',
            fields: {
                FirstName: 'Jim',
                LastName: 'Steele',
                Email: 'info@salesforce.com',
            },
        };

        mockGetDuplicatesNetwork(config, mock);

        const wireA = await setupElement(config, GetDuplicates);

        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        const wireB = await setupElement(config, GetDuplicates);

        expect(wireB.pushCount()).toBe(1);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });
    it('should make http request when data is not present in cache but expired', async () => {
        const mock = getMock('duplicates-Lead');

        const config = {
            apiName: 'Lead',
            fields: {
                FirstName: 'Jim',
                LastName: 'Steele',
                Email: 'info@salesforce.com',
            },
        };
        mockGetDuplicatesNetwork(config, [mock, mock]);

        const wireA = await setupElement(config, GetDuplicates);

        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        expireDuplicatesRepresentation();

        const wireB = await setupElement(config, GetDuplicates);

        expect(wireB.pushCount()).toBe(1);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        expect(wireA.pushCount()).toBe(1);
    });
    it('should be a cache miss if two components request different config', async () => {
        const noMatchMock = getMock('duplicates-no-match');
        const matchMock = getMock('duplicates-Lead');

        const matchConfig = {
            apiName: 'Lead',
            fields: {
                FirstName: 'Jim',
                LastName: 'Steele',
                Email: 'info@salesforce.com',
            },
        };
        const noMatchConfig = {
            apiName: 'Lead',
            fields: {
                FirstName: 'Jimmy',
                LastName: 'Steele',
                Email: 'info@salesforce.com',
            },
        };

        mockGetDuplicatesNetwork(matchConfig, matchMock);
        mockGetDuplicatesNetwork(noMatchConfig, noMatchMock);

        const wireA = await setupElement(matchConfig, GetDuplicates);

        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(matchMock);

        const wireB = await setupElement(noMatchConfig, GetDuplicates);

        expect(wireB.pushCount()).toBe(1);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(noMatchMock);

        // Each should have received 1 push
        expect(wireA.pushCount()).toBe(1);
        expect(wireB.pushCount()).toBe(1);
    });
    it(`should return error for invalid objectApiName param`, async () => {
        const mockData = getMock('duplicates-invalid-objectApiName');
        const invalidObjectApiConfig = {
            apiName: 'Leadsss',
            fields: {
                FirstName: 'Jimmy',
                LastName: 'Steele',
                Email: 'info@salesforce.com',
            },
        };
        mockNetworkError(invalidObjectApiConfig, { body: mockData });

        const element = await setupElement(invalidObjectApiConfig, GetDuplicates);

        const error = element.getWiredError();
        expect(error).toContainErrorBody(mockData);
    });
});
