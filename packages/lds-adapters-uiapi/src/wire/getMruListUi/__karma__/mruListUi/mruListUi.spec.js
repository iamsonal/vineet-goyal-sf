import { karmaNetworkAdapter } from 'lds-engine';
import sinon from 'sinon';
import {
    getMock as globalGetMock,
    mockNetworkOnce,
    mockNetworkSequence,
    setupElement,
    updateElement,
} from 'test-util';
import { URL_BASE, expireDefaultTTL } from 'uiapi-test-util';
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
    const { objectApiName, ...queryParams } = config;

    const paramMatch = sinon.match({
        basePath: `${URL_BASE}/mru-list-ui/${objectApiName}`,
        queryParams,
    });

    if (Array.isArray(mockData)) {
        mockNetworkSequence(karmaNetworkAdapter, paramMatch, mockData);
    } else {
        mockNetworkOnce(karmaNetworkAdapter, paramMatch, mockData);
    }
}

function mockNetworkMruListRecords(config, mockData) {
    const { objectApiName, ...queryParams } = config;

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
    describe('basic', () => {
        it('returns metadata and records when only objectApiName provided', async () => {
            const mockData = getMock('mru-list-ui-Opportunity');
            const config = { objectApiName: mockData.info.listReference.objectApiName };
            mockNetworkMruListUi(config, mockData);

            const element = await setupElement(config, MruListUi);

            const wiredData = element.getWiredData();
            expect(wiredData).toEqualListUi(mockData);
        });
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

            await updateElement(element, {
                pageSize: config0_3.pageSize + config3_3.pageSize,
            });

            // should have made the mru-list-records call and emitted 6 records
            expect(karmaNetworkAdapter.callCount).toBe(2);
            wiredData = element.getWiredData();
            expect(wiredData.data.records.records.length).toBe(
                config0_3.pageSize + config3_3.pageSize
            );

            // verify the adapter constructed the same response that the server would have
            let expected = getMock('mru-list-ui-Opportunity-pageSize-6');
            expect(wiredData).toEqualListUi(expected);

            // @wire pageToken='3', pageSize=3, should not make any requests
            await updateElement(element, {
                pageSize: 3,
                pageToken: '3',
            });

            // verify the adapter constructed the same response that the server would have
            expected = getMock('mru-list-ui-Opportunity-pageToken-3-pageSize-3');

            wiredData = element.getWiredData();
            expect(wiredData).toEqualListUi(expected);
        });

        it('makes additional XHR after list-ui TTL expired', async () => {
            const mockData = getMock('mru-list-ui-Opportunity');

            const config = { objectApiName: mockData.info.listReference.objectApiName };
            mockNetworkMruListUi(config, [mockData, mockData]);

            await setupElement(config, MruListUi);

            expireDefaultTTL();

            const element = await setupElement(config, MruListUi);
            expect(element.getWiredData()).toEqualListUi(mockData);
        });

        it('does not make second XHR for fields returned from first request', async () => {
            const mockData = getMock('mru-list-ui-Opportunity-pageSize-3');
            const config = {
                objectApiName: mockData.info.listReference.objectApiName,
                pageSize: mockData.records.pageSize,
            };
            mockNetworkMruListUi(config, mockData);

            const element = await setupElement(config, MruListUi);
            updateElement(MruListUi, { fields: 'Account.Name' });

            const wiredData = element.getWiredData();
            expect(wiredData).toEqualListUi(mockData);
        });

        it('does not make second XHR for removed fields', async () => {
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
            const fields = element.fields.slice(0, 1);
            updateElement(MruListUi, { fields });

            const wiredData = element.getWiredData();
            expect(wiredData).toEqualListUi(mockData);
        });
    });

    describe('sortBy', () => {
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

            await updateElement(element, {
                pageSize: config0_3.pageSize + config3_3.pageSize,
            });

            // should have made the mru-list-records call and emitted 6 records
            wiredData = element.getWiredData();
            expect(wiredData.data.records.records.length).toBe(
                config0_3.pageSize + config3_3.pageSize
            );

            // verify the adapter constructed the same response that the server would have
            let expected = getMock('mru-list-ui-Opportunity-pageSize-6-sortBy-Account.Name');
            expect(wiredData).toEqualListUi(expected);

            // @wire pageToken='3', pageSize=3, should not make any requests
            await updateElement(element, {
                pageSize: 3,
                pageToken: '3',
            });

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

            await updateElement(element, {
                sortBy: ['Account.Name'],
            });

            expect(element.getWiredData()).toEqualListUi(mockData);

            // sortBy same field, but descending
            mockData = getMock('mru-list-ui-Opportunity-pageSize-3-sortBy--Account.Name');
            config = {
                objectApiName: mockData.info.listReference.objectApiName,
                pageSize: mockData.records.pageSize,
                sortBy: mockData.records.sortBy.split(','),
            };
            mockNetworkMruListUi(config, mockData);

            await updateElement(element, {
                sortBy: ['-Account.Name'],
            });

            expect(element.getWiredData()).toEqualListUi(mockData);
        });
    });

    describe('errors', function () {
        it('returns error when objectApiName do not exist', async () => {
            const mockError = {
                ok: false,
                status: 403,
                statusText: 'FORBIDDEN',
                body: [
                    {
                        errorCode: 'INSUFFICIENT_ACCESS',
                        message:
                            "You don't have access to this record. Ask your administrator for help or to request access.",
                    },
                ],
            };

            const config = { objectApiName: 'invalidObjectApiName' };
            mockNetworkMruListUi(config, { reject: true, data: mockError });

            const element = await setupElement(config, MruListUi);
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

            const config = { objectApiName: 'Account', pageSize: -1 };
            mockNetworkMruListUi(config, { reject: true, data: mockError });
            const element = await setupElement(config, MruListUi);
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

            const config = { objectApiName: 'Account', pageSize: 2100 };
            mockNetworkMruListUi(config, { reject: true, data: mockError });
            const element = await setupElement(config, MruListUi);
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

            const config = { objectApiName: 'Account', pageSize: 1, pageToken: 'invalid' };
            mockNetworkMruListUi(config, { reject: true, data: mockError });
            const element = await setupElement(config, MruListUi);
            expect(element.getWiredError()).toEqualImmutable(mockError);
        });

        it('returns error when requests non-existent fields', async () => {
            const mockData = getMock(
                'mru-list-ui-Opportunity-pageSize-1-fields-IsPrivate,NextStep'
            );

            const mockError = {
                ok: false,
                status: 400,
                statusText: 'BAD_REQUEST',
                body: [
                    {
                        errorCode: 'INVALID_FIELD',
                        message: "No such column 'BadField' on entity Opportunity",
                    },
                ],
            };

            const config = {
                objectApiName: mockData.info.listReference.objectApiName,
                fields: ['BadField'],
            };
            mockNetworkMruListUi(config, { reject: true, data: mockError });
            const element = await setupElement(config, MruListUi);
            expect(element.getWiredError()).toEqualImmutable(mockError);
        });

        it('returns error when multiple sortBy values are passed', async () => {
            // even though sortBy is of type Array<string> it accept a single value
            const mockError = {
                ok: false,
                status: 400,
                statusText: 'BAD_REQUEST',
                body: [
                    {
                        errorCode: 'ILLEGAL_QUERY_PARAMETER_VALUE',
                        message: 'Can only sortBy one value',
                    },
                ],
            };
            const config = { objectApiName: 'Account', sortBy: ['Account.Name', 'Account.Rating'] };
            mockNetworkMruListUi(config, { reject: true, data: mockError });
            const element = await setupElement(config, MruListUi);
            expect(element.getWiredError()).toEqualImmutable(mockError);
        });
    });

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
        });
    });
});
