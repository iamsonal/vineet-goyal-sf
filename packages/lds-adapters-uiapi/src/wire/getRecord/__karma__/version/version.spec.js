import {
    FETCH_RESPONSE_OK,
    getMock as globalGetMock,
    mockNetworkOnce as globalMockNetworkOnce,
    setupElement,
    flushPromises,
} from 'test-util';
import {
    URL_BASE,
    expireRecords,
    extractRecordFields,
    mockGetRecordNetwork,
} from 'uiapi-test-util';

import GetListUi from '../../../getListUi/__karma__/lwc/listViewId';
import RecordFields from '../lwc/record-fields';
import { karmaNetworkAdapter } from 'lds';
import sinon from 'sinon';

const MOCK_PREFIX = 'wire/getRecord/__karma__/version/data/';

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

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

function getNetworkParams(config) {
    const recordId = config.recordId;
    const queryParams = { ...config };
    delete queryParams.recordId;

    return sinon.match({
        path: `${URL_BASE}/records/${recordId}`,
        queryParams,
    });
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

describe('Incoming record has higher version', () => {
    it('should refresh record when incoming record has higher version and different set of fields', async () => {
        const mockRecord = getMock('record-Opportunity-fields-Opportunity.FiscalYear');
        mockRecord.weakEtag = 1;
        const recordConfig = {
            recordId: mockRecord.id,
            fields: ['Opportunity.FiscalYear'],
        };

        mockGetRecordNetwork(recordConfig, mockRecord);

        const mockList = getMock('list-ui-Opportunity-pageSize-1');
        const listRecord = mockList.records.records[0];
        listRecord.weakEtag = 2;

        const listConfig = {
            listViewId: mockList.info.listReference.id,
            pageSize: 1,
        };

        mockListNetworkOnce(mockList);

        const listRecordFields = extractRecordFields(listRecord)
            .concat(['Opportunity.FiscalYear'])
            .sort();

        const refreshMock = getMock('record-Opportunity-all-fields');
        refreshMock.weakEtag = 2;

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

        // List doesn't care about FiscalYear
        // should only have one push
        expect(listElm.pushCount()).toBe(1);

        // Record does care about FiscalYear
        // FiscalYear changed when refreshed
        // Elm should have two pushes
        expect(elm.pushCount()).toBe(2);

        // Elm should reflect latest data
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags({
            ...mockRecord,
            fields: {
                ...mockRecord.fields,
                FiscalYear: refreshMock.fields.FiscalYear,
            },
        });
    });

    it('should not refresh record when incoming record has superset of fields', async () => {
        const mockRecord = getMock('record-Opportunity-fields-Opportunity.Name');
        mockRecord.weakEtag = 1;
        const recordConfig = {
            recordId: mockRecord.id,
            fields: ['Opportunity.Name'],
        };

        mockGetRecordNetwork(recordConfig, mockRecord);

        const mockList = getMock('list-ui-Opportunity-pageSize-1');
        const listRecord = mockList.records.records[0];
        listRecord.weakEtag = 2;

        const listConfig = {
            listViewId: mockList.info.listReference.id,
            pageSize: 1,
        };

        mockListNetworkOnce(mockList);

        const elm = await setupElement(recordConfig, RecordFields);
        const listElm = await setupElement(listConfig, GetListUi);

        // Sanity check
        expect(listElm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mockRecord);

        expect(elm.pushCount()).toBe(1);
    });

    it('should handle when refresh returns with record lower version that what is currently in store', async () => {
        // version 0001 Name
        const opportunityNameMock = getMock(
            'record-Opportunity-fields-Opportunity.Name-version-0001'
        );

        const opportunityNameConfig = {
            recordId: opportunityNameMock.id,
            fields: ['Opportunity.Name'],
        };

        mockGetRecordNetwork(opportunityNameConfig, opportunityNameMock);

        // version 0001 Id and Name
        const refreshedConfig = {
            recordId: opportunityNameMock.id,
            fields: ['Opportunity.Id'],
            optionalFields: ['Opportunity.Name'],
        };

        const refreshedMock = getMock(
            'record-Opportunity-fields-Opportunity.Id,Opportunity.Name-version-0001'
        );

        const resolveRefreshed = mockNetworkOnceDefer(refreshedConfig, refreshedMock);

        // Version 0002 AccountId and Name
        const version2MockNameIdAccountId = getMock(
            'record-Opportunity-fields-Opportunity.Name,Opportunity.AccountId-version-0002'
        );

        // Version 002 AccountId, Name and Id
        const allFieldsRefreshConfig = {
            recordId: opportunityNameMock.id,
            optionalFields: ['Opportunity.AccountId', 'Opportunity.Id', 'Opportunity.Name'],
        };

        const allFieldsVersion2Mock = getMock(
            'record-Opportunity-fields-Opportunity.Id,Opportunity.Name,Opportunity.AccountId-version-0002'
        );
        mockGetRecordNetwork(allFieldsRefreshConfig, allFieldsVersion2Mock);

        mockGetRecordNetwork(
            {
                recordId: version2MockNameIdAccountId.id,
                fields: ['Opportunity.AccountId'],
                optionalFields: ['Opportunity.Name'],
            },
            version2MockNameIdAccountId
        );

        // Load Opportunity.Name
        const nameElm = await setupElement(opportunityNameConfig, RecordFields);

        expect(nameElm.pushCount()).toBe(1);
        expect(nameElm.getWiredData()).toEqualSnapshotWithoutEtags(opportunityNameMock);

        // Load Opportunity.Id
        // This XHR does not immediately resolve so the component will not get any data
        await setupElement(
            {
                recordId: version2MockNameIdAccountId.id,
                fields: ['Opportunity.Id'],
            },
            RecordFields
        );

        // Load Opportunity.AccountId
        const accountIdConfig = {
            recordId: version2MockNameIdAccountId.id,
            fields: ['Opportunity.AccountId'],
        };

        const accountElm = await setupElement(accountIdConfig, RecordFields);

        expect(accountElm.pushCount()).toBe(1);

        // AccountId request returns record version 2
        // Opportunity.Id request will return version 1
        await resolveRefreshed();

        // Another refresh should have taken place
        // nameElm should have received new data
        expect(nameElm.pushCount()).toBe(2);

        // Name element should have the latest version of the record
        delete version2MockNameIdAccountId.fields.Id;
        delete version2MockNameIdAccountId.fields.AccountId;
        expect(nameElm.getWiredData()).toEqualSnapshotWithoutEtags(version2MockNameIdAccountId);
    });

    it('should refresh nested record when nested incoming record has higher version and different set of fields', async () => {
        const mockRecordAccountName = getMock('record-Opportunity-fields-Opportunity.Account.Name');
        mockRecordAccountName.weakEtag = 2;

        const recordAccountNameConfig = {
            recordId: mockRecordAccountName.id,
            fields: ['Opportunity.Account.Name'],
        };

        mockGetRecordNetwork(recordAccountNameConfig, mockRecordAccountName);

        const mockList = getMock('list-ui-Opportunity-pageSize-1');
        const listRecord = mockList.records.records[0];
        listRecord.weakEtag = 1;

        const listConfig = {
            listViewId: mockList.info.listReference.id,
            pageSize: 1,
        };

        mockListNetworkOnce(mockList);

        const refreshMock = getMock('list-ui-Opportunity-record-refreshed');

        // Mock record refresh
        mockGetRecordNetwork(
            {
                recordId: mockRecordAccountName.id,
                optionalFields: extractRecordFields(listRecord)
                    .concat(['Opportunity.Account.Name'])
                    .sort(),
            },
            refreshMock
        );

        const elmAccountName = await setupElement(recordAccountNameConfig, RecordFields);
        await setupElement(listConfig, GetListUi);

        expect(elmAccountName.pushCount()).toBe(1);
        expect(elmAccountName.getWiredData()).toEqualSnapshotWithoutEtags(mockRecordAccountName);
    });

    it('should refresh record when incoming record has higher version and different set of fields than previously ingested nested record', async () => {
        const mockOppyFiscalYear = getMock('record-Opportunity-fields-Opportunity.FiscalYear');
        mockOppyFiscalYear.weakEtag = 1;

        const recordOppyConfig = {
            recordId: mockOppyFiscalYear.id,
            fields: ['Opportunity.FiscalYear'],
        };

        mockGetRecordNetwork(recordOppyConfig, mockOppyFiscalYear);

        const mockList = getMock('list-ui-Opportunity-pageSize-1');
        const listRecord = mockList.records.records[0];
        listRecord.weakEtag = 2;

        const listConfig = {
            listViewId: mockList.info.listReference.id,
            pageSize: 1,
        };

        mockListNetworkOnce(mockList);

        const refreshMock = getMock('list-ui-Opportunity-record-refreshed-fields-FiscalYear');

        // Mock record refresh
        mockGetRecordNetwork(
            {
                recordId: mockOppyFiscalYear.id,
                optionalFields: extractRecordFields(listRecord)
                    .concat(['Opportunity.FiscalYear'])
                    .sort(),
            },
            refreshMock
        );

        const elmAccountName = await setupElement(recordOppyConfig, RecordFields);
        await setupElement(listConfig, GetListUi);
        expect(elmAccountName.pushCount()).toBe(1);
        expect(elmAccountName.getWiredData()).toEqualSnapshotWithoutEtags(mockOppyFiscalYear);
    });
});

describe('Incoming record has lower version', () => {
    it('should not refresh record when existing record has superset of fields', async () => {
        const mockList = getMock('list-ui-Opportunity-pageSize-1');
        const listRecord = mockList.records.records[0];
        listRecord.weakEtag = 2;

        const listConfig = {
            listViewId: mockList.info.listReference.id,
            pageSize: 1,
        };

        mockListNetworkOnce(mockList);

        const mockRecord = getMock('record-Opportunity-fields-Opportunity.Name');
        mockRecord.weakEtag = 1;
        const recordConfig = {
            recordId: mockRecord.id,
            fields: ['Opportunity.Name'],
        };

        mockGetRecordNetwork(recordConfig, mockRecord);

        const listElm = await setupElement(listConfig, GetListUi);
        expireRecords();
        const elm = await setupElement(recordConfig, RecordFields);

        // Sanity check
        expect(listElm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mockRecord);

        expect(elm.pushCount()).toBe(1);
    });

    it('should refresh when incoming record has a different set of fields', async () => {
        const mockList = getMock('list-ui-Opportunity-pageSize-1');
        const listRecord = mockList.records.records[0];
        listRecord.weakEtag = 2;

        const listConfig = {
            listViewId: mockList.info.listReference.id,
            pageSize: 1,
        };

        mockListNetworkOnce(mockList);

        const mockRecord = getMock('record-Opportunity-fields-Opportunity.FiscalYear');
        mockRecord.weakEtag = 1;
        const recordConfig = {
            recordId: mockRecord.id,
            fields: ['Opportunity.FiscalYear'],
        };

        mockGetRecordNetwork(recordConfig, mockRecord);

        const listRecordFields = extractRecordFields(listRecord)
            .concat(['Opportunity.FiscalYear'])
            .sort();

        const refreshMock = getMock('record-Opportunity-all-fields');
        refreshMock.weakEtag = 2;

        // Mock record refresh
        const resolveRefresh = mockNetworkOnceDefer(
            {
                recordId: mockRecord.id,
                optionalFields: sinon.match.array.contains(listRecordFields),
            },
            refreshMock
        );

        const listElm = await setupElement(listConfig, GetListUi);
        const elm = await setupElement(recordConfig, RecordFields);
        await resolveRefresh();

        // List doesn't care about FiscalYear
        // should only have one push
        expect(listElm.pushCount()).toBe(1);
        // RecordField elm should have only received 1 push
        // No Pending snapshot should have been pushed
        expect(elm.pushCount()).toBe(1);

        // Elm should reflect latest data
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags({
            ...mockRecord,
            fields: {
                ...mockRecord.fields,
                FiscalYear: refreshMock.fields.FiscalYear,
            },
        });
    });

    it('should correctly merge FieldValue representation when incoming parent record is old', async () => {
        const version1Mock = getMock(
            'record-Opportunity-fields-Opportunity.Id,Opportunity.Name-version-0001'
        );
        const version2Mock = getMock(
            'record-Opportunity-fields-Opportunity.Id,Opportunity.Name-version-0002'
        );

        const version1Config = {
            recordId: version2Mock.id,
            fields: ['Opportunity.Id', 'Opportunity.Name'],
        };

        const version2Config = {
            recordId: version2Mock.id,
            optionalFields: ['Opportunity.Id', 'Opportunity.Name'],
        };

        const resolveVersion1 = mockNetworkOnceDefer(version1Config, version1Mock);
        mockGetRecordNetwork(version2Config, version2Mock);

        // Send XHR for version 1
        const version1Elm = await setupElement(version1Config, RecordFields);

        // Send XHR for version 2
        const version2Elm = await setupElement(version2Config, RecordFields);

        expect(version2Elm.pushCount()).toBe(1);
        expect(version2Elm.getWiredData()).toEqualSnapshotWithoutEtags(version2Mock);
        await resolveVersion1();

        expect(version1Elm.pushCount()).toBe(1);
        expect(version1Elm.getWiredData()).toEqualSnapshotWithoutEtags(version2Mock);
        expect(version2Elm.pushCount()).toBe(1);
    });

    it('should correctly merge spanning records when weakEtag is lower than existing spanning record', async () => {
        const version1MockName = getMock(
            'record-Opportunity-fields-Opportunity.Account.Name-version-0001'
        );
        const version2MockPhone = getMock(
            'record-Opportunity-fields-Opportunity.Account.Phone-version-0002'
        );
        const version2MockAccountRefresh = getMock(
            'record-Account.Name,Account.Phone-version-0002'
        );

        const version1Config = {
            recordId: version1MockName.id,
            fields: ['Opportunity.Account.Name'],
        };

        const version2Config = {
            recordId: version2MockPhone.id,
            fields: ['Opportunity.Account.Phone'],
        };

        const version2ConfigSpanningRecordRefresh = {
            recordId: version2MockAccountRefresh.id,
            optionalFields: ['Account.Name', 'Account.Phone'],
        };

        const version2ConfigAllFields = {
            recordId: version2MockPhone.id,
            fields: ['Opportunity.Account.Name', 'Opportunity.Account.Phone'],
        };

        const resolveVersion1 = mockNetworkOnceDefer(version1Config, version1MockName);
        mockGetRecordNetwork(version2Config, version2MockPhone);
        const resolveRefresh = mockNetworkOnceDefer(
            version2ConfigSpanningRecordRefresh,
            version2MockAccountRefresh
        );

        // Send XHR for version 1
        const version1Elm = await setupElement(version1Config, RecordFields);
        // Send XHR for version 2
        const version2Elm = await setupElement(version2Config, RecordFields);

        expect(version2Elm.pushCount()).toBe(1);
        expect(version2Elm.getWiredData()).toEqualSnapshotWithoutEtags(version2MockPhone);

        await resolveVersion1();
        await resolveRefresh();

        expect(version1Elm.pushCount()).toBe(1);
        expect(version1Elm.getWiredData()).toEqualSnapshotWithoutEtags(version1MockName);
        expect(version2Elm.pushCount()).toBe(1);

        // Should be cache hit with no network request made.
        const version3Elm = await setupElement(version2ConfigAllFields, RecordFields);
        expect(version1Elm.pushCount()).toBe(1);
        expect(version2Elm.pushCount()).toBe(1);
        expect(version3Elm.pushCount()).toBe(1);

        version2MockPhone.fields.Account.value = version2MockAccountRefresh;
        expect(version3Elm.getWiredData()).toEqualSnapshotWithoutEtags(version2MockPhone);
    });

    it('should correctly merge spanning records when weakEtag is lower than existing spanning record and record has changed', async () => {
        const version1MockName = getMock(
            'record-Opportunity-fields-Opportunity.Account.Name-version-0001'
        );
        const version2MockPhone = getMock(
            'record-Opportunity-fields-Opportunity.Account.Phone-version-0002'
        );
        const version3MockAccountRefresh = getMock(
            'record-Account.Name,Account.Phone-version-0002'
        );
        const updatedAccountPhoneValue = version3MockAccountRefresh.fields.Phone.value + '000';
        version3MockAccountRefresh.fields.Phone.value = updatedAccountPhoneValue;
        version3MockAccountRefresh.weakEtag = 3;

        const version1Config = {
            recordId: version1MockName.id,
            fields: ['Opportunity.Account.Name'],
        };

        const version2Config = {
            recordId: version2MockPhone.id,
            fields: ['Opportunity.Account.Phone'],
        };

        const version2ConfigSpanningRecordRefresh = {
            recordId: version3MockAccountRefresh.id,
            optionalFields: ['Account.Name', 'Account.Phone'],
        };

        const version2ConfigAllFields = {
            recordId: version2MockPhone.id,
            fields: ['Opportunity.Account.Name', 'Opportunity.Account.Phone'],
        };

        const resolveVersion1 = mockNetworkOnceDefer(version1Config, version1MockName);
        mockGetRecordNetwork(version2Config, version2MockPhone);
        const resolveRefresh = mockNetworkOnceDefer(
            version2ConfigSpanningRecordRefresh,
            version3MockAccountRefresh
        );

        // Send XHR for version 1
        const version1Elm = await setupElement(version1Config, RecordFields);
        // Send XHR for version 2
        const version2Elm = await setupElement(version2Config, RecordFields);

        expect(version2Elm.pushCount()).toBe(1);
        expect(version2Elm.getWiredData()).toEqualSnapshotWithoutEtags(version2MockPhone);

        await resolveVersion1();
        await resolveRefresh();

        version2MockPhone.fields.Account.value.fields.Phone.value = updatedAccountPhoneValue;

        expect(version1Elm.pushCount()).toBe(1);
        expect(version1Elm.getWiredData()).toEqualSnapshotWithoutEtags(version1MockName);
        expect(version2Elm.pushCount()).toBe(2);
        expect(version2Elm.getWiredData()).toEqualSnapshotWithoutEtags(version2MockPhone);

        // Should be cache hit with no network request made.
        const version3Elm = await setupElement(version2ConfigAllFields, RecordFields);
        expect(version1Elm.pushCount()).toBe(1);
        expect(version2Elm.pushCount()).toBe(2);
        expect(version3Elm.pushCount()).toBe(1);

        version2MockPhone.fields.Account.value = version3MockAccountRefresh;
        expect(version3Elm.getWiredData()).toEqualSnapshotWithoutEtags(version2MockPhone);
    });
});

describe('Refreshing unsupported entity', () => {
    it('should NOT refresh when incoming unsupported entity has higher version and less fields then existing', async () => {
        const version1Mock = getMock('record-Opportunity-unsupported-entity-version-1');
        const version2Mock = getMock('record-Opportunity-unsupported-entity-version-2');

        const config = {
            recordId: version1Mock.id,
            fields: ['Opportunity.Unsupported.Name', 'Opportunity.Unsupported.OwnerId'],
        };

        mockGetRecordNetwork(config, [version1Mock, version2Mock]);

        const elm = await setupElement(config, RecordFields);

        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(version1Mock);

        // Expire this record because we want to go back to the server
        // to get the updated record
        expireRecords();

        const secondElm = await setupElement(config, RecordFields);
        expect(secondElm.pushCount()).toBe(1);

        version1Mock.fields.Unsupported.value.fields.Name =
            version2Mock.fields.Unsupported.value.fields.Name;
        expect(secondElm.getWiredData()).toEqualSnapshotWithoutEtags(version1Mock);
        // This test will fail if there is an extra XHR
    });

    it('should NOT refresh when incoming unsupported entity has lower version and more fields then existing', async () => {
        // Version 1 just has Name and OwnerId
        const version1Mock = getMock('record-Opportunity-unsupported-entity-version-1');

        // Version 2 just has Name
        const version2Mock = getMock('record-Opportunity-unsupported-entity-version-2');

        const version2Config = {
            recordId: version1Mock.id,
            optionalFields: ['Opportunity.Unsupported.Name'],
        };

        const version1Config = {
            recordId: version1Mock.id,
            optionalFields: ['Opportunity.Unsupported.Name', 'Opportunity.Unsupported.OwnerId'],
        };

        const resolve = mockNetworkOnceDefer(version1Config, version1Mock);
        mockGetRecordNetwork(version2Config, version2Mock);

        // Attempt to load version 1
        const version1Elm = await setupElement(version1Config, RecordFields);

        // Attempt to load version 2
        const version2Elm = await setupElement(version2Config, RecordFields);

        // Version 2 should be loaded fine
        expect(version2Elm.pushCount()).toBe(1);
        expect(version2Elm.getWiredData()).toEqualSnapshotWithoutEtags(version2Mock);

        // Version 1 returns
        await resolve();

        expect(version1Elm.pushCount()).toBe(1);

        version1Mock.fields.Unsupported.value.fields.Name =
            version2Mock.fields.Unsupported.value.fields.Name;
        expect(version1Elm.getWiredData()).toEqualSnapshotWithoutEtags(version1Mock);
        // This test will fail if there is an extra XHR
    });
});
