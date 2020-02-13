import ListViewId from '../lwc/listViewId';
import ObjectAndListViewApiName from '../lwc/objectAndListViewApiName';
import { beforeEach as util_beforeEach, convertToFieldIds } from '../util';
import { mockNetworkOnce, flushPromises, setupElement, getMock as globalGetMock } from 'test-util';
import { URL_BASE, expireListUi } from 'uiapi-test-util';
import { karmaNetworkAdapter } from 'lds';
import sinon from 'sinon';

window.engine = window.ldsEngine;

const MOCK_PREFIX = 'wire/getListUi/__karma__/listViewId/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

function mockNetworkListUi(config, mockData) {
    const listViewId = config.listViewId;
    const queryParams = { ...config };
    delete queryParams.listViewId;

    const paramMatch = sinon.match({
        path: `${URL_BASE}/list-ui/${listViewId}`,
        queryParams,
    });
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function mockNetworkListRecords(config, mockData) {
    const listViewId = config.listViewId;
    const queryParams = { ...config };
    delete queryParams.listViewId;

    const paramMatch = sinon.match({
        path: `${URL_BASE}/list-records/${listViewId}`,
        queryParams,
    });
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function mockNetworkByApiNames(config, mockData) {
    const objectApiName = config.objectApiName;
    const listViewApiName = config.listViewApiName;
    const queryParams = { ...config };
    delete queryParams.objectApiName;
    delete queryParams.listViewApiName;

    const paramMatch = sinon.match({
        path: `${URL_BASE}/list-ui/${objectApiName}/${listViewApiName}`,
        queryParams,
    });
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

beforeEach(() => {
    util_beforeEach();
});

describe('with listViewId', () => {
    it('returns metadata and records when only listViewId is provided', async () => {
        const mockData = getMock('list-ui-All-Opportunities');
        const config = {
            listViewId: mockData.info.listReference.id,
        };
        mockNetworkListUi(config, mockData);

        const element = await setupElement(config, ListViewId);

        expect(element.getWiredData()).toEqualListUi(mockData);
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

            element.pageSize = config0_3.pageSize + config3_3.pageSize;
            await flushPromises();

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
            element.pageToken = '3';
            element.pageSize = 3;
            await flushPromises();

            // verify the adapter constructed the same response that the server would have
            expected = getMock('list-ui-All-Opportunities-pageToken-3-pageSize-3');

            wiredData = element.getWiredData();
            expect(wiredData).toEqualListUi(expected);
        });

        // FIXME: revisit after pagination is fully implemented
        xit('makes additional XHR after list-ui TTL expired', async () => {
            const mockDataPageSize1 = getMock('list-ui-All-Opportunities-pageSize-1');
            const configPageSize1 = {
                listViewId: mockDataPageSize1.info.listReference.id,
                pageSize: 1,
            };
            mockNetworkListUi(configPageSize1, mockDataPageSize1);

            const mockDataPageSize3 = getMock('list-ui-All-Opportunities-pageSize-3');
            const configPageSize3 = {
                listViewId: mockDataPageSize3.info.listReference.id,
                pageSize: 3,
            };
            mockNetworkListUi(configPageSize3, mockDataPageSize3);

            const element = await setupElement(configPageSize3, ListViewId);

            // speed up time to reach list-ui TTL and force additional server request
            expireListUi();

            element.pageSize = 1;
            await flushPromises();

            expect(karmaNetworkAdapter.secondCall.args[0].queryParams.pageSize).toBe(1);
        });

        xit('no XHR if previously requested by objectApiName and listViewApiName', async () => {
            const mockDataApiNames = getMock('list-ui-All-Opportunities-pageSize-3');
            const configApiNames = {
                objectApiName: mockDataApiNames.info.listReference.objectApiName,
                listViewApiName: mockDataApiNames.info.listReference.listViewApiName,
                pageSize: 3,
            };
            mockNetworkByApiNames(configApiNames, mockDataApiNames);

            const mockDataPageSize3 = getMock('list-ui-All-Opportunities-pageSize-3');
            const configPageSize3 = {
                listViewId: mockDataPageSize3.info.listReference.id,
                pageSize: 3,
            };
            mockNetworkListUi(configPageSize3, mockDataPageSize3);

            await setupElement(configApiNames, ObjectAndListViewApiName);

            const elementListViewId = await setupElement(configPageSize3, ListViewId);

            // FIXME: add utility to verify returned payload against mock data
            const wiredData = elementListViewId.getWiredData();
            const records = wiredData.data.records.count;
            expect(records).toBe(mockDataPageSize3.records.count);
        });

        xit('does not make second XHR for additional fields', async () => {
            const mockData = getMock('list-ui-All-Opportunities-pageSize-3');
            const config = {
                listViewId: mockData.info.listReference.id,
                pageSize: 3,
            };
            mockNetworkListUi(config, mockData);

            const element = await setupElement(config, ListViewId);

            element.fields = 'Account.Name';
            await flushPromises();

            // FIXME: goes back to server again when doesn't need to
        });

        xit('does not make second XHR for removed fields', async () => {});

        // TODO: probably bogus, but need to verify
        xit('does not make second XHR for listViewId that does not exist', async () => {});
    });

    describe('sortBy', () => {
        it('includes the sortBy parameter in XHR requests', () => {
            // exercised in "handles paginated requests that specify sortBy"
        });

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

            element.pageSize = config0_3.pageSize + config3_3.pageSize;
            await flushPromises();

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
            element.pageToken = '3';
            element.pageSize = 3;
            await flushPromises();

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

            element.sortBy = ['Account.Name'];
            await flushPromises();

            expect(element.getWiredData()).toEqualListUi(mockData);

            // sortBy same field, but descending
            mockData = getMock('list-ui-All-Opportunities-pageSize-3-sortBy--Account.Name');
            config = {
                listViewId: mockData.info.listReference.id,
                pageSize: mockData.records.pageSize,
                sortBy: mockData.records.sortBy.split(','),
            };
            mockNetworkListUi(config, mockData);

            element.sortBy = ['-Account.Name'];
            await flushPromises();

            expect(element.getWiredData()).toEqualListUi(mockData);
        });

        it('ignores all but the first sortBy field', () => {
            /*

            // sortBy additional field
            mockData = getMock('list-ui-All-Opportunities-pageSize-3-sortBy--Account.Name,Amount');
            config = {
                listViewId: mockData.info.listReference.id,
                pageSize: mockData.records.pageSize,
                sortBy = mockData.records.sortBy,
            };
            mockNetworkListUi(config, mockData);

            element.sortBy = ['-Account.Name,Amount']
            await flushPromises();

            expect(element.getWiredData()).toEqualListUi(mockData);
            */
        });
    });

    xit('returns error when listViewId does not exist', async () => {
        const listViewId = '00BRM00000ZZZZZZZZ';

        // FIXME: what does this actually return? what should we mock it to?
        const paramMatch = sinon.match({
            path: `${URL_BASE}/list-ui/${listViewId}`,
        });
        karmaNetworkAdapter.withArgs(paramMatch).resolves();

        const element = await setupElement({
            listViewId,
            pageSize: 3,
        });

        expect(element.getWiredData().error).not.toBe(null);
    });

    xit('automatically includes Id, LastModifiedBy, LastModifiedDate, xxx, and SystemModstamp fields', async () => {});
    // should these (and above) be further grouped into 'describe' blocks? "describe('returns error when', ...)"

    xit('returns error when pageSize is 0', async () => {});
    xit('returns error when pageSize is above max', async () => {});
    xit('returns error when pageToken is -1', async () => {});
    xit('returns error when pageToken is above max', async () => {});
    xit('returns error when requests non-existent fields', async () => {});
    xit('returns error when listViewId not set', async () => {});

    xit('returns metadata and data when listViewId is an empty list', async () => {});
    xit('does not make second XHR when listViewId is an empty list', async () => {});

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

    xit('makes new request when a fetched list-records has an etag that does not match the list-info', async () => {});
});
