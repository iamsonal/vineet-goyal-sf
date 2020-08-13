import { getMock as globalGetMock, setupElement } from 'test-util';
import { mockGetRecordsNetwork } from 'uiapi-test-util';
import GetRecords from '../lwc/get-records';
import { getIdsFromGetRecordsMock } from '../testUtil';
const MOCK_PREFIX = 'wire/getRecords/__karma__/config/data/';

function getMock(fileName) {
    return globalGetMock(MOCK_PREFIX + fileName);
}

function createSalesforceFieldObject(objectApiName, fieldApiName) {
    return {
        objectApiName,
        fieldApiName,
    };
}
const ACCOUNT_NAME_FIELD_OBJECT = createSalesforceFieldObject('Account', 'Name');
const ACCOUNT_ID_FIELD_OBJECT = createSalesforceFieldObject('Account', 'Id');
const ACCOUNT_ID_FIELD_STRING = 'Account.Id';
const ACCOUNT_NAME_FIELD_STRING = 'Account.Name';
// TODO skip until getRecords adapter is implemented
xdescribe('getRecords config test', () => {
    it('valid config when all record ids are 15 characters', async () => {
        const mock = getMock('records-multiple-record-Accounts');
        const recordId1 = getIdsFromGetRecordsMock(mock, 0).slice(0, 15);
        const recordId2 = getIdsFromGetRecordsMock(mock, 1).slice(0, 15);
        const config = {
            records: [
                {
                    recordId: [recordId1, recordId2],
                    fields: [ACCOUNT_ID_FIELD_STRING, ACCOUNT_NAME_FIELD_STRING],
                },
            ],
        };
        mockGetRecordsNetwork(config, mock);
        const elm = await setupElement(config, GetRecords);
        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });
    it('valid config when all record ids are 18 characters', async () => {
        const mock = getMock('records-multiple-record-Accounts');
        const config = {
            records: [
                {
                    recordId: getIdsFromGetRecordsMock(mock),
                    fields: [ACCOUNT_ID_FIELD_STRING, ACCOUNT_NAME_FIELD_STRING],
                },
            ],
        };
        mockGetRecordsNetwork(config, mock);
        const elm = await setupElement(config, GetRecords);
        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });
    it('valid config when some record ids are 18 character, some record ids are 15 character', async () => {
        const mock = getMock('records-multiple-record-Accounts');
        const recordId1 = getIdsFromGetRecordsMock(mock, 0);
        const recordId2 = getIdsFromGetRecordsMock(mock, 1).slice(0, 15);
        const config = {
            records: [
                {
                    recordId: [recordId1, recordId2],
                    fields: [ACCOUNT_ID_FIELD_STRING, ACCOUNT_NAME_FIELD_STRING],
                },
            ],
        };
        mockGetRecordsNetwork(config, mock);
        const elm = await setupElement(config, GetRecords);
        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });
    it('valid config when all fields and optional fields are strings', async () => {
        const mock = getMock('records-multiple-record-Accounts');
        const config = {
            records: [
                {
                    recordId: getIdsFromGetRecordsMock(mock),
                    fields: [ACCOUNT_ID_FIELD_STRING],
                    optionalFields: [ACCOUNT_NAME_FIELD_STRING],
                },
            ],
        };
        mockGetRecordsNetwork(config, mock);
        const elm = await setupElement(config, GetRecords);
        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });
    it('valid config when all fields and optional fields are Salesforce Objects', async () => {
        const mock = getMock('records-multiple-record-Accounts');
        const config = {
            records: [
                {
                    recordId: getIdsFromGetRecordsMock(mock),
                    fields: [ACCOUNT_ID_FIELD_OBJECT, ACCOUNT_NAME_FIELD_OBJECT],
                },
            ],
        };
        const configForNetwork = {
            records: [
                {
                    recordId: getIdsFromGetRecordsMock(mock),
                    fields: [ACCOUNT_ID_FIELD_STRING, ACCOUNT_NAME_FIELD_STRING],
                },
            ],
        };
        mockGetRecordsNetwork(configForNetwork, mock);
        const elm = await setupElement(config, GetRecords);
        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });
    it('valid config when some fields and optional fields are strings and some are Salesforce Objects', async () => {
        const mock = getMock('records-multiple-record-Accounts');
        const config = {
            records: [
                {
                    recordId: getIdsFromGetRecordsMock(mock),
                    fields: [ACCOUNT_ID_FIELD_STRING, ACCOUNT_NAME_FIELD_OBJECT],
                },
            ],
        };
        const configForNetwork = {
            records: [
                {
                    recordId: getIdsFromGetRecordsMock(mock),
                    fields: [ACCOUNT_ID_FIELD_STRING, ACCOUNT_NAME_FIELD_STRING],
                },
            ],
        };
        mockGetRecordsNetwork(configForNetwork, mock);
        const elm = await setupElement(config, GetRecords);
        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });
    it('valid config when single record config does not contain fields', async () => {
        const mock = getMock('records-single-record-Account');
        const config = {
            records: [
                {
                    recordId: getIdsFromGetRecordsMock(mock),
                    optionalFields: [ACCOUNT_ID_FIELD_STRING, ACCOUNT_NAME_FIELD_STRING],
                },
            ],
        };
        mockGetRecordsNetwork(config, mock);
        const elm = await setupElement(config, GetRecords);
        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });
    it('valid config when single record config does not contain optionalFields', async () => {
        const mock = getMock('records-single-record-Account');
        const config = {
            records: [
                {
                    recordId: getIdsFromGetRecordsMock(mock),
                    fields: [ACCOUNT_ID_FIELD_STRING, ACCOUNT_NAME_FIELD_STRING],
                },
            ],
        };
        mockGetRecordsNetwork(config, mock);
        const elm = await setupElement(config, GetRecords);
        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });
    it('valid config when multiple record config does not contain fields', async () => {
        const mock = getMock('records-multiple-record-Accounts');
        const config = {
            records: [
                {
                    recordId: getIdsFromGetRecordsMock(mock),
                    optionalFields: [ACCOUNT_ID_FIELD_STRING, ACCOUNT_NAME_FIELD_STRING],
                },
            ],
        };
        mockGetRecordsNetwork(config, mock);
        const elm = await setupElement(config, GetRecords);
        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });
    it('valid config when multiple record config does not contain optionalFields', async () => {
        const mock = getMock('records-multiple-record-Accounts');
        const config = {
            records: [
                {
                    recordId: getIdsFromGetRecordsMock(mock),
                    fields: [ACCOUNT_ID_FIELD_STRING, ACCOUNT_NAME_FIELD_STRING],
                },
            ],
        };
        mockGetRecordsNetwork(config, mock);
        const elm = await setupElement(config, GetRecords);
        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });
    it('invalid config when single record config does not contain recordIds', async () => {
        const config = {
            records: [
                {
                    recordId: [],
                    fields: [ACCOUNT_ID_FIELD_STRING, ACCOUNT_NAME_FIELD_STRING],
                },
            ],
        };

        const elm = await setupElement(config, GetRecords);
        expect(elm.pushCount()).toBe(0);
    });
    it('invalid config when neither fields or optional fields are present', async () => {
        const mock = getMock('records-single-record-Account');
        const config = {
            records: [
                {
                    recordId: getIdsFromGetRecordsMock(mock),
                },
            ],
        };
        const elm = await setupElement(config, GetRecords);
        expect(elm.pushCount()).toBe(0);
    });
});
