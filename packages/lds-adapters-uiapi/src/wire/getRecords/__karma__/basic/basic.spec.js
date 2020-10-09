import { getMock as globalGetMock, setupElement } from 'test-util';
import { mockGetRecordsNetwork, mockGetRecordNetwork } from 'uiapi-test-util';
import GetRecords from '../lwc/get-records';
import RecordFields from '../../../getRecord/__karma__/lwc/record-fields';
import { getIdsFromGetRecordsMock, convertRecordMocktoGetRecordsMockShape } from '../testUtil';
const MOCK_PREFIX = 'wire/getRecords/__karma__/basic/data/';

function getMock(fileName) {
    return globalGetMock(MOCK_PREFIX + fileName);
}

const ACCOUNT_ID_FIELD_STRING = 'Account.Id';
const ACCOUNT_NAME_FIELD_STRING = 'Account.Name';
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
});
