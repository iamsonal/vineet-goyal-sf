import { getMock as globalGetMock, setupElement, clone } from 'test-util';
import { mockGetRecordsNetwork, mockGetRecordNetwork, expireRecords } from 'uiapi-test-util';
import GetRecords from '../lwc/get-records';
import RecordFields from '../../../getRecord/__karma__/lwc/record-fields';
import { getIdsFromGetRecordsMock, convertRecordMocktoGetRecordsMockShape } from '../testUtil';
const MOCK_PREFIX = 'wire/getRecords/__karma__/basic/data/';

function getMock(fileName) {
    return globalGetMock(MOCK_PREFIX + fileName);
}

const ACCOUNT_ID_FIELD_STRING = 'Account.Id';
const ACCOUNT_NAME_FIELD_STRING = 'Account.Name';
const ACCOUNT_SITE_FIELD_STRING = 'Account.Site';
const CASE_ID_FIELD_STRING = 'Case.Id';
const CASE_STATUS_FIELD_STRING = 'Case.Status';

describe('getRecords LDS adapter', () => {
    it('makes correct HTTP request and emits correct data when single record id passed', async () => {
        const mock = getMock('records-single-record-Account');
        const config = {
            records: [
                {
                    recordIds: getIdsFromGetRecordsMock(mock),
                    fields: [ACCOUNT_ID_FIELD_STRING, ACCOUNT_NAME_FIELD_STRING],
                },
            ],
        };
        mockGetRecordsNetwork(config, mock);
        const elm = await setupElement(config, GetRecords);
        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualBatchRecordSnapshot(mock);
    });
    it('makes correct HTTP request and emits correct data when multiple record ids passed', async () => {
        const mock = getMock('records-multiple-record-Account_Case');
        const accountId = getIdsFromGetRecordsMock(mock, 0);
        const caseId = getIdsFromGetRecordsMock(mock, 1);
        const config = {
            records: [
                {
                    recordIds: [accountId],
                    fields: [ACCOUNT_ID_FIELD_STRING, ACCOUNT_NAME_FIELD_STRING],
                },
                {
                    recordIds: [caseId],
                    fields: [CASE_ID_FIELD_STRING, CASE_STATUS_FIELD_STRING],
                },
            ],
        };
        mockGetRecordsNetwork(config, mock);
        const elm = await setupElement(config, GetRecords);
        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualBatchRecordSnapshot(mock);
    });
    it('hits cache and emits correct data when single record id is passed', async () => {
        const mock = getMock('records-single-record-Account');
        const config = {
            records: [
                {
                    recordIds: getIdsFromGetRecordsMock(mock),
                    fields: [ACCOUNT_ID_FIELD_STRING, ACCOUNT_NAME_FIELD_STRING],
                },
            ],
        };
        mockGetRecordsNetwork(config, mock);
        // first request
        const wire1 = await setupElement(config, GetRecords);
        expect(wire1.getWiredData()).toEqualBatchRecordSnapshot(mock);
        // second request, should hit cache and emit correct data
        const wire2 = await setupElement(config, GetRecords);
        // Verify
        expect(wire1.pushCount()).toBe(1);
        expect(wire2.pushCount()).toBe(1);
        expect(wire2.getWiredData()).toEqualBatchRecordSnapshot(mock);
    });
    it('hits cache and emits correct data when multiple record ids passed', async () => {
        const mock = getMock('records-multiple-record-Accounts');
        const config = {
            records: [
                {
                    recordIds: getIdsFromGetRecordsMock(mock),
                    fields: [ACCOUNT_ID_FIELD_STRING, ACCOUNT_NAME_FIELD_STRING],
                },
            ],
        };
        mockGetRecordsNetwork(config, mock);
        // first request
        const wire1 = await setupElement(config, GetRecords);
        expect(wire1.getWiredData()).toEqualBatchRecordSnapshot(mock);
        // second request, should hit cache and emit correct data
        const wire2 = await setupElement(config, GetRecords);
        // Verify
        expect(wire1.pushCount()).toBe(1);
        expect(wire2.pushCount()).toBe(1);
        expect(wire2.getWiredData()).toEqualBatchRecordSnapshot(mock);
    });
    it('hits cache and emits correct data for single record when record has been ingested from getRecord', async () => {
        const recordMock = getMock('record-single-record-Account');
        const recordId = recordMock.id;
        const recordConfig = {
            recordId,
            fields: [ACCOUNT_ID_FIELD_STRING, ACCOUNT_NAME_FIELD_STRING],
        };
        mockGetRecordNetwork(recordConfig, recordMock);
        const config = {
            records: [
                {
                    recordIds: [recordId],
                    fields: [ACCOUNT_ID_FIELD_STRING, ACCOUNT_NAME_FIELD_STRING],
                },
            ],
        };
        const getRecordsMock = convertRecordMocktoGetRecordsMockShape(recordMock);
        // populate record with getRecord
        const getRecordWire = await setupElement(recordConfig, RecordFields);
        // access it via getRecords
        const getRecordsWire = await setupElement(config, GetRecords);
        expect(getRecordWire.pushCount()).toBe(1);
        expect(getRecordsWire.pushCount()).toBe(1);
        expect(getRecordsWire.getWiredData()).toEqualSnapshotWithoutEtags(getRecordsMock);
    });
    it('hits cache and emits correct data for multiple records when all records have been ingested from getRecord', async () => {
        const recordMock1 = getMock('record-single-record-Account');
        const recordMock2 = getMock('record-single-record-Account2');
        const recordId1 = recordMock1.id;
        const recordId2 = recordMock2.id;
        const recordConfig1 = {
            recordId: recordId1,
            fields: [ACCOUNT_ID_FIELD_STRING, ACCOUNT_NAME_FIELD_STRING],
        };
        const recordConfig2 = {
            recordId: recordId2,
            fields: [ACCOUNT_ID_FIELD_STRING, ACCOUNT_NAME_FIELD_STRING],
        };

        mockGetRecordNetwork(recordConfig1, recordMock1);
        mockGetRecordNetwork(recordConfig2, recordMock2);

        const getRecordsMock = convertRecordMocktoGetRecordsMockShape([recordMock1, recordMock2]);
        const config = {
            records: [
                {
                    recordIds: [recordId1, recordId2],
                    fields: [ACCOUNT_ID_FIELD_STRING, ACCOUNT_NAME_FIELD_STRING],
                },
            ],
        };
        // populate record with getRecord
        const getRecordWire1 = await setupElement(recordConfig1, RecordFields);
        const getRecordWire2 = await setupElement(recordConfig2, RecordFields);

        // access it via getRecords
        const getRecordsWire = await setupElement(config, GetRecords);
        expect(getRecordWire1.pushCount()).toBe(1); // first record
        expect(getRecordWire2.pushCount()).toBe(1); // second record
        expect(getRecordsWire.pushCount()).toBe(1);
        expect(getRecordsWire.getWiredData()).toEqualSnapshotWithoutEtags(getRecordsMock);
    });
    it('getRecord cache hit when record id ingested by getRecords', async () => {
        const mock = getMock('records-multiple-record-Accounts');
        const recordId1 = getIdsFromGetRecordsMock(mock, 0);
        const recordId2 = getIdsFromGetRecordsMock(mock, 1);
        const config = {
            records: [
                {
                    recordIds: [recordId1, recordId2],
                    fields: [ACCOUNT_ID_FIELD_STRING, ACCOUNT_NAME_FIELD_STRING],
                },
            ],
        };
        mockGetRecordsNetwork(config, mock);
        const getRecordMock = mock.results[0].result;
        const recordConfig = {
            recordId: recordId1,
            fields: [ACCOUNT_ID_FIELD_STRING, ACCOUNT_NAME_FIELD_STRING],
        };
        const getRecordsWire = await setupElement(config, GetRecords);
        const getRecordWire = await setupElement(recordConfig, RecordFields);
        expect(getRecordsWire.pushCount()).toBe(1);
        expect(getRecordWire.getWiredData()).toEqualSnapshotWithoutEtags(getRecordMock);
    });
    it('should refresh data', async () => {
        const mock = getMock('records-single-record-Account');
        const refreshData = getMock('records-single-record-Account');
        const record = refreshData.results[0].result;
        refreshData.results[0].result.lastModifiedDate = new Date(
            new Date(record.lastModifiedDate).getTime() + 60 * 1000
        ).toISOString();
        refreshData.results[0].result.weakEtag = record.weakEtag + 999;

        const config = {
            records: [
                {
                    recordIds: getIdsFromGetRecordsMock(mock),
                    fields: [ACCOUNT_ID_FIELD_STRING, ACCOUNT_NAME_FIELD_STRING],
                },
            ],
        };
        mockGetRecordsNetwork(config, [mock, refreshData]);
        const el = await setupElement(config, GetRecords);
        expect(el.getWiredData()).toEqualBatchRecordSnapshot(mock);
        expect(el.pushCount()).toBe(1);
        await el.refresh();
        expect(el.pushCount()).toBe(2);
    });
    it('returns 200, even with all resources returned having 404', async () => {
        const mockData = getMock('records-multiple-404errors');
        const mockDataResult = getMock('records-multiple-404errors');
        delete mockDataResult.hasErrors;
        // cant export these due to await in refresh script
        const errorId1 = '001Z1000002GSZjIAO';
        const errorId2 = '001X1000002GSZjIAO';

        const config = {
            records: [
                {
                    recordIds: [errorId1, errorId2],
                    fields: [ACCOUNT_SITE_FIELD_STRING],
                },
            ],
        };

        mockGetRecordsNetwork(config, mockData);

        const element = await setupElement(config, GetRecords);

        const actual = element.getWiredData();
        const response = {
            results: [
                {
                    statusCode: 404,
                    result: [{ errorCode: 'NOT_FOUND', message: 'Resource not found.' }],
                },
                {
                    statusCode: 404,
                    result: [{ errorCode: 'NOT_FOUND', message: 'Resource not found.' }],
                },
            ],
        };
        expect(actual).toEqualSnapshotWithoutEtags(response);
    });
    it('returns mix of 404 and 200 in same order as input', async () => {
        const mockData = getMock('records-multiple-errors-mix');
        // hard code for now
        const errorId1 = '001Z1000002GSZjIAO';
        const errorId2 = '001X1000002GSZjIAO';
        const validId = getIdsFromGetRecordsMock(mockData).filter((val) => val !== undefined)[0];
        const config = {
            records: [
                {
                    recordIds: [errorId1, validId, errorId2],
                    fields: [ACCOUNT_SITE_FIELD_STRING],
                },
            ],
        };

        mockGetRecordsNetwork(config, mockData);

        const element = await setupElement(config, GetRecords);
        const actual = element.getWiredData();
        const errorResult = mockData.results[0].result;
        const validResult = mockData.results[1].result;
        const errorResultEnvelope = {
            statusCode: 404,
            result: errorResult,
        };
        const response = {
            results: [
                errorResultEnvelope,
                {
                    statusCode: 200,
                    result: validResult,
                },
                errorResultEnvelope,
            ],
        };
        expect(actual).toEqualSnapshotWithoutEtags(response);
    });
    it('returns mix of 404, 200, and 403 in same order as input', async () => {
        const mockData = getMock('records-multiple-errors-mix404-403');
        const updatedMockData = clone(mockData);
        updatedMockData.results[1].result.fields.Site.value = 'newValue';

        const errorId404 = '001Z1000002GSZjIAO';
        const errorId403 = '001X1000002GSZjIAO';
        const validId = getIdsFromGetRecordsMock(mockData).filter((val) => val !== undefined)[0];
        const config = {
            records: [
                {
                    recordIds: [errorId404, validId, errorId403],
                    fields: [ACCOUNT_SITE_FIELD_STRING],
                },
            ],
        };

        mockGetRecordsNetwork(config, [mockData, updatedMockData]);

        const element = await setupElement(config, GetRecords);

        const actual = element.getWiredData();

        const response = {
            results: [
                {
                    statusCode: 404,
                    result: mockData.results[0].result,
                },
                {
                    statusCode: 200,
                    result: mockData.results[1].result,
                },
                {
                    statusCode: 403,
                    result: mockData.results[2].result,
                },
            ],
        };
        expect(actual).toEqualSnapshotWithoutEtags(response);

        // have the valid response change a field value and add 2nd element, we
        // should see first element's values updated
        const element2 = await setupElement(config, GetRecords);

        const element2Data = element2.getWiredData();
        const updatedElementData = element.getWiredData();
        const updatedResponse = {
            results: [
                {
                    statusCode: 404,
                    result: updatedMockData.results[0].result,
                },
                {
                    statusCode: 200,
                    result: updatedMockData.results[1].result,
                },
                {
                    statusCode: 403,
                    result: updatedMockData.results[2].result,
                },
            ],
        };

        expect(element2Data).toEqualSnapshotWithoutEtags(updatedResponse);
        expect(updatedElementData).toEqualSnapshotWithoutEtags(updatedResponse);
    });
    it('refetches all records if two are cached and one is new ', async () => {
        const recordMock1 = getMock('record-single-record-Account');
        const recordMock2 = getMock('record-single-record-Account2');
        const recordMock3 = getMock('record-single-record-Account3');
        const combinedRecords = getMock('records-multiple-record-Accounts2');
        const recordId1 = recordMock1.id;
        const recordId2 = recordMock2.id;
        const recordId3 = recordMock3.id;
        const recordConfig1 = {
            recordId: recordId1,
            fields: [ACCOUNT_ID_FIELD_STRING, ACCOUNT_NAME_FIELD_STRING],
        };
        const recordConfig2 = {
            recordId: recordId2,
            fields: [ACCOUNT_ID_FIELD_STRING, ACCOUNT_NAME_FIELD_STRING],
        };

        mockGetRecordNetwork(recordConfig1, recordMock1);
        mockGetRecordNetwork(recordConfig2, recordMock2);

        const config = {
            records: [
                {
                    recordIds: [recordId1, recordId2, recordId3],
                    fields: [ACCOUNT_ID_FIELD_STRING, ACCOUNT_NAME_FIELD_STRING],
                },
            ],
        };
        mockGetRecordsNetwork(config, combinedRecords);
        // populate record with getRecord
        const getRecordWire1 = await setupElement(recordConfig1, RecordFields);
        const getRecordWire2 = await setupElement(recordConfig2, RecordFields);

        // access it via getRecords
        const getRecordsWire = await setupElement(config, GetRecords);
        expect(getRecordWire1.pushCount()).toBe(1); // first record
        expect(getRecordWire2.pushCount()).toBe(1); // second record
        expect(getRecordsWire.pushCount()).toBe(1);
        const getRecordsMock = convertRecordMocktoGetRecordsMockShape([
            recordMock1,
            recordMock2,
            recordMock3,
        ]);
        expect(getRecordsWire.getWiredData()).toEqualSnapshotWithoutEtags(getRecordsMock);
    });
    // 1. fetch record 1 with getRecord
    // 2. expire record 1
    // 3. fetch record 2 with getRecord
    // 4. fetch record 1 and 2 with getRecords
    // 5. should result in a networkRequest with 1 and 2
    it('should refetch record expired due to ttl ', async () => {
        const recordMock1 = getMock('record-single-record-Account');
        const recordMock2 = getMock('record-single-record-Account2');
        const combinedMock = getMock('records-multiple-record-Accounts');
        // Fetch Record 1
        const recordId1 = recordMock1.id;
        const recordId2 = recordMock2.id;

        const recordConfig1 = {
            recordId: recordId1,
            fields: [ACCOUNT_ID_FIELD_STRING, ACCOUNT_NAME_FIELD_STRING],
        };

        const recordConfig2 = {
            recordId: recordId2,
            fields: [ACCOUNT_ID_FIELD_STRING, ACCOUNT_NAME_FIELD_STRING],
        };
        mockGetRecordNetwork(recordConfig1, recordMock1);
        const elem = await setupElement(recordConfig1, RecordFields);
        // expire record 1
        expireRecords();
        // fetch record 2
        mockGetRecordNetwork(recordConfig2, recordMock2);
        const secondElm = await setupElement(recordConfig2, RecordFields);
        // get both

        const config = {
            records: [
                {
                    recordIds: [recordId1, recordId2],
                    fields: [ACCOUNT_ID_FIELD_STRING, ACCOUNT_NAME_FIELD_STRING],
                },
            ],
        };
        mockGetRecordsNetwork(config, combinedMock);
        expect(elem.pushCount()).toBe(1);
        expect(secondElm.pushCount()).toBe(1);
        const getRecordsWire = await setupElement(config, GetRecords);
        expect(getRecordsWire.pushCount()).toBe(1);
        // remove hasErrors property from comparison object
        delete combinedMock.hasErrors;
        expect(getRecordsWire.getWiredData()).toEqualSnapshotWithoutEtags(combinedMock);
    });
    it('hits cache when requesting optionalField that has been marked as missing', async () => {
        const mock = getMock('records-single-record-Account');
        const config = {
            records: [
                {
                    recordIds: getIdsFromGetRecordsMock(mock),
                    fields: [ACCOUNT_ID_FIELD_STRING, ACCOUNT_NAME_FIELD_STRING],
                    optionalFields: ['Account.BadField'],
                },
            ],
        };
        mockGetRecordsNetwork(config, mock);
        const wire1 = await setupElement(config, GetRecords);
        expect(wire1.pushCount()).toBe(1);
        expect(wire1.getWiredData()).toEqualBatchRecordSnapshot(mock);
        // second request, should hit cache and emit correct data
        const wire2 = await setupElement(config, GetRecords);
        // Verify
        expect(wire1.pushCount()).toBe(1);
        expect(wire2.pushCount()).toBe(1);
        expect(wire2.getWiredData()).toEqualBatchRecordSnapshot(mock);
    });
});
