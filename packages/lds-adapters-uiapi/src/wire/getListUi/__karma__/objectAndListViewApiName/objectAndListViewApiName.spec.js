import { karmaNetworkAdapter } from 'lds-engine';
import sinon from 'sinon';
import { flushPromises, getMock as globalGetMock, mockNetworkOnce, setupElement } from 'test-util';
import { URL_BASE } from 'uiapi-test-util';

import ObjectAndListViewApiName from '../lwc/objectAndListViewApiName';
import { beforeEach as util_beforeEach, convertToFieldIds } from '../util';

const MOCK_PREFIX = 'wire/getListUi/__karma__/objectAndListViewApiName/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

function mockNetworkListUi(config, mockData) {
    const objectApiName = config.objectApiName;
    const listViewApiName = config.listViewApiName;
    const queryParams = { ...config };
    delete queryParams.objectApiName;
    delete queryParams.listViewApiName;

    const paramMatch = sinon.match({
        basePath: `${URL_BASE}/list-ui/${objectApiName}/${listViewApiName}`,
        queryParams,
    });
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function mockNetworkListRecords(config, mockData) {
    const objectApiName = config.objectApiName;
    const listViewApiName = config.listViewApiName;
    const queryParams = { ...config };
    delete queryParams.objectApiName;
    delete queryParams.listViewApiName;

    const paramMatch = sinon.match({
        basePath: `${URL_BASE}/list-records/${objectApiName}/${listViewApiName}`,
        queryParams,
    });
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

beforeEach(() => {
    util_beforeEach();
});

describe('with objectApiName and listViewApiName', () => {
    it('returns metadata and records when objectApiName and listViewApiName provided', async () => {
        const mockData = getMock('list-ui-Account-AllAccounts');
        const config = {
            objectApiName: mockData.info.listReference.objectApiName,
            listViewApiName: mockData.info.listReference.listViewApiName,
        };
        mockNetworkListUi(config, mockData);

        const element = await setupElement(config, ObjectAndListViewApiName);

        expect(element.getWiredData()).toEqualListUi(mockData);
    });

    it('does not make additional XHR for same objectApiName and listViewApiName request', async () => {
        const mockData = getMock('list-ui-Account-AllAccounts-pageSize-3');
        const config = {
            objectApiName: mockData.info.listReference.objectApiName,
            listViewApiName: mockData.info.listReference.listViewApiName,
            pageSize: 3,
        };
        mockNetworkListUi(config, mockData);

        // each LWC component will trigger a separate wire call
        const element1 = await setupElement(config, ObjectAndListViewApiName);
        const element2 = await setupElement(config, ObjectAndListViewApiName);

        expect(element1.getWiredData().data).toEqualSnapshotWithoutEtags(
            element2.getWiredData().data
        );
    });

    it('reuses cached records when possible and uses list-records to retrieve missing records', async () => {
        let wiredData;

        // @wire pageSize=3, should request list-ui pageSize=3
        const mockData0_3 = getMock('list-ui-Account-AllAccounts-pageSize-3');
        const config0_3 = {
            objectApiName: mockData0_3.info.listReference.objectApiName,
            listViewApiName: mockData0_3.info.listReference.listViewApiName,
            pageSize: mockData0_3.records.pageSize,
        };
        mockNetworkListUi(config0_3, mockData0_3);

        const element = await setupElement(config0_3, ObjectAndListViewApiName);

        // should have made the list-ui call and emitted 3 records
        expect(karmaNetworkAdapter.callCount).toBe(1);
        wiredData = element.getWiredData();
        expect(wiredData.data.records.records.length).toBe(3);

        // @wire pageSize=6, should request list-records pageToken=3, pageSize=3
        const mockData3_3 = getMock('list-records-Account-AllAccounts-pageToken-3-pageSize-3');
        const config3_3 = {
            objectApiName: mockData3_3.listReference.objectApiName,
            listViewApiName: mockData3_3.listReference.listViewApiName,
            pageToken: mockData0_3.records.nextPageToken,
            pageSize: mockData3_3.pageSize,
        };
        mockNetworkListRecords(config3_3, mockData3_3);

        element.pageSize = config0_3.pageSize + config3_3.pageSize;
        await flushPromises();

        // should have made the list-records call and emitted 6 records
        expect(karmaNetworkAdapter.callCount).toBe(2);
        wiredData = element.getWiredData();
        expect(wiredData.data.records.records.length).toBe(config0_3.pageSize + config3_3.pageSize);

        // verify the adapter constructed the same response that the server would have
        let expected = getMock('list-ui-Account-AllAccounts-pageSize-6');
        expect(wiredData).toEqualListUi(expected);

        // @wire pageToken='3', pageSize=3, should not make any requests
        element.pageToken = '3';
        element.pageSize = 3;
        await flushPromises();

        // verify the adapter constructed the same response that the server would have
        expected = getMock('list-ui-Account-AllAccounts-pageToken-3-pageSize-3');
        expect(element.getWiredData()).toEqualListUi(expected);
    });

    /**
     * Most of these cases are also present in listViewId.spec.js and objectApiName.spec.js.
     * They're also here since these have different wire parameters, but the core logic being
     * tested may be duplicated. Use good judgement for whether the test also needs to be
     * here or not once the wire adapter implementation is ironed out.
     */
    xit('makes additional XHR after list-ui TTL expired', async () => {});
    xit('returns error when objectApiName and listViewApiName do not exist', async () => {});
    xit('no XHR if previously requested by listViewId', async () => {});
    xit('does not make second XHR for additional fields', async () => {});
    xit('does not make second XHR for removed fields', async () => {});
    xit('does not make second XHR for objectApiName and listViewApiName that do not exist', async () => {});
    xit('returns error when pageSize is 0', async () => {});
    xit('returns error when pageSize is above max', async () => {});
    xit('returns error when pageToken is -1', async () => {});
    xit('returns error when pageToken is above max', async () => {});
    xit('returns error when requests non-existent fields', async () => {});
    xit('returns error when objectApiName and listViewApiName not set', async () => {});
    xit('returns metadata and data when requesting an empty list', async () => {});

    xit('returns metadata and records with schema/listViewApiName', async () => {}); // @wire(getListUi, { listViewApiName: 'MyAccounts', objectApiName: { objectApiName: "Account" } })
    xit('returns metadata and records by MRU', async () => {});

    describe('fields/optionalFields', () => {
        it('returns metadata and data for string list of fields', async () => {
            const mockData = getMock(
                'list-ui-Account-AllAccounts-pageSize-1-fields-Rating,Website'
            );
            const config = {
                objectApiName: mockData.info.listReference.objectApiName,
                listViewApiName: mockData.info.listReference.listViewApiName,
                pageSize: mockData.records.pageSize,
                fields: mockData.records.fields,
            };
            mockNetworkListUi(config, mockData);

            const element = await setupElement(config, ObjectAndListViewApiName);

            expect(element.getWiredData()).toEqualListUi(mockData);
        });

        it('returns metadata and data for fields as schema', async () => {
            const mockData = getMock(
                'list-ui-Account-AllAccounts-pageSize-1-fields-Account.Rating,Account.Website'
            );
            let config = {
                objectApiName: mockData.info.listReference.objectApiName,
                listViewApiName: mockData.info.listReference.listViewApiName,
                pageSize: mockData.records.pageSize,
                fields: mockData.records.fields,
            };
            mockNetworkListUi(config, mockData);

            config = convertToFieldIds(config);
            const element = await setupElement(config, ObjectAndListViewApiName);

            expect(element.getWiredData()).toEqualListUi(mockData);
        });

        it('returns metadata and data for string list of optionalFields', async () => {
            const mockData = getMock(
                'list-ui-Account-AllAccounts-pageSize-1-optionalFields-Rating,Website'
            );
            const config = {
                objectApiName: mockData.info.listReference.objectApiName,
                listViewApiName: mockData.info.listReference.listViewApiName,
                pageSize: mockData.records.pageSize,
                optionalFields: mockData.records.optionalFields,
            };
            mockNetworkListUi(config, mockData);

            const element = await setupElement(config, ObjectAndListViewApiName);

            expect(element.getWiredData()).toEqualListUi(mockData);
        });

        it('returns metadata and data for optionalFields as schema', async () => {
            const mockData = getMock(
                'list-ui-Account-AllAccounts-pageSize-1-optionalFields-Account.Rating,Account.Website'
            );
            let config = {
                objectApiName: mockData.info.listReference.objectApiName,
                listViewApiName: mockData.info.listReference.listViewApiName,
                pageSize: mockData.records.pageSize,
                optionalFields: mockData.records.optionalFields,
            };
            mockNetworkListUi(config, mockData);

            config = convertToFieldIds(config);
            const element = await setupElement(config, ObjectAndListViewApiName);

            expect(element.getWiredData()).toEqualListUi(mockData);
        });
    });

    xit('todo: something with multiple ascending or descending fields in same request', async () => {});
    // @wire(getListUi, { listViewId: 'foo', fields: ['-Name'] }) when already requested with 'Name'
    xit('makes new request when field param changed to descending', async () => {});
    xit('makes new request when a fetched list-records has an etag that does not match the list-info', async () => {});
    // FIXME: intentionally excluded "chunk size" related tests. Verify still correct move after wire implemented
});
