import ObjectApiName from '../lwc/objectApiName';
import { getListUi_imperative } from 'lds-adapters-uiapi';
import {
    flushPromises,
    mockNetworkOnce,
    mockNetworkSequence,
    setupElement,
    updateElement,
    getMock as globalGetMock,
} from 'test-util';
import { URL_BASE, expireDefaultTTL } from 'uiapi-test-util';
import { karmaNetworkAdapter } from 'lds-engine';
import sinon from 'sinon';

const MOCK_PREFIX = 'wire/getListViewSummaryCollection/__karma__/objectApiName/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

function mockNetworkListUi(config, mockData) {
    function paramMatch(value) {
        return (
            value.basePath === `${URL_BASE}/list-ui/${config.objectApiName}` &&
            // default sinon matching will match superset with subset
            Object.entries(value.queryParams).every(([k, v]) => config[k] === v) &&
            Object.entries(config).every(
                ([k, v]) => k === 'objectApiName' || value.queryParams[k] === v
            )
        );
    }
    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, sinon.match(paramMatch), mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, sinon.match(paramMatch), mockData);
    }
}

describe('basic', () => {
    it('returns metadata and records when only objectApiName provided', async () => {
        const mockData = getMock('list-ui-Opportunity');
        const config = {
            objectApiName: mockData.objectApiName,
        };
        mockNetworkListUi(config, mockData);

        const element = await setupElement(config, ObjectApiName);
        expect(element.getWiredData()).toEqualListSnapshotWithoutPrivateProps(mockData);
    });

    it('requesting a smaller pageSize makes an XHR request', async () => {
        const mockDataPageSize6 = getMock('list-ui-Opportunity-pageSize-6');
        const mockDataPageSize3 = getMock('list-ui-Opportunity-pageSize-3');

        const { objectApiName } = mockDataPageSize6;

        const config = {
            objectApiName,
            pageSize: mockDataPageSize6.pageSize,
        };
        mockNetworkListUi(config, mockDataPageSize6);

        const element = await setupElement(config, ObjectApiName);
        expect(element.getWiredData()).toEqualListSnapshotWithoutPrivateProps(mockDataPageSize6);

        mockNetworkListUi({ objectApiName, pageSize: 3, pageToken: '0' }, mockDataPageSize3);
        await updateElement(element, { pageSize: 3 });

        expect(element.getWiredData()).toEqualListSnapshotWithoutPrivateProps(mockDataPageSize3);
    });

    it('makes additional XHR for same objectApiName and larger pageSize', async () => {
        const mockData1 = getMock('list-ui-Opportunity-pageSize-3');

        const { objectApiName } = mockData1;

        const config1 = {
            objectApiName,
            pageSize: mockData1.pageSize,
        };
        mockNetworkListUi(config1, mockData1);

        const element = await setupElement(config1, ObjectApiName);
        expect(element.getWiredData().count).toBe(3);

        const mockData2 = getMock('list-ui-Opportunity-pageToken-3-pageSize-3');
        const config2 = {
            objectApiName,
            pageToken: mockData1.nextPageToken || undefined,
            pageSize: mockData2.pageSize,
        };
        mockNetworkListUi(config2, mockData2);

        await updateElement(element, { pageSize: 6 });

        // verify the adapter constructed the same response that the server would have
        const mockData3 = getMock('list-ui-Opportunity-pageSize-6');
        expect(element.getWiredData()).toEqualListSnapshotWithoutPrivateProps(mockData3);
    });

    it('makes additional XHR when q parameter changes', async () => {
        // fetch with q=this
        let mockData = getMock('list-ui-Opportunity-q-this');
        let config = {
            objectApiName: mockData.objectApiName,
            q: mockData.queryString || undefined,
        };
        mockNetworkListUi(config, mockData);

        const element = await setupElement(config, ObjectApiName);
        expect(element.getWiredData()).toEqualListSnapshotWithoutPrivateProps(mockData);

        // fetch with no q
        mockData = getMock('list-ui-Opportunity');
        config = {
            objectApiName: mockData.objectApiName,
            q: mockData.queryString || undefined,
        };
        mockNetworkListUi(config, mockData);

        await updateElement(element, { q: config.q }); // undefined
        expect(element.getWiredData()).toEqualListSnapshotWithoutPrivateProps(mockData);

        // fetch with q=month
        mockData = getMock('list-ui-Opportunity-q-month');
        config = {
            objectApiName: mockData.objectApiName,
            q: mockData.queryString || undefined,
        };
        mockNetworkListUi(config, mockData);

        await updateElement(element, { q: config.q });
        expect(element.getWiredData()).toEqualListSnapshotWithoutPrivateProps(mockData);
    });

    it('makes additional XHR when recentListsOnly parameter changes', async () => {
        // fetch with no recentListsOnly
        const mockData1 = getMock('list-ui-Opportunity');
        let config = {
            objectApiName: mockData1.objectApiName,
        };
        mockNetworkListUi(config, mockData1);

        const element = await setupElement(config, ObjectApiName);
        expect(element.getWiredData()).toEqualListSnapshotWithoutPrivateProps(mockData1);

        // fetch with recentListsOnly=true
        const mockData2 = getMock('list-ui-Opportunity-recentListsOnly-true');
        config = {
            objectApiName: mockData2.objectApiName,
            recentListsOnly: mockData2.recentListsOnly,
        };
        mockNetworkListUi(config, mockData2);

        await updateElement(element, { recentListsOnly: config.recentListsOnly });
        expect(element.getWiredData()).toEqualListSnapshotWithoutPrivateProps(mockData2);

        // recentListsOnly=false uses cached data
        await updateElement(element, { recentListsOnly: false });
        expect(element.getWiredData()).toEqualListSnapshotWithoutPrivateProps(mockData1);
    });

    it('uses pageToken to page through records', async () => {
        const mockDataPageSize3 = getMock('list-ui-Opportunity-pageSize-3');
        const mockDataPageToken3PageSize3 = getMock('list-ui-Opportunity-pageToken-3-pageSize-3');

        const { objectApiName, pageSize } = mockDataPageSize3;

        const config = { objectApiName, pageSize, pageToken: '0' };
        mockNetworkListUi(config, mockDataPageSize3);

        const element = await setupElement(config, ObjectApiName);
        expect(element.getWiredData()).toEqualListSnapshotWithoutPrivateProps(mockDataPageSize3);

        // mimicking the behavior of click the next button to load next records
        mockNetworkListUi({ ...config, pageToken: '3' }, mockDataPageToken3PageSize3);
        await updateElement(element, { pageToken: '3' });

        expect(element.getWiredData()).toEqualListSnapshotWithoutPrivateProps(
            mockDataPageToken3PageSize3
        );
        expect(element.pushCount()).toBe(2);
    });
});

describe('caching', () => {
    it('does not make additional XHR for same objectApiName request', async () => {
        const mockData = getMock('list-ui-Opportunity');
        const config = {
            objectApiName: mockData.objectApiName,
        };
        mockNetworkListUi(config, mockData);

        const element1 = await setupElement(config, ObjectApiName);
        expect(element1.getWiredData()).toEqualListSnapshotWithoutPrivateProps(mockData);

        const element2 = await setupElement(config, ObjectApiName);
        expect(element2.getWiredData()).toEqualListSnapshotWithoutPrivateProps(mockData);

        expect(element1.pushCount()).toEqual(1);
    });

    it('makes a network request after ListViewSummaryCollectionRepresentation is TTL expired', async () => {
        const mockData = getMock('list-ui-Opportunity');
        const config = { objectApiName: mockData.objectApiName };

        mockNetworkListUi(config, [mockData, mockData]);
        const element = await setupElement(config, ObjectApiName);
        expect(element.getWiredData()).toEqualListSnapshotWithoutPrivateProps(mockData);

        expireDefaultTTL();

        const element2 = await setupElement(config, ObjectApiName);
        expect(element2.getWiredData()).toEqualListSnapshotWithoutPrivateProps(mockData);
    });
});

describe('errors', () => {
    it('returns error when objectApiName do not exist', async () => {
        const mockError = {
            ok: false,
            status: 404,
            statusText: 'NOT_FOUND',
            body: [
                {
                    errorCode: 'NOT_FOUND',
                    message: 'The requested resource does not exist',
                },
            ],
        };

        const config = {
            objectApiName: 'badObjectApiName',
        };

        mockNetworkListUi(config, { reject: true, data: mockError });
        const element = await setupElement(config, ObjectApiName);
        expect(element.getWiredError()).toEqualImmutable(mockError);
    });

    it('returns error when pageSize is -1', async () => {
        const mockError = {
            ok: false,
            status: 400,
            statusText: 'BAD_REQUEST',
            body: [
                {
                    errorCode: 'NUMBER_OUTSIDE_VALID_RANGE',
                    message: 'pageSize parameter must be between 1 and 2000',
                },
            ],
        };

        const config = { objectApiName: 'Opportunity', pageSize: -1 };

        mockNetworkListUi(config, { reject: true, data: mockError });
        const element = await setupElement(config, ObjectApiName);
        expect(element.getWiredError()).toEqualImmutable(mockError);
    });

    it('returns error when pageSize is above max', async () => {
        const mockError = {
            ok: false,
            status: 400,
            statusText: 'BAD_REQUEST',
            body: [
                {
                    errorCode: 'NUMBER_OUTSIDE_VALID_RANGE',
                    message: 'pageSize parameter must be between 1 and 2000',
                },
            ],
        };

        const config = { objectApiName: 'Opportunity', pageSize: 2100 };

        mockNetworkListUi(config, { reject: true, data: mockError });
        const element = await setupElement(config, ObjectApiName);
        expect(element.getWiredError()).toEqualImmutable(mockError);
    });

    it('returns error when pageToken is invalid', async () => {
        const mockError = {
            ok: false,
            status: 400,
            statusText: 'BAD_REQUEST',
            body: [
                {
                    errorCode: 'ILLEGAL_QUERY_PARAMETER_VALUE',
                    message: 'For input string: invalid',
                },
            ],
        };

        const config = { objectApiName: 'Opportunity', pageSize: 20, pageToken: 'invalid' };

        mockNetworkListUi(config, { reject: true, data: mockError });
        const element = await setupElement(config, ObjectApiName);
        expect(element.getWiredError()).toEqualImmutable(mockError);
    });
});

describe('getListUi_imperative', () => {
    it('uses caller-supplied cache policy', async () => {
        const mock1 = getMock('list-ui-Opportunity');
        const mock2 = getMock('list-ui-Opportunity');
        mock2.eTag = mock2.eTag + '999';
        mock2.lists = [];
        mock2.count = 0;

        const config = { objectApiName: mock1.objectApiName };

        mockNetworkListUi(config, [mock1, mock2]);

        const callback = jasmine.createSpy();

        // populate cache with mock1
        getListUi_imperative.invoke(config, undefined, callback);
        await flushPromises();

        callback.calls.reset();

        // should emit mock1 from cache, then make network call & emit mock2
        getListUi_imperative.subscribe(
            config,
            { cachePolicy: { type: 'cache-and-network' } },
            callback
        );
        await flushPromises();

        expect(callback).toHaveBeenCalledTimes(2);
        expect(callback.calls.argsFor(0)[0].data).toEqualListSnapshotWithoutPrivateProps(mock1);
        expect(callback.calls.argsFor(0)[0].error).toBeUndefined();
        expect(callback.calls.argsFor(1)[0].data).toEqualListSnapshotWithoutPrivateProps(mock2);
        expect(callback.calls.argsFor(1)[0].error).toBeUndefined();
    });
});
