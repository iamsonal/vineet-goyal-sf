import ObjectApiName from '../lwc/objectApiName';
import { mockNetworkOnce, flushPromises, setupElement, getMock as globalGetMock } from 'test-util';
import { URL_BASE } from 'uiapi-test-util';
import { karmaNetworkAdapter } from 'lds';
import sinon from 'sinon';

const MOCK_PREFIX = 'wire/getListViewSummaryCollection/__karma__/objectApiName/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

function mockNetworkListUi(config, mockData) {
    function paramMatch(value) {
        return (
            value.path === `${URL_BASE}/list-ui/${config.objectApiName}` &&
            // default sinon matching will match superset with subset
            Object.entries(value.queryParams).every(([k, v]) => config[k] === v) &&
            Object.entries(config).every(
                ([k, v]) => k === 'objectApiName' || value.queryParams[k] === v
            )
        );
    }
    mockNetworkOnce(karmaNetworkAdapter, sinon.match(paramMatch), mockData);
}

describe('with objectApiName', () => {
    it('returns metadata and records when only objectApiName provided', async () => {
        const mockData = getMock('list-ui-Opportunity');
        const config = {
            objectApiName: mockData.objectApiName,
        };
        mockNetworkListUi(config, mockData);

        const element = await setupElement(config, ObjectApiName);

        const wiredData = element.getWiredData();

        expect(wiredData.error).toBeUndefined();
        expect(wiredData.data).toEqualSnapshotWithoutEtags(mockData);
    });

    it('does not make additional XHR for same objectApiName request', async () => {
        const mockData = getMock('list-ui-Opportunity');
        const config = {
            objectApiName: mockData.objectApiName,
        };
        mockNetworkListUi(config, mockData);

        const element1 = await setupElement(config, ObjectApiName);
        const element2 = await setupElement(config, ObjectApiName);

        expect(element1.getWiredData().data).toEqualSnapshotWithoutEtags(
            element2.getWiredData().data
        );
    });

    xit('does not make additional XHR for smaller pageSize request', async () => {});

    it('makes additional XHR for same objectApiName and larger pageSize', async () => {
        const mockData1 = getMock('list-ui-Opportunity-pageSize-3');

        const { objectApiName } = mockData1;

        const config1 = {
            objectApiName,
            pageSize: mockData1.pageSize,
        };
        mockNetworkListUi(config1, mockData1);

        const element = await setupElement(config1, ObjectApiName);

        let wiredData = element.getWiredData();
        expect(wiredData.data.count).toBe(3);

        const mockData2 = getMock('list-ui-Opportunity-pageToken-3-pageSize-3');
        const config2 = {
            objectApiName,
            pageToken: mockData1.nextPageToken || undefined,
            pageSize: mockData2.pageSize,
        };
        mockNetworkListUi(config2, mockData2);

        element.pageSize = 6;
        await flushPromises();

        wiredData = element.getWiredData();
        expect(wiredData.data.count).toBe(6);

        // verify the adapter constructed the same response that the server would have
        const mockData3 = getMock('list-ui-Opportunity-pageSize-6');
        expect(wiredData.data).toEqualSnapshotWithoutEtags(mockData3);
    });

    xit('makes additional XHR after list-ui TTL expired', async () => {});

    it('makes additional XHR when q parameter changes', async () => {
        // fetch with q=this
        let mockData = getMock('list-ui-Opportunity-q-this');
        let config = {
            objectApiName: mockData.objectApiName,
            q: mockData.queryString || undefined,
        };
        mockNetworkListUi(config, mockData);

        const element = await setupElement(config, ObjectApiName);

        let wiredData = element.getWiredData();
        expect(wiredData.data).toEqualSnapshotWithoutEtags(mockData);

        // fetch with no q
        mockData = getMock('list-ui-Opportunity');
        config = {
            objectApiName: mockData.objectApiName,
            q: mockData.queryString || undefined,
        };
        mockNetworkListUi(config, mockData);

        element.q = config.q; // undefined
        await flushPromises();

        wiredData = element.getWiredData();
        expect(wiredData.data).toEqualSnapshotWithoutEtags(mockData);

        // fetch with q=month
        mockData = getMock('list-ui-Opportunity-q-month');
        config = {
            objectApiName: mockData.objectApiName,
            q: mockData.queryString || undefined,
        };
        mockNetworkListUi(config, mockData);

        element.q = config.q;
        await flushPromises();

        wiredData = element.getWiredData();
        expect(wiredData.data).toEqualSnapshotWithoutEtags(mockData);
    });

    it('makes additional XHR when recentListsOnly parameter changes', async () => {
        // fetch with no recentListsOnly
        const mockData1 = getMock('list-ui-Opportunity');
        let config = {
            objectApiName: mockData1.objectApiName,
        };
        mockNetworkListUi(config, mockData1);

        const element = await setupElement(config, ObjectApiName);

        let wiredData = element.getWiredData();
        expect(wiredData.data).toEqualSnapshotWithoutEtags(mockData1);

        // fetch with recentListsOnly=true
        const mockData2 = getMock('list-ui-Opportunity-recentListsOnly-true');
        config = {
            objectApiName: mockData2.objectApiName,
            recentListsOnly: mockData2.recentListsOnly,
        };
        mockNetworkListUi(config, mockData2);

        element.recentListsOnly = config.recentListsOnly;
        await flushPromises();

        wiredData = element.getWiredData();
        expect(wiredData.data).toEqualSnapshotWithoutEtags(mockData2);

        // recentListsOnly=false uses cached data
        element.recentListsOnly = false;
        await flushPromises();

        wiredData = element.getWiredData();
        expect(wiredData.data).toEqualSnapshotWithoutEtags(mockData1);
    });

    xit('uses pageToken to page through records', async () => {});
    xit('returns error when objectApiName do not exist', async () => {});
    xit('no XHR if previously requested by listViewId', async () => {});
    xit('does not make second XHR for additional fields', async () => {});
    xit('does not make second XHR for removed fields', async () => {});
    xit('does not make second XHR for objectApiName that does not exist', async () => {});
    xit('returns error when pageSize is 0', async () => {});
    xit('returns error when pageSize is above max', async () => {});
    xit('returns error when pageToken is -1', async () => {});
    xit('returns error when pageToken is above max', async () => {});
    xit('returns error when requests non-existent fields', async () => {});
    xit('returns error when objectApiName not set', async () => {});
});
