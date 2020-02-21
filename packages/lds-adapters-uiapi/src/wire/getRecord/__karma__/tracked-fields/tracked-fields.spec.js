import { karmaNetworkAdapter, updateRecord } from 'lds';
import { getMock as globalGetMock, mockNetworkOnce, setupElement } from 'test-util';
import sinon from 'sinon';
import {
    URL_BASE,
    expireRecords,
    extractRecordFields,
    mockGetRecordNetwork,
    mockUpdateRecordNetwork,
} from 'uiapi-test-util';

import RecordFields from '../lwc/record-fields';
import ListUi from '../../../getListUi/__karma__/lwc/basic';

const MOCK_PREFIX = 'wire/getRecord/__karma__/tracked-fields/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

function getListUiSinonParamsMatch(config) {
    const listViewId = config.listViewId;
    const queryParams = {
        pageSize: config.pageSize,
    };
    delete queryParams.listViewId;

    return sinon.match({
        path: `${URL_BASE}/list-ui/${listViewId}`,
        queryParams,
    });
}

function mockListUiNetwork(config, mockData) {
    mockNetworkOnce(karmaNetworkAdapter, getListUiSinonParamsMatch(config), mockData);
}

describe('tracked fields', () => {
    it('should fetch record with all tracked fields collected from getRecord wire', async () => {
        const oppWithName = getMock('record-Opportunity-fields-Opportunity.Name');
        const oppWithId = getMock('record-Opportunity-fields-Opportunity.Id');
        const oppWithNameAndId = getMock(
            'record-Opportunity-fields-Opportunity.Name,Opportunity.Id'
        );

        const combinedConfig = {
            recordId: oppWithNameAndId.id,
            fields: ['Opportunity.Id'],
            optionalFields: ['Opportunity.Name'],
        };

        const nameConfig = {
            recordId: oppWithName.id,
            fields: ['Opportunity.Name'],
        };

        const idConfig = {
            recordId: oppWithId.id,
            fields: ['Opportunity.Id'],
        };

        mockGetRecordNetwork(combinedConfig, oppWithNameAndId);
        mockGetRecordNetwork(nameConfig, oppWithName);

        // Get Opportunity.Name
        const nameWire = await setupElement(nameConfig, RecordFields);

        // Get Opportunity.Id
        const idWire = await setupElement(idConfig, RecordFields);

        // name wire should only have name field
        expect(nameWire.getWiredData()).toEqualSnapshotWithoutEtags(oppWithName);

        // name wire shouldn't have been pushed a new value
        expect(nameWire.pushCount()).toBe(1);

        // id wire should only have id field
        expect(idWire.getWiredData()).toEqualSnapshotWithoutEtags(oppWithId);

        // id wire should have a single push
        expect(idWire.pushCount()).toBe(1);
    });

    it('should fetch record with all tracked fields collected from arbitrary wires', async () => {
        const listMock = getMock('list-ui-accounts-page-size-6');
        const accountMock = getMock('account-fields-Account.Website-optionalFields');

        const listConfig = {
            listViewId: listMock.info.listReference.id,
            pageSize: 6,
        };

        const accountConfig = {
            recordId: accountMock.id,
            fields: ['Account.Website'],
        };

        mockListUiNetwork(listConfig, listMock);

        const expectedOptionalFields = extractRecordFields(listMock.records.records[0]);
        const networkParams = {
            ...accountConfig,
            optionalFields: expectedOptionalFields,
        };
        mockGetRecordNetwork(networkParams, accountMock);
        // Load list-ui
        await setupElement(listConfig, ListUi);

        // Load Account with Id
        const elm = await setupElement(accountConfig, RecordFields);

        const expected = getMock('record-Account-fields-Account.Website');
        // Only keep the fields which get requested by config
        expectedOptionalFields.forEach(fieldName => {
            const split = fieldName.split('.');

            const last = split[split.length - 1];
            delete expected.fields[last];
        });

        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(expected);
    });

    it('should not fetch record fields more than 6 levels deep', async () => {
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
        const refreshedConfig = {
            recordId: testDMock.id,
            fields: ['TestD__c.TestC__r.Id'],
            optionalFields: [
                'TestD__c.TestC__c',
                'TestD__c.TestC__r.TestA__c',
                'TestD__c.TestC__r.TestA__r.Id',
                'TestD__c.TestC__r.TestA__r.Opportunity__c',
                'TestD__c.TestC__r.TestA__r.Opportunity__r.Account.Id',
                'TestD__c.TestC__r.TestA__r.Opportunity__r.Account.Name',
                'TestD__c.TestC__r.TestA__r.Opportunity__r.Account.OperatingHours.CreatedById',
                'TestD__c.TestC__r.TestA__r.Opportunity__r.Account.OperatingHours.Id',
                'TestD__c.TestC__r.TestA__r.Opportunity__r.Account.OperatingHoursId',
                'TestD__c.TestC__r.TestA__r.Opportunity__r.AccountId',
                'TestD__c.TestC__r.TestA__r.Opportunity__r.Id',
            ],
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

    it('should request same requested fields when spanning record is null', async () => {
        // Initial mocks
        const initialMock = getMock('record-TestD__c-fields-TestD__c.TestC__r-null');
        const initialConfig = {
            recordId: initialMock.id,
            fields: ['TestD__c.TestC__r.Id'],
        };

        mockGetRecordNetwork(initialConfig, initialMock);

        // Update mocks
        const updateRecordConfig = {
            recordId: initialMock.id,
            fields: {
                Name: 'Name Updated',
            },
        };

        // Updating the mock will trigger a refresh because TestD__c.TestC__r.Id is not included
        // on the update record response
        const updateMock = getMock('record-TestD__c-TestD__c.TestC__r-missing-updated');
        mockUpdateRecordNetwork(initialMock.id, { fields: updateRecordConfig.fields }, updateMock);

        const refreshMock = getMock('record-TestD__c-TestD__c.TestC__r-null-refreshed');
        const refreshConfig = {
            recordId: initialMock.id,
            optionalFields: [
                'TestD__c.CreatedBy.Id',
                'TestD__c.CreatedBy.Name',
                'TestD__c.CreatedById',
                'TestD__c.CreatedDate',
                'TestD__c.LastModifiedBy.Id',
                'TestD__c.LastModifiedBy.Name',
                'TestD__c.LastModifiedById',
                'TestD__c.LastModifiedDate',
                'TestD__c.Name',
                'TestD__c.Owner.Id',
                'TestD__c.Owner.Name',
                'TestD__c.OwnerId',
                'TestD__c.TestC__r.Id',
            ],
        };

        mockGetRecordNetwork(refreshConfig, refreshMock);

        const elm = await setupElement(initialConfig, RecordFields);
        await updateRecord(updateRecordConfig);

        // elm should have received new value
        expect(elm.pushCount()).toBe(2);

        const expected = {
            ...refreshMock,
            fields: {
                TestC__r: {
                    value: null,
                    displayValue: null,
                },
            },
        };

        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(expected);
    });

    it('should request same requested optionalFields when spanning record is null', async () => {
        // Initial mocks
        const initialMock = getMock('record-TestD__c-fields-TestD__c.TestC__r-null');
        const initialConfig = {
            recordId: initialMock.id,
            optionalFields: ['TestD__c.TestC__r.Id'],
        };

        mockGetRecordNetwork(initialConfig, initialMock);

        // Update mocks
        const updateRecordConfig = {
            recordId: initialMock.id,
            fields: {
                Name: 'Name Updated',
            },
        };

        // Updating the mock will trigger a refresh because TestD__c.TestC__r.Id is not included
        // on the update record response
        const updateMock = getMock('record-TestD__c-TestD__c.TestC__r-missing-updated');
        mockUpdateRecordNetwork(initialMock.id, { fields: updateRecordConfig.fields }, updateMock);

        const refreshMock = getMock('record-TestD__c-TestD__c.TestC__r-null-refreshed');
        const refreshConfig = {
            recordId: initialMock.id,
            optionalFields: [
                'TestD__c.CreatedBy.Id',
                'TestD__c.CreatedBy.Name',
                'TestD__c.CreatedById',
                'TestD__c.CreatedDate',
                'TestD__c.LastModifiedBy.Id',
                'TestD__c.LastModifiedBy.Name',
                'TestD__c.LastModifiedById',
                'TestD__c.LastModifiedDate',
                'TestD__c.Name',
                'TestD__c.Owner.Id',
                'TestD__c.Owner.Name',
                'TestD__c.OwnerId',
                'TestD__c.TestC__r.Id',
            ],
        };

        mockGetRecordNetwork(refreshConfig, refreshMock);

        const elm = await setupElement(initialConfig, RecordFields);
        await updateRecord(updateRecordConfig);

        // elm should have received new value
        expect(elm.pushCount()).toBe(2);

        const expected = {
            ...refreshMock,
            fields: {
                TestC__r: {
                    value: null,
                    displayValue: null,
                },
            },
        };

        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(expected);
    });

    it('should handle when a null spanning record comes back populated on refreshed record', async () => {
        // Initial mocks
        const initialMock = getMock('record-TestD__c-fields-TestD__c.TestC__r-null');
        const initialConfig = {
            recordId: initialMock.id,
            optionalFields: ['TestD__c.TestC__r.Id'],
        };

        mockGetRecordNetwork(initialConfig, initialMock);

        // Update mocks
        const updateRecordConfig = {
            recordId: initialMock.id,
            fields: {
                Name: 'Name Updated',
            },
        };

        // Updating the mock will trigger a refresh because TestD__c.TestC__r.Id is not included
        // on the update record response
        const updateMock = getMock('record-TestD__c-TestD__c.TestC__r-missing-updated');
        mockUpdateRecordNetwork(initialMock.id, { fields: updateRecordConfig.fields }, updateMock);

        const refreshMock = getMock('record-TestD__c-fields-TestD__c.TestC__r.Id-populated');
        const refreshConfig = {
            recordId: initialMock.id,
            optionalFields: [
                'TestD__c.CreatedBy.Id',
                'TestD__c.CreatedBy.Name',
                'TestD__c.CreatedById',
                'TestD__c.CreatedDate',
                'TestD__c.LastModifiedBy.Id',
                'TestD__c.LastModifiedBy.Name',
                'TestD__c.LastModifiedById',
                'TestD__c.LastModifiedDate',
                'TestD__c.Name',
                'TestD__c.Owner.Id',
                'TestD__c.Owner.Name',
                'TestD__c.OwnerId',
                'TestD__c.TestC__r.Id',
            ],
        };

        mockGetRecordNetwork(refreshConfig, refreshMock);

        const elm = await setupElement(initialConfig, RecordFields);
        await updateRecord(updateRecordConfig);

        // elm should have received new value
        expect(elm.pushCount()).toBe(2);

        const expected = {
            ...refreshMock,
            fields: {
                TestC__r: refreshMock.fields.TestC__r,
            },
        };

        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(expected);
    });

    it('should handle when a null spanning record comes back with subset of spanning fields populated on refreshed record', async () => {
        // Initial mocks
        const initialMock = getMock('record-TestD__c-fields-TestD__c.TestC__r-null');
        const initialConfig = {
            recordId: initialMock.id,
            optionalFields: ['TestD__c.TestC__r.Id', 'TestD__c.TestC__r.NoExist'],
        };

        mockGetRecordNetwork(initialConfig, initialMock);

        // Update mocks
        const updateRecordConfig = {
            recordId: initialMock.id,
            fields: {
                Name: 'Name Updated',
            },
        };

        // Updating the mock will trigger a refresh because TestD__c.TestC__r.Id is not included
        // on the update record response
        const updateMock = getMock('record-TestD__c-TestD__c.TestC__r-missing-updated');
        mockUpdateRecordNetwork(initialMock.id, { fields: updateRecordConfig.fields }, updateMock);

        const refreshMock = getMock('record-TestD__c-fields-TestD__c.TestC__r.Id-populated');
        const refreshConfig = {
            recordId: initialMock.id,
            optionalFields: [
                'TestD__c.CreatedBy.Id',
                'TestD__c.CreatedBy.Name',
                'TestD__c.CreatedById',
                'TestD__c.CreatedDate',
                'TestD__c.LastModifiedBy.Id',
                'TestD__c.LastModifiedBy.Name',
                'TestD__c.LastModifiedById',
                'TestD__c.LastModifiedDate',
                'TestD__c.Name',
                'TestD__c.Owner.Id',
                'TestD__c.Owner.Name',
                'TestD__c.OwnerId',
                'TestD__c.TestC__r.Id',
                'TestD__c.TestC__r.NoExist',
            ],
        };

        mockGetRecordNetwork(refreshConfig, refreshMock);

        const elm = await setupElement(initialConfig, RecordFields);
        await updateRecord(updateRecordConfig);

        // elm should have received new value
        expect(elm.pushCount()).toBe(2);
        const expected = {
            ...refreshMock,
            fields: {
                TestC__r: refreshMock.fields.TestC__r,
            },
        };

        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(expected);
    });

    it('should request same requested fields when deep spanning record is null', async () => {
        // Initial mocks
        const initialMock = getMock(
            'record-ADM_Work__c-fields-ADM__Work__c.Epic__r.CreatedBy.Id-missing'
        );
        const initialConfig = {
            recordId: initialMock.id,
            fields: ['ADM_Work__c.Epic__r.CreatedBy.Id', 'ADM_Work__c.Subject__c'],
        };

        mockGetRecordNetwork(initialConfig, initialMock);

        // Update mocks
        const updateRecordConfig = {
            recordId: initialMock.id,
            fields: {
                Subject__c: 'Name Updated',
            },
        };

        // Updating the mock will trigger a refresh because TestD__c.TestC__r.Id is not included
        // on the update record response
        const updateMock = getMock('record-ADM_Work__c-fields-updated');
        mockUpdateRecordNetwork(initialMock.id, { fields: updateRecordConfig.fields }, updateMock);

        const refreshMock = getMock('record-ADM_Work__c-fields-refreshed');
        const refreshConfig = {
            recordId: initialMock.id,
            optionalFields: [
                'ADM_Work__c.Age_With_Scrum_Team__c',
                'ADM_Work__c.Assignee__c',
                'ADM_Work__c.Assignee__r',
                'ADM_Work__c.Badge__c',
                'ADM_Work__c.Badge__r',
                'ADM_Work__c.CreatedBy.Id',
                'ADM_Work__c.CreatedBy.Name',
                'ADM_Work__c.CreatedById',
                'ADM_Work__c.CreatedDate',
                'ADM_Work__c.Customer__c',
                'ADM_Work__c.Details_and_Steps_to_Reproduce__c',
                'ADM_Work__c.Due_Date__c',
                'ADM_Work__c.Epic_Rank__c',
                'ADM_Work__c.Epic__c',
                'ADM_Work__c.Epic__r',
                'ADM_Work__c.Epic__r.CreatedBy.Id',
                'ADM_Work__c.Found_in_Build__c',
                'ADM_Work__c.Found_in_Build__r.Id',
                'ADM_Work__c.Found_in_Build__r.Name',
                'ADM_Work__c.Frequency__c',
                'ADM_Work__c.Frequency__r.Id',
                'ADM_Work__c.Frequency__r.Name',
                'ADM_Work__c.Gack_First_Seen__c',
                'ADM_Work__c.Gack_Occurrences__c',
                'ADM_Work__c.Help_Status__c',
                'ADM_Work__c.Impact__c',
                'ADM_Work__c.Impact__r.Id',
                'ADM_Work__c.Impact__r.Name',
                'ADM_Work__c.Known_Issue_Link__c',
                'ADM_Work__c.LastModifiedBy.Id',
                'ADM_Work__c.LastModifiedBy.Name',
                'ADM_Work__c.LastModifiedById',
                'ADM_Work__c.LastModifiedDate',
                'ADM_Work__c.Number_of_Cases__c',
                'ADM_Work__c.Occurrences_Past_30_Days__c',
                'ADM_Work__c.Originated_From__c',
                'ADM_Work__c.Perforce_Status__c',
                'ADM_Work__c.Priority_Rank__c',
                'ADM_Work__c.Priority__c',
                'ADM_Work__c.Product_Legal_Request__c',
                'ADM_Work__c.Product_Legal_Request__r',
                'ADM_Work__c.Product_Owner__c',
                'ADM_Work__c.Product_Owner__r.Id',
                'ADM_Work__c.Product_Owner__r.Name',
                'ADM_Work__c.Product_Tag__c',
                'ADM_Work__c.Product_Tag__r.Id',
                'ADM_Work__c.Product_Tag__r.Name',
                'ADM_Work__c.QA_Engineer__c',
                'ADM_Work__c.QA_Engineer__r',
                'ADM_Work__c.Readme_Notes__c',
                'ADM_Work__c.Regressed__c',
                'ADM_Work__c.Resolution__c',
                'ADM_Work__c.Scheduled_Build__c',
                'ADM_Work__c.Scheduled_Build__r.Id',
                'ADM_Work__c.Scheduled_Build__r.Name',
                'ADM_Work__c.Sprint__c',
                'ADM_Work__c.Sprint__r',
                'ADM_Work__c.Stack_Trace_Link__c',
                'ADM_Work__c.Status__c',
                'ADM_Work__c.Story_Points__c',
                'ADM_Work__c.Subject__c',
                'ADM_Work__c.System_Test_Engineer__c',
                'ADM_Work__c.System_Test_Engineer__r',
                'ADM_Work__c.Tech_Writer__c',
                'ADM_Work__c.Tech_Writer__r',
                'ADM_Work__c.Test_Failure_Status__c',
                'ADM_Work__c.Trail__c',
                'ADM_Work__c.Trail__r',
                'ADM_Work__c.Type__c',
                'ADM_Work__c.UE_Engineer__c',
                'ADM_Work__c.UE_Engineer__r',
                'ADM_Work__c.UI_Text_Status__c',
                'ADM_Work__c.ftest__c',
                'ADM_Work__c.visual_link_num_of_Test_Failures__c',
            ],
        };

        mockGetRecordNetwork(refreshConfig, refreshMock);

        const elm = await setupElement(initialConfig, RecordFields);
        await updateRecord(updateRecordConfig);

        // elm should have received new value
        expect(elm.pushCount()).toBe(2);

        const expected = {
            ...refreshMock,
            fields: {
                Subject__c: {
                    displayValue: null,
                    value: 'Name Updated',
                },
                Epic__r: {
                    value: null,
                    displayValue: null,
                },
            },
        };

        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(expected);
    });
});
