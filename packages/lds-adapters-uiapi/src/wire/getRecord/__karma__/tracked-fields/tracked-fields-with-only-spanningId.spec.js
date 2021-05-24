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
    mockGetRecordNetwork,
    setTrackedFieldsConfig,
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

describe('tracked fields with only spanning ID', () => {
    beforeAll(() => {
        setTrackedFieldsConfig(true);
    });

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

        //TODO: change mock data to only reflect 1 level deep
        const refreshMock = getMock('record-TestD__c-fields-6-levels');
        const refreshedConfig = {
            recordId: testDMock.id,
            fields: ['TestD__c.TestC__r.Id'],
            optionalFields: ['TestD__c.TestC__c'],
        };

        mockGetRecordNetwork(refreshedConfig, refreshMock);

        // Ingest TestD__c.TestC__r.TestA__r.Opportunity__r.Account.Name
        await setupElement(testDConfig, RecordFields);

        // Ingest Account.OperatingHours.CreatedBy.Name
        await setupElement(accountConfig, RecordFields);

        // Expire records, force refresh
        expireRecords();

        const elm = await setupElement(
            {
                recordId: testDMock.id,
                fields: ['TestD__c.TestC__r.Id'],
            },
            RecordFields
        );

        expect(elm.pushCount()).toBe(1);
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

        // also, update mock data
        const refreshMock = getMock('record-TestD__c-fields-6-levels');
        const refreshedConfig = {
            recordId: testDMock.id,
            optionalFields: ['TestD__c.TestC__c', 'TestD__c.TestC__r.Id'],
        };

        mockGetRecordNetwork(refreshedConfig, refreshMock);

        await elm.notifyChange([{ recordId: testDMock.id }]);

        expect(elm.pushCount()).toBe(1);
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

        const listRecordFields = extractRecordFields(listRecord)
            .filter((field) => {
                return field.split('.').length < 3;
            })
            // Adding fields by getRecord adapter and tracked fields Ids
            .concat([
                'Opportunity.FiscalYear',
                'Opportunity.CreatedById',
                'Opportunity.CreatedBy.Id',
                'Opportunity.Owner.Id',
                'Opportunity.Account.Id',
            ])
            .sort();

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

        const elm = await setupElement(recordConfig, RecordFields);

        const listElm = await setupElement(listConfig, GetListUi);

        // Called 2 times because merge conflict re-fetch
        expect(elm.pushCount()).toBe(2);

        expect(listElm.pushCount()).toBe(1);
    });
    // Reset tracked fields to our default behavior
    afterAll(() => {
        setTrackedFieldsConfig(false);
    });
});
