import { karmaNetworkAdapter } from 'lds-engine';
import sinon from 'sinon';
import { flushPromises, getMock as globalGetMock, mockNetworkOnce, setupElement } from 'test-util';
import { URL_BASE } from 'uiapi-test-util';
import {
    beforeEach as util_beforeEach,
    convertToFieldIds,
} from '../../../getListUi/__karma__/util';
import MruListUi from '../lwc/mruListUi';

const MOCK_PREFIX = 'wire/getMruListUi/__karma__/mruListUi/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

function mockNetworkMruListUi(config, mockData) {
    const objectApiName = config.objectApiName;
    const queryParams = { ...config };
    delete queryParams.objectApiName;

    const paramMatch = sinon.match({
        basePath: `${URL_BASE}/mru-list-ui/${objectApiName}`,
        queryParams,
    });
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

function mockNetworkMruListRecords(config, mockData) {
    const objectApiName = config.objectApiName;
    const queryParams = { ...config };
    delete queryParams.objectApiName;

    const paramMatch = sinon.match({
        basePath: `${URL_BASE}/mru-list-records/${objectApiName}`,
        queryParams,
    });
    mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
}

beforeEach(() => {
    util_beforeEach();
});

describe('getMruListUi', () => {
    it('returns metadata and records when only objectApiName provided', async () => {
        const mockData = getMock('mru-list-ui-Opportunity');
        const config = { objectApiName: mockData.info.listReference.objectApiName };
        mockNetworkMruListUi(config, mockData);

        const element = await setupElement(config, MruListUi);

        const wiredData = element.getWiredData();
        expect(wiredData).toEqualListUi(mockData);
        expect(wiredData.data).toBeImmutable();
    });

    describe('caching', () => {
        it('does not make additional XHR for same objectApiName request', async () => {
            const mockData = getMock('mru-list-ui-Opportunity');
            const config = { objectApiName: mockData.info.listReference.objectApiName };
            mockNetworkMruListUi(config, mockData);

            const element1 = await setupElement(config, MruListUi);
            const element2 = await setupElement(config, MruListUi);

            expect(element1.getWiredData().data).toEqualSnapshotWithoutEtags(
                element2.getWiredData().data
            );
        });

        it('reuses cached records when possible and uses mru-list-records to retrieve missing records', async () => {
            let wiredData;

            // @wire pageSize=3, should request mru-list-ui pageSize=3
            const mockData0_3 = getMock('mru-list-ui-Opportunity-pageSize-3');
            const config0_3 = {
                objectApiName: mockData0_3.info.listReference.objectApiName,
                pageSize: mockData0_3.records.pageSize,
            };
            mockNetworkMruListUi(config0_3, mockData0_3);

            const element = await setupElement(config0_3, MruListUi);

            // should have made the mru-list-ui call and emitted 3 records
            expect(karmaNetworkAdapter.callCount).toBe(1);
            wiredData = element.getWiredData();
            expect(wiredData.data.records.records.length).toBe(3);

            // @wire pageSize=6, should request mru-list-records pageToken=3, pageSize=3
            const mockData3_3 = getMock('mru-list-records-Opportunity-pageToken-3-pageSize-3');
            const config3_3 = {
                objectApiName: mockData3_3.listReference.objectApiName,
                pageToken: mockData0_3.records.nextPageToken,
                pageSize: mockData3_3.pageSize,
            };
            mockNetworkMruListRecords(config3_3, mockData3_3);

            element.pageSize = config0_3.pageSize + config3_3.pageSize;
            await flushPromises();

            // should have made the mru-list-records call and emitted 6 records
            expect(karmaNetworkAdapter.callCount).toBe(2);
            wiredData = element.getWiredData();
            expect(wiredData.data.records.records.length).toBe(
                config0_3.pageSize + config3_3.pageSize
            );

            // verify the adapter constructed the same response that the server would have
            let expected = getMock('mru-list-ui-Opportunity-pageSize-6');
            expect(wiredData).toEqualListUi(expected);
            expect(wiredData.data).toBeImmutable();

            // @wire pageToken='3', pageSize=3, should not make any requests
            element.pageToken = '3';
            element.pageSize = 3;
            await flushPromises();

            // verify the adapter constructed the same response that the server would have
            expected = getMock('mru-list-ui-Opportunity-pageToken-3-pageSize-3');

            wiredData = element.getWiredData();
            expect(wiredData).toEqualListUi(expected);
            expect(wiredData.data).toBeImmutable();
        });

        xit('makes additional XHR after list-ui TTL expired', async () => {});

        xit('does not make second XHR for additional fields', async () => {});
        xit('does not make second XHR for removed fields', async () => {});
    });

    describe('sortBy', () => {
        it('includes the sortBy parameter in XHR requests', () => {
            // exercised in "handles paginated requests that specify sortBy"
        });

        it('handles paginated requests that specify sortBy', async () => {
            let wiredData;

            // @wire pageSize=3,sortBy= should request list-ui pageSize=3,sortBy=
            const mockData0_3 = getMock('mru-list-ui-Opportunity-pageSize-3-sortBy-Account.Name');
            const config0_3 = {
                objectApiName: mockData0_3.info.listReference.objectApiName,
                pageSize: mockData0_3.records.pageSize,
                sortBy: mockData0_3.records.sortBy.split(','),
            };
            mockNetworkMruListUi(config0_3, mockData0_3);
            const element = await setupElement(config0_3, MruListUi);

            // should have made the mru-list-ui call and emitted 3 records
            expect(karmaNetworkAdapter.callCount).toBe(1);
            wiredData = element.getWiredData();
            expect(wiredData.data.records.records.length).toBe(3);
            expect(wiredData).toEqualListUi(mockData0_3);

            // @wire pageSize=6,sortBy= should request mru-list-records pageToken=3, pageSize=3,sortBy=
            const mockData3_3 = getMock(
                'mru-list-records-Opportunity-pageToken-3-pageSize-3-sortBy-Account.Name'
            );
            const config3_3 = {
                objectApiName: mockData3_3.listReference.objectApiName,
                pageToken: mockData0_3.records.nextPageToken,
                pageSize: mockData3_3.pageSize,
                sortBy: mockData3_3.sortBy.split(','),
            };
            mockNetworkMruListRecords(config3_3, mockData3_3);

            element.pageSize = config0_3.pageSize + config3_3.pageSize;
            await flushPromises();

            // should have made the mru-list-records call and emitted 6 records
            expect(karmaNetworkAdapter.callCount).toBe(2);
            wiredData = element.getWiredData();
            expect(wiredData.data.records.records.length).toBe(
                config0_3.pageSize + config3_3.pageSize
            );

            // verify the adapter constructed the same response that the server would have
            let expected = getMock('mru-list-ui-Opportunity-pageSize-6-sortBy-Account.Name');
            expect(wiredData).toEqualListUi(expected);

            // @wire pageToken='3', pageSize=3, should not make any requests
            element.pageToken = '3';
            element.pageSize = 3;
            await flushPromises();

            // verify the adapter constructed the same response that the server would have
            expected = getMock(
                'mru-list-ui-Opportunity-pageToken-3-pageSize-3-sortBy-Account.Name'
            );
            expect(element.getWiredData()).toEqualListUi(expected);
        });

        it('does not use cached data when sortBy differs', async () => {
            // no sortBy specified
            let mockData = getMock('mru-list-ui-Opportunity-pageSize-3');
            let config = {
                objectApiName: mockData.info.listReference.objectApiName,
                pageSize: mockData.records.pageSize,
            };
            mockNetworkMruListUi(config, mockData);

            const element = await setupElement(config, MruListUi);

            expect(element.getWiredData()).toEqualListUi(mockData);

            // add sortBy single field, ascending
            mockData = getMock('mru-list-ui-Opportunity-pageSize-3-sortBy-Account.Name');
            config = {
                objectApiName: mockData.info.listReference.objectApiName,
                pageSize: mockData.records.pageSize,
                sortBy: mockData.records.sortBy.split(','),
            };
            mockNetworkMruListUi(config, mockData);

            element.sortBy = ['Account.Name'];
            await flushPromises();

            expect(element.getWiredData()).toEqualListUi(mockData);

            // sortBy same field, but descending
            mockData = getMock('mru-list-ui-Opportunity-pageSize-3-sortBy--Account.Name');
            config = {
                objectApiName: mockData.info.listReference.objectApiName,
                pageSize: mockData.records.pageSize,
                sortBy: mockData.records.sortBy.split(','),
            };
            mockNetworkMruListUi(config, mockData);

            element.sortBy = ['-Account.Name'];
            await flushPromises();

            expect(element.getWiredData()).toEqualListUi(mockData);
        });

        xit('ignores all but the first sortBy field', () => {
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

    xit('returns error when objectApiName do not exist', async () => {});
    xit('does not make second XHR for objectApiName that does not exist', async () => {});
    xit('returns error when pageSize is 0', async () => {});
    xit('returns error when pageSize is above max', async () => {});
    xit('returns error when pageToken is -1', async () => {});
    xit('returns error when pageToken is above max', async () => {});
    xit('returns error when requests non-existent fields', async () => {});
    xit('returns error when objectApiName not set', async () => {});
    xit('returns metadata and data when objectApiName is an empty list', async () => {});

    describe('fields/optionalFields', () => {
        it('returns metadata and data for string list of fields', async () => {
            const mockData = getMock(
                'mru-list-ui-Opportunity-pageSize-1-fields-IsPrivate,NextStep'
            );
            const config = {
                objectApiName: mockData.info.listReference.objectApiName,
                pageSize: mockData.records.pageSize,
                fields: mockData.records.fields,
            };
            mockNetworkMruListUi(config, mockData);

            const element = await setupElement(config, MruListUi);

            expect(element.getWiredData()).toEqualListUi(mockData);
        });

        it('returns metadata and data for fields as schema', async () => {
            const mockData = getMock(
                'mru-list-ui-Opportunity-pageSize-1-fields-Opportunity.IsPrivate,Opportunity.NextStep'
            );
            let config = {
                objectApiName: mockData.info.listReference.objectApiName,
                pageSize: mockData.records.pageSize,
                fields: mockData.records.fields,
            };
            mockNetworkMruListUi(config, mockData);

            config = convertToFieldIds(config);
            const element = await setupElement(config, MruListUi);

            expect(element.getWiredData()).toEqualListUi(mockData);
        });

        it('returns metadata and data for string list of optionalFields', async () => {
            const mockData = getMock(
                'mru-list-ui-Opportunity-pageSize-1-optionalFields-IsPrivate,NextStep'
            );
            const config = {
                objectApiName: mockData.info.listReference.objectApiName,
                pageSize: mockData.records.pageSize,
                optionalFields: mockData.records.optionalFields,
            };
            mockNetworkMruListUi(config, mockData);

            const element = await setupElement(config, MruListUi);

            expect(element.getWiredData()).toEqualListUi(mockData);
        });

        it('returns metadata and data for optionalFields as schema', async () => {
            const mockData = getMock(
                'mru-list-ui-Opportunity-pageSize-1-optionalFields-Opportunity.IsPrivate,Opportunity.NextStep'
            );
            let config = {
                objectApiName: mockData.info.listReference.objectApiName,
                pageSize: mockData.records.pageSize,
                optionalFields: mockData.records.optionalFields,
            };
            mockNetworkMruListUi(config, mockData);

            config = convertToFieldIds(config);
            const element = await setupElement(config, MruListUi);

            expect(element.getWiredData()).toEqualListUi(mockData);
        });
    });

    xit('todo: something with multiple ascending or descending fields in same request', async () => {});
    // @wire(getListUi, { listViewId: 'foo', fields: ['-Name'] }) when already requested with 'Name'
    xit('makes new request when field param changed to descending', async () => {});
    xit('makes new request when a fetched list-records has an etag that does not match the list-info', async () => {});
    // FIXME: intentionally excluded "chunk size" related tests. Verify still correct move after wire implemented

    describe('special data', () => {
        it('handles nested entities that omit the 5 magic fields', async () => {
            const mockData = getMock('mru-list-ui-Lead-pageSize-1');
            const config = {
                objectApiName: mockData.info.listReference.objectApiName,
                pageSize: mockData.records.pageSize,
            };
            mockNetworkMruListUi(config, mockData);

            const element = await setupElement(config, MruListUi);

            const wiredData = element.getWiredData();
            expect(wiredData).toEqualListUi(mockData);
            expect(wiredData.data).toBeImmutable();
        });
    });
});
