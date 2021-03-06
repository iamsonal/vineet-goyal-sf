import { getListUi_imperative } from 'lds-adapters-uiapi';
import ListViewId from '../lwc/listViewId';
import ObjectAndListViewApiName from '../lwc/objectAndListViewApiName';
import { beforeEach as util_beforeEach, convertToFieldIds } from '../util';
import {
    flushPromises,
    getMock as globalGetMock,
    mockNetworkOnce,
    mockNetworkSequence,
    setupElement,
    updateElement,
} from 'test-util';
import { URL_BASE, expireDefaultTTL } from 'uiapi-test-util';
import { karmaNetworkAdapter } from 'lds-engine';
import sinon from 'sinon';

const MOCK_PREFIX = 'wire/getListUi/__karma__/listViewId/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

function mockNetworkListUi(config, mockData) {
    const { listViewId, ...queryParams } = config;

    const paramMatch = sinon.match({
        basePath: `${URL_BASE}/list-ui/${listViewId}`,
        queryParams,
    });

    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockNetworkListRecords(config, mockData) {
    const { listViewId, ...queryParams } = config;

    const paramMatch = sinon.match({
        basePath: `${URL_BASE}/list-records/${listViewId}`,
        queryParams,
    });
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function mockNetworkByApiNames(config, mockData) {
    const { objectApiName, listViewApiName, ...queryParams } = config;

    const paramMatch = sinon.match({
        basePath: `${URL_BASE}/list-ui/${objectApiName}/${listViewApiName}`,
        queryParams,
    });
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

beforeEach(() => {
    util_beforeEach();
});

describe('with listViewId', () => {
    describe('basic', () => {
        it('returns metadata and records when only listViewId is provided', async () => {
            const mockData = getMock('list-ui-All-Opportunities');
            const config = {
                listViewId: mockData.info.listReference.id,
            };
            mockNetworkListUi(config, mockData);

            const element = await setupElement(config, ListViewId);

            expect(element.getWiredData()).toEqualListUi(mockData);
        });

        it('emits list-ui data when the returned list is empty', async () => {
            const mockData = getMock('list-ui-empty-list');

            const config = { listViewId: mockData.info.listReference.id };

            mockNetworkListUi(config, mockData);
            const element = await setupElement(config, ListViewId);
            expect(element.getWiredData()).toEqualListUi(mockData);
        });

        it('does not make second XHR when the returned list is empty', async () => {
            const mockData = getMock('list-ui-empty-list');

            const config = { listViewId: mockData.info.listReference.id };

            mockNetworkListUi(config, mockData);
            const element1 = await setupElement(config, ListViewId);
            expect(element1.getWiredData()).toEqualListUi(mockData);

            const element2 = await setupElement(config, ListViewId);
            expect(element2.getWiredData()).toEqualListUi(mockData);
        });
    });

    describe('caching', () => {
        it('does not make additional XHR for same listViewId request', async () => {
            const mockData = getMock('list-ui-All-Opportunities-pageSize-3');
            const config = {
                listViewId: mockData.info.listReference.id,
                pageSize: 3,
            };
            mockNetworkListUi(config, mockData);

            // each LWC component will trigger a separate wire call
            const element1 = await setupElement(config, ListViewId);
            const element2 = await setupElement(config, ListViewId);

            expect(element1.getWiredData().data).toEqualSnapshotWithoutEtags(
                element2.getWiredData().data
            );
        });

        it('reuses cached records when possible and uses list-records to retrieve missing records', async () => {
            let wiredData;

            // @wire pageSize=3, should request list-ui pageSize=3
            const mockData0_3 = getMock('list-ui-All-Opportunities-pageSize-3');
            const config0_3 = {
                listViewId: mockData0_3.info.listReference.id,
                pageSize: mockData0_3.records.pageSize,
            };
            mockNetworkListUi(config0_3, mockData0_3);

            const element = await setupElement(config0_3, ListViewId);

            // should have made the list-ui call and emitted 3 records
            expect(karmaNetworkAdapter.callCount).toBe(1);
            wiredData = element.getWiredData();
            expect(wiredData.data.records.records.length).toBe(3);

            // @wire pageSize=6, should request list-records pageToken=3, pageSize=3
            const mockData3_3 = getMock('list-records-All-Opportunities-pageToken-3-pageSize-3');
            const config3_3 = {
                listViewId: mockData0_3.info.listReference.id,
                pageToken: mockData0_3.records.nextPageToken,
                pageSize: mockData3_3.pageSize,
            };
            mockNetworkListRecords(config3_3, mockData3_3);

            await updateElement(element, {
                pageSize: config0_3.pageSize + config3_3.pageSize,
            });

            // should have made the list-records call and emitted 6 records
            expect(karmaNetworkAdapter.callCount).toBe(2);
            wiredData = element.getWiredData();
            expect(wiredData.data.records.records.length).toBe(
                config0_3.pageSize + config3_3.pageSize
            );

            // verify the adapter constructed the same response that the server would have
            let expected = getMock('list-ui-All-Opportunities-pageSize-6');
            expect(wiredData).toEqualListUi(expected);

            // @wire pageToken='3', pageSize=3, should not make any requests
            await updateElement(element, {
                pageToken: '3',
                pageSize: 3,
            });

            // verify the adapter constructed the same response that the server would have
            expected = getMock('list-ui-All-Opportunities-pageToken-3-pageSize-3');

            wiredData = element.getWiredData();
            expect(wiredData).toEqualListUi(expected);
        });

        it('makes additional XHR after list-ui TTL expired', async () => {
            const mockData = getMock('list-ui-All-Opportunities');

            const config = { listViewId: mockData.info.listReference.id };

            mockNetworkListUi(config, [mockData, mockData]);

            await setupElement(config, ListViewId);
            // speed up time to reach list-ui TTL(default TTL) and force additional server request
            expireDefaultTTL();

            const element = await setupElement(config, ListViewId);
            expect(element.getWiredData()).toEqualListUi(mockData);
        });

        it('no XHR if previously requested by objectApiName and listViewApiName', async () => {
            const mockDataPageSize3 = getMock('list-ui-All-Opportunities-pageSize-3');

            const configApiNames = {
                objectApiName: mockDataPageSize3.info.listReference.objectApiName,
                listViewApiName: mockDataPageSize3.info.listReference.listViewApiName,
                pageSize: mockDataPageSize3.records.pageSize,
            };
            mockNetworkByApiNames(configApiNames, mockDataPageSize3);

            const configPageSize3 = {
                listViewId: mockDataPageSize3.info.listReference.id,
                pageSize: mockDataPageSize3.records.pageSize,
            };

            const elementApiName = await setupElement(configApiNames, ObjectAndListViewApiName);
            expect(elementApiName.getWiredData()).toEqualListUi(mockDataPageSize3);

            const elementListViewId = await setupElement(configPageSize3, ListViewId);
            expect(elementListViewId.getWiredData()).toEqualListUi(mockDataPageSize3);

            expect(elementApiName.getWiredData().data).toEqualSnapshotWithoutEtags(
                elementListViewId.getWiredData().data
            );
        });

        it('does not make second XHR for fields returned from first request', async () => {
            const mockData = getMock('list-ui-All-Opportunities-pageSize-3');
            const config = {
                listViewId: mockData.info.listReference.id,
                pageSize: mockData.records.pageSize,
            };
            mockNetworkListUi(config, mockData);

            const element = await setupElement(config, ListViewId);
            await updateElement(ListViewId, { fields: 'Account.Name' });

            const wiredData = element.getWiredData();
            expect(wiredData).toEqualListUi(mockData);
        });

        it('does not make second XHR for removed fields', async () => {
            const mockData = getMock(
                'list-ui-All-Opportunities-pageSize-1-fields-IsPrivate,NextStep'
            );
            const config = {
                listViewId: mockData.info.listReference.id,
                pageSize: mockData.records.pageSize,
                fields: mockData.records.fields,
            };
            mockNetworkListUi(config, mockData);

            const element = await setupElement(config, ListViewId);
            const fields = element.fields.slice(0, 1);
            await updateElement(ListViewId, { fields });

            const wiredData = element.getWiredData();
            expect(wiredData).toEqualListUi(mockData);
        });

        it('makes new request when a fetched list-records has an etag that does not match the list-info', async () => {
            const mockDataListUi = getMock('list-ui-All-Opportunities-pageSize-3');
            const config = {
                listViewId: mockDataListUi.info.listReference.id,
                pageSize: mockDataListUi.records.pageSize,
            };
            mockNetworkListUi(config, mockDataListUi);
            await setupElement(config, ListViewId);

            const mockDataListRecords = getMock(
                'list-records-All-Opportunities-pageToken-3-pageSize-3'
            );

            const config2 = {
                listViewId: mockDataListUi.info.listReference.id,
                pageSize: mockDataListRecords.pageSize,
                pageToken: mockDataListUi.records.nextPageToken,
            };

            mockDataListRecords.listInfoETag = 'updatedetag';

            mockNetworkListRecords(config2, mockDataListRecords);

            const updatedListUi = getMock(
                'list-ui-All-Opportunities-pageToken-3-pageSize-3-sortBy-Account.Name'
            );
            updatedListUi.info.eTag = 'updatedetag';
            updatedListUi.records.listInfoETag = 'updatedetag';
            // TODO [W-9923716]: previousPageToken is returned as null in mistake.
            updatedListUi.records.previousPageToken = null;
            mockNetworkListUi(config2, updatedListUi);

            const element = await setupElement(config2, ListViewId);
            expect(element.getWiredData()).toEqualListUi(updatedListUi);
        });
    });

    describe('sortBy', () => {
        it('handles paginated requests that specify sortBy', async () => {
            let wiredData;

            // @wire pageSize=3,sortBy= should request list-ui pageSize=3,sortBy=
            const mockData0_3 = getMock('list-ui-All-Opportunities-pageSize-3-sortBy-Account.Name');
            const config0_3 = {
                listViewId: mockData0_3.info.listReference.id,
                pageSize: mockData0_3.records.pageSize,
                sortBy: mockData0_3.records.sortBy.split(','),
            };
            mockNetworkListUi(config0_3, mockData0_3);

            const element = await setupElement(config0_3, ListViewId);

            // should have made the list-ui call and emitted 3 records
            expect(karmaNetworkAdapter.callCount).toBe(1);
            wiredData = element.getWiredData();
            expect(wiredData.data.records.records.length).toBe(3);
            expect(wiredData).toEqualListUi(mockData0_3);

            // @wire pageSize=6,sortBy= should request list-records pageToken=3, pageSize=3,sortBy=
            const mockData3_3 = getMock(
                'list-records-All-Opportunities-pageToken-3-pageSize-3-sortBy-Account.Name'
            );
            const config3_3 = {
                listViewId: mockData3_3.listReference.id,
                pageToken: mockData0_3.records.nextPageToken,
                pageSize: mockData3_3.pageSize,
                sortBy: mockData3_3.sortBy.split(','),
            };
            mockNetworkListRecords(config3_3, mockData3_3);

            await updateElement(element, {
                pageSize: config0_3.pageSize + config3_3.pageSize,
            });

            // should have made the list-records call and emitted 6 records
            expect(karmaNetworkAdapter.callCount).toBe(2);
            wiredData = element.getWiredData();
            expect(wiredData.data.records.records.length).toBe(
                config0_3.pageSize + config3_3.pageSize
            );

            // verify the adapter constructed the same response that the server would have
            let expected = getMock('list-ui-All-Opportunities-pageSize-6-sortBy-Account.Name');
            expect(wiredData).toEqualListUi(expected);

            // @wire pageToken='3', pageSize=3, should not make any requests
            await updateElement(element, {
                pageToken: '3',
                pageSize: 3,
            });

            // verify the adapter constructed the same response that the server would have
            expected = getMock(
                'list-ui-All-Opportunities-pageToken-3-pageSize-3-sortBy-Account.Name'
            );
            expect(element.getWiredData()).toEqualListUi(expected);
        });

        it('does not use cached data when sortBy differs', async () => {
            // no sortBy specified
            let mockData = getMock('list-ui-All-Opportunities-pageSize-3');
            let config = {
                listViewId: mockData.info.listReference.id,
                pageSize: mockData.records.pageSize,
            };
            mockNetworkListUi(config, mockData);

            const element = await setupElement(config, ListViewId);

            expect(element.getWiredData()).toEqualListUi(mockData);

            // add sortBy single field, ascending
            mockData = getMock('list-ui-All-Opportunities-pageSize-3-sortBy-Account.Name');
            config = {
                listViewId: mockData.info.listReference.id,
                pageSize: mockData.records.pageSize,
                sortBy: mockData.records.sortBy.split(','),
            };
            mockNetworkListUi(config, mockData);

            await updateElement(element, {
                sortBy: ['Account.Name'],
            });

            expect(element.getWiredData()).toEqualListUi(mockData);

            // sortBy same field, but descending
            mockData = getMock('list-ui-All-Opportunities-pageSize-3-sortBy--Account.Name');
            config = {
                listViewId: mockData.info.listReference.id,
                pageSize: mockData.records.pageSize,
                sortBy: mockData.records.sortBy.split(','),
            };
            mockNetworkListUi(config, mockData);

            await updateElement(element, {
                sortBy: ['-Account.Name'],
            });

            expect(element.getWiredData()).toEqualListUi(mockData);
        });
    });

    describe('fields/optionalFields', () => {
        it('returns metadata and data for string list of fields', async () => {
            const mockData = getMock(
                'list-ui-All-Opportunities-pageSize-1-fields-IsPrivate,NextStep'
            );
            const config = {
                listViewId: mockData.info.listReference.id,
                pageSize: mockData.records.pageSize,
                fields: mockData.records.fields,
            };
            mockNetworkListUi(config, mockData);

            const element = await setupElement(config, ListViewId);

            expect(element.getWiredData()).toEqualListUi(mockData);
        });

        it('returns metadata and data for fields as schema', async () => {
            const mockData = getMock(
                'list-ui-All-Opportunities-pageSize-1-fields-Opportunity.IsPrivate,Opportunity.NextStep'
            );
            let config = {
                listViewId: mockData.info.listReference.id,
                pageSize: mockData.records.pageSize,
                fields: mockData.records.fields,
            };
            mockNetworkListUi(config, mockData);

            config = convertToFieldIds(config);
            const element = await setupElement(config, ListViewId);

            expect(element.getWiredData()).toEqualListUi(mockData);
        });

        it('returns metadata and data for string list of optionalFields', async () => {
            const mockData = getMock(
                'list-ui-All-Opportunities-pageSize-1-optionalFields-IsPrivate,NextStep'
            );
            const config = {
                listViewId: mockData.info.listReference.id,
                pageSize: mockData.records.pageSize,
                optionalFields: mockData.records.optionalFields,
            };
            mockNetworkListUi(config, mockData);

            const element = await setupElement(config, ListViewId);

            expect(element.getWiredData()).toEqualListUi(mockData);
        });

        it('returns metadata and data for optionalFields as schema', async () => {
            const mockData = getMock(
                'list-ui-All-Opportunities-pageSize-1-optionalFields-Opportunity.IsPrivate,Opportunity.NextStep'
            );
            let config = {
                listViewId: mockData.info.listReference.id,
                pageSize: mockData.records.pageSize,
                optionalFields: mockData.records.optionalFields,
            };
            mockNetworkListUi(config, mockData);

            config = convertToFieldIds(config);
            const element = await setupElement(config, ListViewId);

            expect(element.getWiredData()).toEqualListUi(mockData);
        });
    });
});

describe('getListUi_imperative', () => {
    it('uses caller-supplied cache policy', async () => {
        const mockData = getMock('list-ui-All-Opportunities-pageSize-3');
        const config = {
            listViewId: mockData.info.listReference.id,
            pageSize: mockData.records.pageSize,
        };

        const refreshed = getMock('list-ui-All-Opportunities-pageSize-3');
        const record = refreshed.records.records[0];
        record.lastModifiedDate = new Date(
            new Date(record.lastModifiedDate).getTime() + 60 * 1000
        ).toISOString();
        record.weakEtag = record.weakEtag + 999;

        mockNetworkListUi(config, [mockData, refreshed]);

        const callback = jasmine.createSpy();

        // populate cache with mockListUiData1
        getListUi_imperative.invoke(config, undefined, callback);
        await flushPromises();

        callback.calls.reset();

        // should emit mockListUiData1 from cache, then make network call & emit mockListUiData2
        getListUi_imperative.subscribe(
            config,
            { cachePolicy: { type: 'cache-and-network' } },
            callback
        );
        await flushPromises();

        expect(callback).toHaveBeenCalledTimes(2);
        expect(callback.calls.argsFor(0)[0]).toEqualListUi(mockData);
        expect(callback.calls.argsFor(1)[0]).toEqualListUi(refreshed);
    });
});
