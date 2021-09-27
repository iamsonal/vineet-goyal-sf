import { karmaNetworkAdapter } from 'lds-engine';
import sinon from 'sinon';
import {
    flushPromises,
    getMock as globalGetMock,
    mockNetworkOnce,
    mockNetworkSequence,
    setupElement,
    updateElement,
} from 'test-util';
import { URL_BASE, expireDefaultTTL } from 'uiapi-test-util';

import ListViewId from '../lwc/listViewId';
import ObjectAndListViewApiName from '../lwc/objectAndListViewApiName';
import { beforeEach as util_beforeEach, convertToFieldIds } from '../util';

const MOCK_PREFIX = 'wire/getListUi/__karma__/objectAndListViewApiName/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

function mockNetworkByListViewId(config, mockData) {
    const { listViewId, ...queryParams } = config;
    delete queryParams.listViewId;

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

    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
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

describe('basic', () => {
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
});

describe('caching', () => {
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

    it('does not make second XHR for removed fields', async () => {
        const mockData = getMock('list-ui-Account-AllAccounts-pageSize-1-fields-Rating,Website');
        const config = {
            objectApiName: mockData.info.listReference.objectApiName,
            listViewApiName: mockData.info.listReference.listViewApiName,
            pageSize: mockData.records.pageSize,
            fields: mockData.records.fields,
        };
        mockNetworkListUi(config, mockData);

        const element = await setupElement(config, ObjectAndListViewApiName);
        const fields = element.fields.slice(0, 1);
        updateElement(element, { fields });

        expect(element.getWiredData()).toEqualListUi(mockData);
    });

    it('no XHR if previously requested by listViewId', async () => {
        const mockData = getMock('list-ui-Account-AllAccounts-pageSize-3');

        const configListViewId = {
            listViewId: mockData.info.listReference.id,
            pageSize: mockData.records.pageSize,
        };
        mockNetworkByListViewId(configListViewId, mockData);

        const configApiName = {
            objectApiName: mockData.info.listReference.objectApiName,
            listViewApiName: mockData.info.listReference.listViewApiName,
            pageSize: mockData.records.pageSize,
        };

        const elementListViewId = await setupElement(configListViewId, ListViewId);
        expect(elementListViewId.getWiredData()).toEqualListUi(mockData);

        const elementApiName = await setupElement(configApiName, ObjectAndListViewApiName);
        expect(elementApiName.getWiredData()).toEqualListUi(mockData);
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

    it('makes additional XHR after list-ui TTL expired', async () => {
        const mockData = getMock('list-ui-Account-AllAccounts');
        const config = {
            objectApiName: mockData.info.listReference.objectApiName,
            listViewApiName: mockData.info.listReference.listViewApiName,
        };

        mockNetworkListUi(config, [mockData, mockData]);
        await setupElement(config, ObjectAndListViewApiName);
        // speed up time to reach list-ui TTL(default TTL) and force additional server request
        expireDefaultTTL();

        const element = await setupElement(config, ObjectAndListViewApiName);
        expect(element.getWiredData()).toEqualListUi(mockData);
    });

    it('does not make second XHR for fields returned from first request', async () => {
        const mockData = getMock('list-ui-Account-AllAccounts-pageSize-3');
        const config = {
            objectApiName: mockData.info.listReference.objectApiName,
            listViewApiName: mockData.info.listReference.listViewApiName,
            pageSize: mockData.records.pageSize,
        };
        mockNetworkListUi(config, mockData);

        const element = await setupElement(config, ObjectAndListViewApiName);
        updateElement(element, { fields: 'Account.Name' });
        expect(element.getWiredData()).toEqualListUi(mockData);
    });
});

describe('fields/optionalFields', () => {
    it('returns metadata and data for string list of fields', async () => {
        const mockData = getMock('list-ui-Account-AllAccounts-pageSize-1-fields-Rating,Website');
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
