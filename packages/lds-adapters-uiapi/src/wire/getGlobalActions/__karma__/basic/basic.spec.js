import { getMock as globalGetMock, setupElement } from 'test-util';
import { expireActions, mockGetGlobalActionsNetwork } from 'uiapi-test-util';
import GlobalActions from '../lwc/global-actions';

const MOCK_PREFIX = 'wire/getGlobalActions/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('fetches data from network', async () => {
        const mockData = getMock('global-actions');
        const config = {};
        mockGetGlobalActionsNetwork(config, mockData);

        const element = await setupElement(config, GlobalActions);

        expect(element.getWiredData()).toEqualActionsSnapshot(mockData);
    });
});

describe('caching', () => {
    it('returns cached result when cached data is available', async () => {
        const mockData = getMock('global-actions');
        const config = {};
        mockGetGlobalActionsNetwork(config, mockData);

        // populate cache
        await setupElement(config, GlobalActions);

        // second component should have the cached data without hitting network
        const element = await setupElement(config, GlobalActions);

        expect(element.getWiredData()).toEqualActionsSnapshot(mockData);
    });

    it('retrieves data from network when cached data is expired', async () => {
        const mockData = getMock('global-actions');
        const updatedData = getMock('global-actions');
        Object.assign(updatedData, {
            eTag: mockData.eTag + '999',
        });
        const config = {};
        mockGetGlobalActionsNetwork(config, [mockData, updatedData]);

        // populate cache
        await setupElement(config, GlobalActions);

        // expire cache
        expireActions();

        // second component should retrieve from network with updated data
        const element = await setupElement(config, GlobalActions);

        expect(element.getWiredData()).toEqualActionsSnapshot(updatedData);
    });
});

describe('data emit', () => {
    it('emits updated data to wire with same config', async () => {
        const mockData = getMock('global-actions');
        const updatedData = getMock('global-actions');
        Object.assign(updatedData, {
            eTag: mockData.eTag + '999',
        });
        const config = {};
        mockGetGlobalActionsNetwork(config, [mockData, updatedData]);

        const element = await setupElement(config, GlobalActions);
        expireActions();

        // fetches updated data from network
        await setupElement(config, GlobalActions);

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredData()).toEqualActionsSnapshot(updatedData);
    });

    it('should not emit data to wires if data from network is same', async () => {
        const mockData = getMock('global-actions');
        const config = {};
        mockGetGlobalActionsNetwork(config, [mockData, mockData]);

        const element = await setupElement(config, GlobalActions);
        expireActions();

        // fetches updated data from network
        await setupElement(config, GlobalActions);

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredData()).toEqualActionsSnapshot(mockData);
    });

    it('should be a cache hit when ingested 404 does not exceed ttl', async () => {
        const mockError = getMock('global-actions-error');

        const config = {};
        mockGetGlobalActionsNetwork(config, {
            reject: true,
            data: {
                status: 404,
                statusText: 'Not Found',
                ok: false,
                body: mockError,
            },
        });

        const element = await setupElement(config, GlobalActions);

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredError()).toContainErrorBody(mockError);

        const elementB = await setupElement(config, GlobalActions);

        expect(elementB.pushCount()).toBe(1);
        expect(elementB.getWiredError()).toContainErrorBody(mockError);
    });

    it('should refresh when ingested error exceeds ttl', async () => {
        const mock = getMock('global-actions');
        const mockError = getMock('global-actions-error');

        const config = {};
        mockGetGlobalActionsNetwork(config, [
            {
                reject: true,
                data: {
                    status: 404,
                    statusText: 'Not Found',
                    ok: false,
                    body: mockError,
                },
            },
            mock,
        ]);

        const element = await setupElement(config, GlobalActions);

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredError()).toContainErrorBody(mockError);

        expireActions();

        const elementB = await setupElement(config, GlobalActions);

        expect(elementB.pushCount()).toBe(1);
        expect(elementB.getWiredError()).toBeUndefined();
        expect(elementB.getWiredData()).toEqualActionsSnapshot(mock);
    });

    it('should not emit data to wire with different apiNames', async () => {
        const mockData = getMock('global-actions');
        const config = {};
        mockGetGlobalActionsNetwork(config, mockData);

        const apiNamesMockData = getMock('global-actions-apiNames');
        const apiNamesConfig = {
            retrievalMode: 'All',
            apiNames: ['Global.NewEvent', 'Global.NewContact'],
        };
        apiNamesConfig.apiNames.sort();
        mockGetGlobalActionsNetwork(apiNamesConfig, apiNamesMockData);

        const wireA = await setupElement(config, GlobalActions);
        expect(wireA.getWiredData()).toEqualActionsSnapshot(mockData);

        const wireB = await setupElement(apiNamesConfig, GlobalActions);
        expect(wireB.getWiredData()).toEqualActionsSnapshot(apiNamesMockData);

        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualActionsSnapshot(mockData);
    });
});

describe('refresh', () => {
    it('refreshes with up-to-date data', async () => {
        const mockData = getMock('global-actions');
        const config = {};
        const refreshMockData = getMock('global-actions');
        Object.assign(refreshMockData, {
            eTag: mockData.eTag + '999',
        });

        mockGetGlobalActionsNetwork(config, [mockData, refreshMockData]);

        const element = await setupElement(config, GlobalActions);
        expect(element.getWiredData()).toEqualActionsSnapshot(mockData);

        await element.refresh();

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredData()).toEqualActionsSnapshot(refreshMockData);
    });
});
