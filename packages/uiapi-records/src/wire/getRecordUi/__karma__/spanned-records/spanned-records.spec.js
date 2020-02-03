import { getMock as globalGetMock, setupElement } from 'test-util';
import { expireRecordUi, mockGetRecordNetwork, mockGetRecordUiNetwork } from 'uiapi-test-util';

import RecordFields from '../../../getRecord/__karma__/lwc/record-fields';
import RecordUi from '../lwc/record-ui';

const MOCK_PREFIX = 'wire/getRecordUi/__karma__/spanned-records/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

function getRecordIdFromMock(mock) {
    return Object.keys(mock.records)[0];
}

describe('single recordId - spanned record', () => {
    it('get recordWithFields for record1, update record1 on server, get recordUi which will fetch record1 as spanned record', async () => {
        const mockAccountData = getMock(
            'record-Account-fields-Account.Phone,Account.Id,Account.Name'
        );
        const accountRecordId = mockAccountData.id;
        const accountConfig = {
            recordId: accountRecordId,
            fields: ['Account.Id', 'Account.Name', 'Account.Phone'],
        };
        mockGetRecordNetwork(accountConfig, mockAccountData);

        const newName = 'updated value';
        const mockRecordUiData = getMock(
            'single-record-Opportunity-layouttypes-Full-modes-View-optionalFields-IsDeleted'
        );
        const recordId = getRecordIdFromMock(mockRecordUiData);
        // Update Account.Name fields
        mockRecordUiData.records[recordId].fields.Account.value.fields.Name = {
            displayValue: null,
            value: newName,
        };

        const recordUiConfig = {
            recordIds: recordId,
            layoutTypes: ['Full'],
            modes: ['View'],
        };
        mockGetRecordUiNetwork(recordUiConfig, mockRecordUiData);

        const expectedAccountData = getMock(
            'record-Account-fields-Account.Phone,Account.Id,Account.Name'
        );
        expectedAccountData.fields.Name.value = newName;

        const wireA = await setupElement(accountConfig, RecordFields);
        const wireB = await setupElement(recordUiConfig, RecordUi);

        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(expectedAccountData);
        expect(wireA.pushCount()).toBe(2);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(mockRecordUiData);
    });

    it('get recordUi with spanned record, update spanned record on server, get recordUi again', async () => {
        const newName = 'updated value';
        const mockRecordUiData = getMock(
            'single-record-Opportunity-layouttypes-Full-modes-View-optionalFields-IsDeleted'
        );
        const recordId = getRecordIdFromMock(mockRecordUiData);

        const updatedMockRecordUiData = getMock(
            'single-record-Opportunity-layouttypes-Full-modes-View-optionalFields-IsDeleted'
        );
        // Update Account.Name fields
        updatedMockRecordUiData.records[recordId].fields.Account.value.fields.Name = {
            displayValue: null,
            value: newName,
        };

        const recordUiConfig = {
            recordIds: recordId,
            layoutTypes: ['Full'],
            modes: ['View'],
        };
        mockGetRecordUiNetwork(recordUiConfig, [mockRecordUiData, updatedMockRecordUiData]);

        const wireA = await setupElement(recordUiConfig, RecordUi);
        expireRecordUi();
        await setupElement(recordUiConfig, RecordUi);

        expect(wireA.pushCount()).toBe(2);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(updatedMockRecordUiData);
    });

    it('merges record fields in record cache', async () => {
        // Account is a spanned record. It contains Account.Id field
        const mockOpportunityRecordUiData = getMock(
            'single-record-Opportunity-layouttypes-Full-modes-View-optionalFields-IsDeleted-OrderNumber__c'
        );
        const configOpportunity = {
            recordIds: getRecordIdFromMock(mockOpportunityRecordUiData),
            layoutTypes: ['Full'],
            modes: ['View'],
        };
        mockGetRecordUiNetwork(configOpportunity, mockOpportunityRecordUiData);

        // Account doesn't contain Account.Id field
        const mockAccountRecordUiData = getMock(
            'single-record-Account-layouttypes-Full-modes-View'
        );
        const accountRecordId = getRecordIdFromMock(mockAccountRecordUiData);
        const configAccount = {
            recordIds: accountRecordId,
            layoutTypes: ['Full'],
            modes: ['View'],
        };
        mockGetRecordUiNetwork(configAccount, mockAccountRecordUiData);

        const mockAccoutnRecordData = getMock(
            'record-Account-fields-Account.Phone,Account.Id,Account.Name'
        );
        const configAccountRecord = {
            recordId: accountRecordId,
            fields: ['Account.Id', 'Account.Name', 'Account.Phone'],
        };

        await setupElement(configOpportunity, RecordUi);
        await setupElement(configAccount, RecordUi);
        // The fields should already exist in record cache, so the data should be from cache.
        const wireC = await setupElement(configAccountRecord, RecordFields);

        expect(wireC.getWiredData()).toEqualSnapshotWithoutEtags(mockAccoutnRecordData);
    });
});
