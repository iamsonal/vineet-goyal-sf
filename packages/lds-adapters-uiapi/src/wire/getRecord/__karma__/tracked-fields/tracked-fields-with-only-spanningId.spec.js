import { karmaNetworkAdapter } from 'lds-engine';
import sinon from 'sinon';
import {
    getMock as globalGetMock,
    mockNetworkOnce as globalMockNetworkOnce,
    setupElement,
} from 'test-util';
import {
    expireRecords,
    extractRecordFields,
    instrument,
    getTrackedFieldLeafNodeIdOnly,
    mockGetRecordNetwork,
} from 'uiapi-test-util';
import GetListUi from '../../../getListUi/__karma__/lwc/listViewId';
import RecordFields from '../lwc/record-fields';

const MOCK_PREFIX = 'wire/getRecord/__karma__/tracked-fields/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

function mockListNetworkOnce(mockList) {
    globalMockNetworkOnce(
        karmaNetworkAdapter,
        sinon.match({
            urlParams: {
                listViewId: mockList.info.listReference.id,
            },
        }),
        mockList
    );
}

function keepOnlyId(record) {
    record.fields = {
        Id: record.fields.Id,
    };
}

describe('tracked fields with only spanning ID', () => {
    it('should not fetch record fields more than 1 levels deep', async () => {
        // using getRecord() twice to create entries in the store that go greater than 6 levels deep
        // first getRecord() does 5 levels: TestD__c.TestC__r.TestA__r.Opportunity__r.Account.Name
        // second getRecord() continues from the last level (Account) and adds 3 more: Account.OperatingHours.CreatedBy.Name
        const testDMock = getMock(
            'record-TestD__c-fields-TestD__c.TestC__r.TestA__r.Opportunity__r.Account.Name--version-1571953531000'
        );

        const testDConfig = {
            recordId: testDMock.id,
            fields: ['TestD__c.TestC__r.TestA__r.Opportunity__r.Account.Name'],
        };

        mockGetRecordNetwork(testDConfig, testDMock);

        const accountMock = getMock(
            'record-Account-fields-Account.OperatingHours.CreatedBy.Name--version-1571943581000'
        );

        const accountConfig = {
            recordId: accountMock.id,
            fields: ['Account.OperatingHours.CreatedBy.Name'],
            optionalFields: ['Account.Id', 'Account.Name'],
        };

        mockGetRecordNetwork(accountConfig, accountMock);

        const refreshMock = getMock('record-TestD__c-fields-6-levels');
        // trim nested records from mock data to match the request
        keepOnlyId(refreshMock.fields.TestC__r.value);

        let optionalFields;
        if (getTrackedFieldLeafNodeIdOnly()) {
            optionalFields = ['TestD__c.TestC__c'];
        } else {
            optionalFields = extractRecordFields(testDMock, {
                omit: ['TestD__c.TestC__r.Id'],
                add: [
                    'TestD__c.TestC__r.TestA__r.Opportunity__r.Account.OperatingHours.CreatedById',
                    'TestD__c.TestC__r.TestA__r.Opportunity__r.Account.OperatingHours.Id',
                    'TestD__c.TestC__r.TestA__r.Opportunity__r.Account.OperatingHoursId',
                ],
            });
        }
        const refreshedConfig = {
            recordId: testDMock.id,
            fields: ['TestD__c.TestC__r.Id'],
            optionalFields,
        };

        mockGetRecordNetwork(refreshedConfig, refreshMock);

        // Ingest TestD__c.TestC__r.TestA__r.Opportunity__r.Account.Name
        await setupElement(testDConfig, RecordFields);

        // Ingest Account.OperatingHours.CreatedBy.Name
        await setupElement(accountConfig, RecordFields);

        // Expire records, force refresh
        expireRecords();

        const recordConflictsResolved = jasmine.createSpy('recordConflictsResolved');
        instrument({ recordConflictsResolved });

        const elm = await setupElement(
            {
                recordId: testDMock.id,
                fields: ['TestD__c.TestC__r.Id'],
            },
            RecordFields
        );

        expect(elm.pushCount()).toBe(1);
        expect(recordConflictsResolved).toHaveBeenCalledTimes(1);
        expect(recordConflictsResolved).toHaveBeenCalledWith(1);
    });

    it('should only request spanning record ID field if invoking notify change', async () => {
        // getRecord() does 5 levels: TestD__c.TestC__r.TestA__r.Opportunity__r.Account.Name
        const testDMock = getMock(
            'record-TestD__c-fields-TestD__c.TestC__r.TestA__r.Opportunity__r.Account.Name--version-1571953531000'
        );

        const testDConfig = {
            recordId: testDMock.id,
            fields: ['TestD__c.TestC__r.TestA__r.Opportunity__r.Account.Name'],
        };

        mockGetRecordNetwork(testDConfig, testDMock);

        const elm = await setupElement(testDConfig, RecordFields);

        const refreshMock = getMock('record-TestD__c-fields-6-levels');
        // trim nested records from mock data to match the request
        keepOnlyId(refreshMock.fields.TestC__r.value);

        let optionalFields;
        if (getTrackedFieldLeafNodeIdOnly()) {
            optionalFields = ['TestD__c.TestC__c', 'TestD__c.TestC__r.Id'];
        } else {
            optionalFields = [
                'TestD__c.TestC__c',
                'TestD__c.TestC__r.Id',
                'TestD__c.TestC__r.TestA__c',
                'TestD__c.TestC__r.TestA__r.Id',
                'TestD__c.TestC__r.TestA__r.Opportunity__c',
                'TestD__c.TestC__r.TestA__r.Opportunity__r.Account.Id',
                'TestD__c.TestC__r.TestA__r.Opportunity__r.Account.Name',
                'TestD__c.TestC__r.TestA__r.Opportunity__r.AccountId',
                'TestD__c.TestC__r.TestA__r.Opportunity__r.Id',
            ];
        }
        const refreshedConfig = {
            recordId: testDMock.id,
            optionalFields,
        };

        mockGetRecordNetwork(refreshedConfig, refreshMock);

        const recordConflictsResolved = jasmine.createSpy('recordConflictsResolved');
        instrument({ recordConflictsResolved });

        await elm.notifyChange([{ recordId: testDMock.id }]);

        expect(elm.pushCount()).toBe(1);
        expect(recordConflictsResolved).toHaveBeenCalledTimes(1);
        expect(recordConflictsResolved).toHaveBeenCalledWith(1);
    });

    it('should only request spanning record ID field if resolving a record merge conflict when incoming record has higher version', async () => {
        const mockRecord = getMock(
            'record-Opportunity-fields-Opportunity.FiscalYear,Opportunity.Id,Opportunity.CreatedBy.Id,Opportunity.CreatedBy.Name,Opportunity.CreatedBy.CreatedBy.Id'
        );
        mockRecord.weakEtag = 1;
        const recordConfig = {
            recordId: mockRecord.id,
            fields: ['Opportunity.FiscalYear'],
        };

        mockGetRecordNetwork(recordConfig, mockRecord);

        const mockList = getMock('list-ui-All-Opportunities-pageToken-0-pageSize-1');
        const listRecord = mockList.records.records[0];
        listRecord.weakEtag = 2;

        const listConfig = {
            listViewId: mockList.info.listReference.id,
            pageSize: 1,
        };

        mockListNetworkOnce(mockList);

        const listRecordFields = extractRecordFields(listRecord, {
            useNewTrackedFieldBehavior: getTrackedFieldLeafNodeIdOnly(),
            add: ['Opportunity.CreatedBy.Id', 'Opportunity.CreatedById', 'Opportunity.FiscalYear'],
        });
        if (!getTrackedFieldLeafNodeIdOnly()) {
            listRecordFields.push(
                'Opportunity.CreatedBy.CreatedById',
                'Opportunity.CreatedBy.Name'
            );
            listRecordFields.sort();
        }

        const refreshMock = getMock('record-list-tracked-fields-new');
        // update value to emit
        refreshMock.weakEtag = 2;
        refreshMock.fields.FiscalYear.value = 3000;

        // Mock record refresh
        mockGetRecordNetwork(
            {
                recordId: mockRecord.id,
                optionalFields: listRecordFields,
            },
            refreshMock
        );

        const recordConflictsResolved = jasmine.createSpy('recordConflictsResolved');
        instrument({ recordConflictsResolved });

        const elm = await setupElement(recordConfig, RecordFields);

        // first getRecord
        expect(recordConflictsResolved).toHaveBeenCalledTimes(1);
        expect(recordConflictsResolved).toHaveBeenCalledWith(1);

        const listElm = await setupElement(listConfig, GetListUi);

        // Called 2 times because merge conflict re-fetch
        expect(elm.pushCount()).toBe(2);

        // getRecord to resolve conflict should have counted as 1 network request since getListUi
        // does not support tracked fields
        expect(recordConflictsResolved).toHaveBeenCalledTimes(2);
        expect(recordConflictsResolved).toHaveBeenCalledWith(1);

        expect(listElm.pushCount()).toBe(1);
    });

    it('correctly counts iterative conflict resolution requests', async () => {
        const recordConflictsResolved = jasmine.createSpy('recordConflictsResolved');
        instrument({ recordConflictsResolved });

        // populate Account -> OperatingHours -> User in the cache
        const accountMock1 = getMock(
            'record-Account-fields-Account.OperatingHours.CreatedBy.Name--version-1571943581000'
        );
        const accountConfig1 = {
            recordId: accountMock1.id,
            fields: ['Account.OperatingHours.CreatedBy.Name'],
        };
        mockGetRecordNetwork(accountConfig1, accountMock1);

        if (!getTrackedFieldLeafNodeIdOnly()) {
            const accountConfig1a = {
                recordId: accountMock1.id,
                fields: ['Account.OperatingHours.CreatedBy.Name'],
                optionalFields: [
                    'Account.Name',
                    'Account.OperatingHours.CreatedBy.Id',
                    'Account.OperatingHours.CreatedById',
                    'Account.OperatingHours.Id',
                    'Account.OperatingHoursId',
                ],
            };
            mockGetRecordNetwork(accountConfig1a, accountMock1);
        }

        await setupElement(accountConfig1, RecordFields);

        // initial getRecord was fully resolved in 1 request
        expect(recordConflictsResolved).toHaveBeenCalledTimes(1);
        expect(recordConflictsResolved).toHaveBeenCalledWith(1);

        // create a series of conflicts to be resolved:
        //
        // 1. new element asks for Account.Name - request will include Account.OperatingHours.Id,
        //    response shows that OperatingHours has been updated
        const accountMock2 = JSON.parse(JSON.stringify(accountMock1));
        accountMock2.fields.OperatingHours.value.weakEtag++;
        keepOnlyId(accountMock2.fields.OperatingHours.value);
        accountMock2.fields.Name = {
            displayValue: null,
            value: 'Account Name',
        };
        const accountConfig2 = {
            recordId: accountMock2.id,
            fields: ['Account.Name'],
            optionalFields: getTrackedFieldLeafNodeIdOnly()
                ? ['Account.OperatingHours.Id', 'Account.OperatingHoursId']
                : [
                      'Account.OperatingHours.CreatedBy.Id',
                      'Account.OperatingHours.CreatedBy.Name',
                      'Account.OperatingHours.CreatedById',
                      'Account.OperatingHours.Id',
                      'Account.OperatingHoursId',
                  ],
        };
        mockGetRecordNetwork(accountConfig2, accountMock2);

        if (!getTrackedFieldLeafNodeIdOnly()) {
            const accountMock2a = {
                recordId: accountMock2.id,
                fields: ['Account.OperatingHours.CreatedBy.Name'],
                optionalFields: [
                    'Account.Name',
                    'Account.OperatingHours.CreatedBy',
                    'Account.OperatingHours.CreatedById',
                    'Account.OperatingHours.Id',
                    'Account.OperatingHoursId',
                ],
            };
            mockGetRecordNetwork(accountMock2a, accountMock2);
        }

        // 2. resolve OperatingHours conflict - request will include OperatingHours.CreatedBy.Id,
        //    response shows that User has been updated
        const operatingHoursMock = JSON.parse(
            JSON.stringify(accountMock1.fields.OperatingHours.value)
        );
        operatingHoursMock.weakEtag++;
        operatingHoursMock.fields.CreatedBy.value.weakEtag++;
        keepOnlyId(operatingHoursMock.fields.CreatedBy.value);
        mockGetRecordNetwork(
            {
                recordId: operatingHoursMock.id,
                optionalFields: getTrackedFieldLeafNodeIdOnly()
                    ? [
                          'OperatingHours.CreatedBy.Id',
                          'OperatingHours.CreatedById',
                          'OperatingHours.Id',
                      ]
                    : [
                          'OperatingHours.CreatedBy.Id',
                          'OperatingHours.CreatedBy.Name',
                          'OperatingHours.CreatedById',
                          'OperatingHours.Id',
                      ],
            },
            operatingHoursMock
        );

        // 3. resolve User conflict
        const userMock = JSON.parse(
            JSON.stringify(accountMock1.fields.OperatingHours.value.fields.CreatedBy.value)
        );
        userMock.weakEtag++;
        mockGetRecordNetwork(
            {
                recordId: userMock.id,
                optionalFields: ['User.Id', 'User.Name'],
            },
            userMock
        );

        await setupElement(accountConfig2, RecordFields);

        // this getRecord should have reported 3 server requests to resolve everything
        const expectedRecordConflictsResolved = getTrackedFieldLeafNodeIdOnly() ? 2 : 4;
        expect(recordConflictsResolved).toHaveBeenCalledTimes(expectedRecordConflictsResolved);
        expect(recordConflictsResolved).toHaveBeenCalledWith(3);
    });
});
