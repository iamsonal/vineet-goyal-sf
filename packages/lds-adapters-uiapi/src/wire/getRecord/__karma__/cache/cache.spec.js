import {
    getMock as globalGetMock,
    setupElement,
    FETCH_RESPONSE_OK,
    flushPromises,
} from 'test-util';
import { expireRecords, mockGetRecordNetwork, URL_BASE } from 'uiapi-test-util';
import { karmaNetworkAdapter } from 'lds-engine';
import sinon from 'sinon';

import RecordFields from '../lwc/record-fields';

const MOCK_PREFIX = 'wire/getRecord/__karma__/cache/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

function getNetworkParams(config) {
    const recordId = config.recordId;
    const queryParams = { ...config };
    delete queryParams.recordId;

    return sinon.match({
        basePath: `${URL_BASE}/records/${recordId}`,
        queryParams,
    });
}

function mockNetworkOnceDefer(config, response) {
    let promiseResolve;
    karmaNetworkAdapter
        .withArgs(getNetworkParams(config))
        .onFirstCall()
        .callsFake(function() {
            return new Promise(res => {
                promiseResolve = res;
            });
        })
        .onSecondCall()
        .throws('Network adapter stub called more than once');

    return async () => {
        if (typeof promiseResolve !== 'function') {
            throw new Error(
                `Attempting to resolve server response before network request has been issued. config: ${JSON.stringify(
                    config
                )}`
            );
        }
        promiseResolve({
            ...FETCH_RESPONSE_OK,
            body: JSON.parse(JSON.stringify(response)),
        });
        await flushPromises();
    };
}

describe('cache', () => {
    it('gets record with required fields cache hit', async () => {
        const mockData = getMock('record-Opportunity-fields-Opportunity.Name');
        const config = {
            recordId: mockData.id,
            fields: ['Opportunity.Name'],
        };
        mockGetRecordNetwork(config, mockData);

        await setupElement(config, RecordFields);
        const wireB = await setupElement(config, RecordFields);

        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
    });

    it('gets record with required fields on stale record', async () => {
        const mockData = getMock(
            'record-Opportunity-fields-Opportunity.Name,Opportunity.SystemModStamp'
        );
        const config = {
            recordId: mockData.id,
            fields: ['Opportunity.Name', 'Opportunity.SystemModstamp'],
        };
        const modifiedData = getMock(
            'record-Opportunity-fields-Opportunity.Name,Opportunity.SystemModStamp'
        );
        modifiedData.systemModstamp = '' + new Date();
        mockGetRecordNetwork(config, [mockData, modifiedData]);

        const wireA = await setupElement(config, RecordFields);

        // Fast forward time to expire records, this forces a 2nd server request
        expireRecords();

        const wireB = await setupElement(config, RecordFields);

        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(modifiedData);
        // It should have pushed the new, modified, data to the first wire
        expect(wireA.pushCount()).toBe(2);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(modifiedData);
    });

    it('emits when a field value in the filtered fields list changes', async () => {
        const opportunityNameMock = getMock('record-Opportunity-fields-Opportunity.Name');
        const updatedNameMock = getMock('record-Opportunity-fields-Opportunity.Name');
        updatedNameMock.fields.Name.value = 'Updated';
        const config = {
            recordId: opportunityNameMock.id,
            fields: ['Opportunity.Name'],
        };
        mockGetRecordNetwork(config, [opportunityNameMock, updatedNameMock]);

        const opportunityOwnerIdMock = getMock('record-Opportunity-fields-Opportunity.OwnerId');
        const updatedOwnerIdMock = getMock('record-Opportunity-fields-Opportunity.OwnerId');
        updatedOwnerIdMock.fields.OwnerId.value = 'New Ownership';
        const ownerIdConfig = {
            recordId: opportunityOwnerIdMock.id,
            fields: ['Opportunity.OwnerId'],
        };
        mockGetRecordNetwork(ownerIdConfig, [opportunityOwnerIdMock, updatedOwnerIdMock]);

        const wireA = await setupElement(config, RecordFields);
        expect(wireA.pushCount()).toBe(1);

        const wireB = await setupElement(ownerIdConfig, RecordFields);
        // WireA should not have received any new data
        expect(wireA.pushCount()).toBe(1);
        // WireB should have received new data
        expect(wireB.pushCount()).toBe(1);

        // Fast forward time to expire records
        expireRecords();

        await setupElement(config, RecordFields);

        // WireA should have received new data
        expect(wireA.pushCount()).toBe(2);

        // WireB should not have received new data (sysModStamp changed)
        expect(wireB.pushCount()).toBe(1);

        // Fast forward time to expire records
        expireRecords();

        await setupElement(ownerIdConfig, RecordFields);

        // Wire B should have received any new data
        expect(wireB.pushCount()).toBe(2);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(updatedOwnerIdMock);

        // Wire A should have received new data
        expect(wireA.pushCount()).toBe(2);
    });

    it('should not issue request for identical config with inaccessible optionalFields', async () => {
        const mock = getMock('record-Opportunity-fields-Opportunity.Name');
        const config = {
            recordId: mock.id,
            optionalFields: ['Opportunity.Foo', 'Opportunity.Name'],
        };

        mockGetRecordNetwork(config, mock);
        const elm = await setupElement(config, RecordFields);

        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        const secondElm = await setupElement(config, RecordFields);

        expect(secondElm.pushCount()).toBe(1);
        expect(secondElm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });

    it('should not issue request for a known inaccessible optionalField', async () => {
        const mockData = getMock(
            'record-Opportunity-fields-Opportunity.Name,Opportunity.SystemModStamp'
        );

        const config = {
            recordId: mockData.id,
            fields: ['Opportunity.Name', 'Opportunity.SystemModstamp'],
            optionalFields: ['Opportunity.Nonexistent'],
        };
        mockGetRecordNetwork(config, mockData);

        const wireA = await setupElement(config, RecordFields);

        // Verify wire A emitted data is correct
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mockData);

        const wireB = await setupElement(
            {
                recordId: mockData.id,
                optionalFields: ['Opportunity.Nonexistent'],
            },
            RecordFields
        );

        // Verify wire B emitted data is correct
        // We only asked for Nonexistent, so we should get an empty field bag
        const expected = {
            ...mockData,
            fields: {},
        };
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(expected);
    });

    it('should emit known fields immediately even if another getRecord XHR is in flight', async () => {
        const accountMock = getMock('record-Account-fields-Account.Id');
        const config = {
            recordId: accountMock.id,
            optionalFields: ['Account.Id'],
        };
        mockGetRecordNetwork(config, accountMock);
        const element = await setupElement(config, RecordFields);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(accountMock);

        const secondMock = getMock('record-Account-fields-Account.Id,Account.Name');
        const secondConfig = {
            recordId: secondMock.id,
            optionalFields: ['Account.Id', 'Account.Name'],
        };
        mockNetworkOnceDefer(secondConfig, accountMock);

        await setupElement(secondConfig, RecordFields);

        const thirdElement = await setupElement(config, RecordFields);
        expect(thirdElement.getWiredData()).toEqualSnapshotWithoutEtags(accountMock);
    });

    // TODO: figure out what is the desire behavior before re-activating
    xit('should not mark optionalFields as missing if root apiName does not match', async () => {
        const otherMock = getMock('record-Case-fields-Other.Account.Name');
        const otherConfig = {
            recordId: otherMock.id,
            optionalFields: ['Other.Account.Name'],
        };

        mockGetRecordNetwork(otherConfig, otherMock);
        const otherElm = await setupElement(otherConfig, RecordFields);

        // TODO - API returns a value with no fields, should we provision one?
        expect(otherElm.pushCount()).toBe(0);

        const caseMock = getMock('record-Case-fields-Other.Account.Name');
        const caseConfig = {
            recordId: caseMock.id,
            optionalFields: ['Case.Account.Name'],
        };

        mockGetRecordNetwork(caseConfig, caseMock);
        const caseElm = await setupElement(caseConfig, RecordFields);

        expect(caseElm.pushCount()).toBe(1);
        expect(caseElm.getWiredData()).toEqualSnapshotWithoutEtags(caseMock);
    });

    describe('When multiple fields at 6 levels of nested records are requested', () => {
        it('should denormalize non-spanning field at level 6', async () => {
            const testDMock = getMock(
                'record-TestD__c-fields-TestD__c.TestC__r.TestA__r.Opportunity__r.Account.Name--version-1571953531000'
            );

            const testDConfig = {
                recordId: testDMock.id,
                fields: ['TestD__c.TestC__r.TestA__r.Opportunity__r.Account.Name'],
            };

            mockGetRecordNetwork(testDConfig, testDMock);

            // This account Mock represents the same account at the same version from testCMock
            const accountMock = getMock(
                'record-Account-fields-Account.OperatingHours.CreatedBy.Name--version-1571943581000'
            );

            const accountConfig = {
                recordId: accountMock.id,
                fields: ['Account.OperatingHours.CreatedBy.Name'],
            };

            mockGetRecordNetwork(accountConfig, accountMock);

            // Ingest TestC__c.TestA__r.Opportunity__r.Account.Name
            await setupElement(testDConfig, RecordFields);

            // Ingest Account.OperatingHours.CreatedBy.Name
            await setupElement(accountConfig, RecordFields);

            const combinedConfig = {
                recordId: testDMock.id,
                fields: [
                    'TestD__c.TestC__r.TestA__r.Opportunity__r.Account.OperatingHours.CreatedBy.Name', // CreatedBy should not appear
                    'TestD__c.TestC__r.TestA__r.Opportunity__r.Account.OperatingHours.Id', // Id should appear
                ],
            };

            const elm = await setupElement(combinedConfig, RecordFields);
            expect(elm.pushCount()).toBe(1);

            const expected = getMock(
                'record-TestD__c-fields-TestD__c.TestC__r.TestA__r.Opportunity__r.Account.Name--version-1571953531000'
            );

            const expectedAccount = getMock(
                'record-Account-fields-Account.OperatingHours.CreatedBy.Name--version-1571943581000'
            );
            const expectedAccountRecordTypeInfo = JSON.parse(
                JSON.stringify(expectedAccount.recordTypeInfo)
            );

            const account =
                expected.fields.TestC__r.value.fields.TestA__r.value.fields.Opportunity__r.value
                    .fields.Account.value;

            expectedAccount.fields = {
                ...account.fields,
                ...expectedAccount.fields,
            };
            expected.fields.TestC__r.value.fields.TestA__r.value.fields.Opportunity__r.value.fields.Account.value = expectedAccount;

            delete expected.fields.TestC__c;
            delete expected.fields.TestC__r.value.fields.Id;
            delete expected.fields.TestC__r.value.fields.TestA__c;
            delete expected.fields.TestC__r.value.fields.TestA__r.value.fields.Id;
            delete expected.fields.TestC__r.value.fields.TestA__r.value.fields.Opportunity__c;
            delete expected.fields.TestC__r.value.fields.TestA__r.value.fields.Opportunity__r.value
                .fields.AccountId;
            delete expected.fields.TestC__r.value.fields.TestA__r.value.fields.Opportunity__r.value
                .fields.Id;
            delete expected.fields.TestC__r.value.fields.TestA__r.value.fields.Opportunity__r.value
                .fields.Account.value.fields.Id;
            delete expected.fields.TestC__r.value.fields.TestA__r.value.fields.Opportunity__r.value
                .fields.Account.value.fields.Name;
            delete expected.fields.TestC__r.value.fields.TestA__r.value.fields.Opportunity__r.value
                .fields.Account.value.fields.OperatingHoursId;
            delete expected.fields.TestC__r.value.fields.TestA__r.value.fields.Opportunity__r.value
                .fields.Account.value.fields.OperatingHours.value.fields.CreatedById;

            expected.fields.TestC__r.value.fields.TestA__r.value.fields.Opportunity__r.value.fields.Account.value.recordTypeInfo = expectedAccountRecordTypeInfo;

            delete expectedAccount.fields.OperatingHours.value.fields.CreatedBy;

            expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(expected);
        });
    });

    describe('When single field at 6 levels of nested records is requested', () => {
        it('should NOT denormalize any fields at level 6', async () => {
            const testDMock = getMock(
                'record-TestD__c-fields-TestD__c.TestC__r.TestA__r.Opportunity__r.Account.Name--version-1571953531000'
            );

            const testDConfig = {
                recordId: testDMock.id,
                fields: ['TestD__c.TestC__r.TestA__r.Opportunity__r.Account.Name'],
            };

            mockGetRecordNetwork(testDConfig, testDMock);

            // This account Mock represents the same account at the same version from testCMock
            const accountMock = getMock(
                'record-Account-fields-Account.OperatingHours.CreatedBy.Name--version-1571943581000'
            );

            const accountConfig = {
                recordId: accountMock.id,
                fields: ['Account.OperatingHours.CreatedBy.Name'],
            };

            mockGetRecordNetwork(accountConfig, accountMock);

            // Ingest TestC__c.TestA__r.Opportunity__r.Account.Name
            await setupElement(testDConfig, RecordFields);

            // Ingest Account.OperatingHours.CreatedBy.Name
            await setupElement(accountConfig, RecordFields);

            const combinedConfig = {
                recordId: testDMock.id,
                fields: [
                    'TestD__c.TestC__r.TestA__r.Opportunity__r.Account.OperatingHours.CreatedBy.Name',
                ],
            };

            const elm = await setupElement(combinedConfig, RecordFields);
            expect(elm.pushCount()).toBe(1);

            const expected = getMock(
                'record-TestD__c-fields-TestD__c.TestC__r.TestA__r.Opportunity__r.Account.Name--version-1571953531000'
            );

            const expectedAccount = getMock(
                'record-Account-fields-Account.OperatingHours.CreatedBy.Name--version-1571943581000'
            );
            const expectedAccountRecordTypeInfo = JSON.parse(
                JSON.stringify(expectedAccount.recordTypeInfo)
            );

            const account =
                expected.fields.TestC__r.value.fields.TestA__r.value.fields.Opportunity__r.value
                    .fields.Account.value;

            expectedAccount.fields = {
                ...account.fields,
                ...expectedAccount.fields,
            };
            expected.fields.TestC__r.value.fields.TestA__r.value.fields.Opportunity__r.value.fields.Account.value = expectedAccount;

            delete expected.fields.TestC__c;
            delete expected.fields.TestC__r.value.fields.Id;
            delete expected.fields.TestC__r.value.fields.TestA__c;
            delete expected.fields.TestC__r.value.fields.TestA__r.value.fields.Id;
            delete expected.fields.TestC__r.value.fields.TestA__r.value.fields.Opportunity__c;
            delete expected.fields.TestC__r.value.fields.TestA__r.value.fields.Opportunity__r.value
                .fields.AccountId;
            delete expected.fields.TestC__r.value.fields.TestA__r.value.fields.Opportunity__r.value
                .fields.Id;
            delete expected.fields.TestC__r.value.fields.TestA__r.value.fields.Opportunity__r.value
                .fields.Account.value.fields.Id;
            delete expected.fields.TestC__r.value.fields.TestA__r.value.fields.Opportunity__r.value
                .fields.Account.value.fields.Name;
            delete expected.fields.TestC__r.value.fields.TestA__r.value.fields.Opportunity__r.value
                .fields.Account.value.fields.OperatingHoursId;
            delete expected.fields.TestC__r.value.fields.TestA__r.value.fields.Opportunity__r.value
                .fields.Account.value.fields.OperatingHours.value.fields.CreatedById;
            delete expected.fields.TestC__r.value.fields.TestA__r.value.fields.Opportunity__r.value
                .fields.Account.value.fields.OperatingHours.value.fields.Id;

            expected.fields.TestC__r.value.fields.TestA__r.value.fields.Opportunity__r.value.fields.Account.value.recordTypeInfo = expectedAccountRecordTypeInfo;

            delete expectedAccount.fields.OperatingHours.value.fields.CreatedBy;

            expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(expected);
        });
    });
});
