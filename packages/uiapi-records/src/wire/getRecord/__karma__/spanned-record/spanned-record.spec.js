import { getMock as globalGetMock, setupElement } from 'test-util';
import { expireRecords, mockGetRecordNetwork } from 'uiapi-test-util';

import RecordFields from '../lwc/record-fields';

const MOCK_PREFIX = 'wire/getRecord/__karma__/spanned-record/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('spanned records - cache', () => {
    it('caches spanned record', async () => {
        const opportunityMock = getMock(
            'record-Opportunity-fields-Opportunity.Id,Opportunity.Name,Opportunity.Account.Id,Opportunity.Account.Name,Opportunity.Account.Owner.Id,Account.Owner.City'
        );
        const opportunityConfig = {
            recordId: opportunityMock.id,
            fields: [
                'Opportunity.Account.Id',
                'Opportunity.Account.Name',
                'Opportunity.Account.Owner.City',
                'Opportunity.Account.Owner.Id',
                'Opportunity.Id',
                'Opportunity.Name',
            ],
        };
        mockGetRecordNetwork(opportunityConfig, opportunityMock);

        // populate cache
        const wireA = await setupElement(opportunityConfig, RecordFields);
        delete opportunityMock.fields.AccountId;
        delete opportunityMock.fields.Account.value.fields.OwnerId;
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(opportunityMock);

        const accountMock = getMock(
            'record-Account-fields-Account.Id,Account.Name,Account.Owner.Id,Account.Owner.City'
        );
        const accountConfig = {
            recordId: accountMock.id,
            fields: ['Account.Id', 'Account.Name', 'Account.Owner.City', 'Account.Owner.Id'],
        };
        // the data should be emitted from cache
        const wireB = await setupElement(accountConfig, RecordFields);

        delete accountMock.fields.OwnerId;
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(accountMock);
    });

    it('caches nested spanned record', async () => {
        const opportunityMock = getMock(
            'record-Opportunity-fields-Opportunity.Id,Opportunity.Name,Opportunity.Account.Id,Opportunity.Account.Name,Opportunity.Account.Owner.Id,Account.Owner.City'
        );
        const opportunityConfig = {
            recordId: opportunityMock.id,
            fields: [
                'Opportunity.Account.Id',
                'Opportunity.Account.Name',
                'Opportunity.Account.Owner.City',
                'Opportunity.Account.Owner.Id',
                'Opportunity.Id',
                'Opportunity.Name',
            ],
        };
        mockGetRecordNetwork(opportunityConfig, opportunityMock);

        // populate cache
        await setupElement(opportunityConfig, RecordFields);

        const userMock = getMock('record-User-fields-User.Id,User.City');
        const userConfig = {
            recordId: userMock.id,
            fields: ['User.Id', 'User.City'],
        };
        // the data should be emitted from cache
        const wireB = await setupElement(userConfig, RecordFields);

        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(userMock);
    });

    it('caches multiple spanned records', async () => {
        const opportunityMock = getMock(
            'record-Opportunity-fields-Opportunity.Id,Opportunity.Name,Opportunity.Account.Id,Opportunity.Account.Name,Opportunity.Owner.Id,Opportunity.Owner.City'
        );
        const opportunityConfig = {
            recordId: opportunityMock.id,
            fields: [
                'Opportunity.Account.Id',
                'Opportunity.Account.Name',
                'Opportunity.Id',
                'Opportunity.Name',
                'Opportunity.Owner.City',
                'Opportunity.Owner.Id',
            ],
        };
        mockGetRecordNetwork(opportunityConfig, opportunityMock);

        // populate cache
        await setupElement(opportunityConfig, RecordFields);

        const userMock = getMock('record-User-fields-User.Id,User.City');
        const userConfig = {
            recordId: userMock.id,
            fields: ['User.Id', 'User.City'],
        };
        // the data should be emitted from cache
        const wireA = await setupElement(userConfig, RecordFields);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(userMock);

        const accountMock = getMock('record-Account-fields-Account.Id,Account.Name');
        const accountConfig = {
            recordId: accountMock.id,
            fields: ['Account.Id', 'Account.Name'],
        };
        // the data should be emitted from cache
        const wireB = await setupElement(accountConfig, RecordFields);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(accountMock);
    });
});

describe('spanned records - emit data', () => {
    it('emits data to spanned record wire when fields have value update', async () => {
        const opportunityMock = getMock(
            'record-Opportunity-fields-Opportunity.Id,Opportunity.Name,Opportunity.Account.Id,Opportunity.Account.Name,Opportunity.Account.Owner.Id,Account.Owner.City'
        );
        // update the Account name in the opportunity
        opportunityMock.fields.Account.value.fields.Name.value = 'updated';
        const opportunityConfig = {
            recordId: opportunityMock.id,
            fields: [
                'Opportunity.Account.Id',
                'Opportunity.Account.Name',
                'Opportunity.Account.Owner.City',
                'Opportunity.Account.Owner.Id',
                'Opportunity.Id',
                'Opportunity.Name',
            ],
        };
        mockGetRecordNetwork(opportunityConfig, opportunityMock);

        const accountMock = getMock(
            'record-Account-fields-Account.Id,Account.Name,Account.Owner.Id,Account.Owner.City'
        );
        const accountConfig = {
            recordId: accountMock.id,
            fields: ['Account.Id', 'Account.Name', 'Account.Owner.City', 'Account.Owner.Id'],
        };
        mockGetRecordNetwork(accountConfig, accountMock);

        const wireA = await setupElement(accountConfig, RecordFields);

        delete accountMock.fields.OwnerId;
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(accountMock);

        // Fast forward time to expire Account records
        expireRecords();

        const wireB = await setupElement(opportunityConfig, RecordFields);

        // wire a should have received new data
        expect(wireA.pushCount()).toBe(2);
        expect(wireA.getWiredData().fields.Name.value).toBe('updated');

        delete opportunityMock.fields.AccountId;
        delete opportunityMock.fields.Account.value.fields.OwnerId;
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(opportunityMock);
    });

    it('verifies notification to record when it retrieves as spanned to other record after TTL and values are changed', async () => {
        const mockData = getMock(
            'record-Opportunity-fields-Opportunity.Id,Opportunity.Name,Opportunity.Account.Id,Opportunity.Account.Name,Opportunity.Account.Owner.Id,Account.Owner.City'
        );
        const modifiedData = getMock(
            'record-Opportunity-fields-Opportunity.Id,Opportunity.Name,Opportunity.Account.Id,Opportunity.Account.Name,Opportunity.Account.Owner.Id,Account.Owner.City'
        );
        modifiedData.systemModstamp = '' + new Date();
        modifiedData.fields.Account.value.fields.Name.value = 'Changed';
        const config = {
            recordId: mockData.id,
            fields: [
                'Opportunity.Account.Id',
                'Opportunity.Account.Name',
                'Opportunity.Account.Owner.City',
                'Opportunity.Account.Owner.Id',
                'Opportunity.Id',
                'Opportunity.Name',
            ],
        };
        mockGetRecordNetwork(config, [mockData, modifiedData]);

        const wireA = await setupElement(config, RecordFields);

        delete mockData.fields.AccountId;
        delete mockData.fields.Account.value.fields.OwnerId;
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mockData);

        // Fast forward time to expire records
        expireRecords();

        const wireB = await setupElement(config, RecordFields);

        delete modifiedData.fields.AccountId;
        delete modifiedData.fields.Account.value.fields.OwnerId;
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(modifiedData);

        // It should have pushed a new value to wire a
        expect(wireA.pushCount()).toBe(2);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(modifiedData);
    });

    it('verifies emit to parent record occurs if its spanning field gets changed as a result of another parent record get call with that same spanning field', async () => {
        const opportunityMock = getMock(
            'record-Opportunity-fields-Opportunity.Id,Opportunity.Name,Opportunity.Owner.Id,Opportunity.Owner.City'
        );
        const opportunityConfig = {
            recordId: opportunityMock.id,
            fields: [
                'Opportunity.Id',
                'Opportunity.Name',
                'Opportunity.Owner.City',
                'Opportunity.Owner.Id',
            ],
        };
        mockGetRecordNetwork(opportunityConfig, opportunityMock);

        const newOwnerCity = 'Burbank';
        const updatedAccountMock = getMock(
            'record-Account-fields-Account.Id,Account.Name,Account.Owner.Id,Account.Owner.City'
        );
        updatedAccountMock.fields.Owner.value.fields.City.value = newOwnerCity;
        const accountConfig = {
            recordId: updatedAccountMock.id,
            fields: ['Account.Id', 'Account.Name', 'Account.Owner.City', 'Account.Owner.Id'],
        };
        mockGetRecordNetwork(accountConfig, updatedAccountMock);

        // populate cache with Opportunity and Owner
        const wireA = await setupElement(opportunityConfig, RecordFields);
        // updated Owner data should be fetched with Account data from network
        await setupElement(accountConfig, RecordFields);

        // Wire A should have received 2 values
        expect(wireA.pushCount()).toBe(2);

        const updatedOpportunityMock = getMock(
            'record-Opportunity-fields-Opportunity.Id,Opportunity.Name,Opportunity.Owner.Id,Opportunity.Owner.City'
        );
        // API will include OwnerId, but we didn't ask for it, so it should not be on the response
        delete updatedOpportunityMock.fields.OwnerId;
        updatedOpportunityMock.fields.Owner.value.fields.City.value = newOwnerCity;

        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(updatedOpportunityMock);
    });
});

describe('spanned records - fields', () => {
    it('should not issue request for inaccessible nested field after top-level record optionalField was not included in payload', async () => {
        const mock = getMock('record-Case-fields-Contact');
        const config = {
            recordId: mock.id,
            optionalFields: ['Case.Contact.Foo'],
        };

        mockGetRecordNetwork(config, mock);
        const wireA = await setupElement(config, RecordFields);

        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        const wireB = await setupElement(config, RecordFields);

        expect(wireB.pushCount()).toBe(1);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });

    it('should not issue request for inaccessible nested field after sibling field was included in payload', async () => {
        const mock = getMock('record-Opportunity-fields-Opportunity.Account.Name');
        const config = {
            recordId: mock.id,
            optionalFields: ['Opportunity.Account.Foo', 'Opportunity.Account.Name'],
        };

        mockGetRecordNetwork(config, mock);
        const wireA = await setupElement(config, RecordFields);

        expect(wireA.pushCount()).toBe(1);

        const expected = getMock('record-Opportunity-fields-Opportunity.Account.Name');
        delete expected.fields.AccountId;
        delete expected.fields.Account.value.fields.Id;

        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(expected);

        const wireB = await setupElement(config, RecordFields);

        expect(wireB.pushCount()).toBe(1);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(expected);
    });

    it('should not issue request for inaccessible nested record after sibling nested record was included in payload', async () => {
        const mock = getMock('record-Opportunity-fields-Opportunity.Account.Name');
        const config = {
            recordId: mock.id,
            optionalFields: ['Opportunity.Account.Name', 'Opportunity.Foo.Bar'],
        };

        mockGetRecordNetwork(config, mock);
        const wireA = await setupElement(config, RecordFields);

        expect(wireA.pushCount()).toBe(1);

        const expected = getMock('record-Opportunity-fields-Opportunity.Account.Name');

        // The component never requested these fields
        delete expected.fields.AccountId;
        delete expected.fields.Account.value.fields.Id;
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(expected);

        const wireB = await setupElement(config, RecordFields);

        expect(wireB.pushCount()).toBe(1);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(expected);
    });

    it('should handle spanned record case with circular relationship', async () => {
        const mock = getMock('record-User-fields-User.CreatedBy');
        const config = {
            recordId: mock.id,
            fields: ['User.CreatedBy.Id', 'User.CreatedById', 'User.Id'],
        };

        mockGetRecordNetwork(config, mock);

        const wireA = await setupElement(config, RecordFields);
        expect(wireA.pushCount()).toBe(1);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });
});
