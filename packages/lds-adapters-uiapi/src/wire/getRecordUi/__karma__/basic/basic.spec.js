import { clone, getMock as globalGetMock, setupElement } from 'test-util';
import {
    expireObjectInfo,
    expireRecords,
    expireLayoutUserState,
    extractRecordFields,
    LayoutMode,
    LayoutType,
    MASTER_RECORD_TYPE_ID,
    mockGetLayoutUserStateNetwork,
    mockGetObjectInfoNetwork,
    mockGetRecordNetwork,
    mockGetRecordUiNetwork,
} from 'uiapi-test-util';

import GetLayoutUserState from '../../../getLayoutUserState/__karma__/lwc/get-layout-user-state';
import RecordFields from '../../../getRecord/__karma__/lwc/record-fields';
import RecordUi from '../lwc/record-ui';
import ObjectInfo from '../../../getObjectInfo/__karma__/lwc/object-basic';

function getRecordIdFromMock(mock, index) {
    const recordKeys = Object.keys(mock.records);
    return index ? recordKeys[index] : recordKeys[0];
}

const MOCK_PREFIX = 'wire/getRecordUi/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

function updateRefreshRecord(record) {
    record.lastModifiedDate = new Date(
        new Date(record.lastModifiedDate).getTime() + 60 * 1000
    ).toISOString();
    record.weakEtag = record.weakEtag + 999;
}

describe('refresh', () => {
    it('should refresh recordUi', async () => {
        const mockRecordUiData = getMock('single-record-Account-layouttypes-Full-modes-View');
        const recordId = getRecordIdFromMock(mockRecordUiData);
        const recordFields = extractRecordFields(mockRecordUiData.records[recordId], {
            add: ['Account.Parent.Id', 'Account.Parent.Name'],
            omit: ['Account.Parent'],
        });

        const refreshMockUiData = getMock('single-record-Account-layouttypes-Full-modes-View');
        const refreshMockRecord = refreshMockUiData.records[recordId];
        updateRefreshRecord(refreshMockRecord);

        const config = {
            recordIds: recordId,
            layoutTypes: ['Full'],
            modes: ['View'],
            optionalFields: ['Account.Industry'],
        };

        mockGetRecordUiNetwork(config, [mockRecordUiData, refreshMockUiData]);
        mockGetRecordNetwork(
            { recordId, optionalFields: recordFields },
            refreshMockUiData.records[recordId]
        );

        const element = await setupElement(config, RecordUi);
        expect(element.pushCount()).toBe(1);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockRecordUiData);

        await element.refresh();
        expect(element.pushCount()).toBe(2);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(refreshMockUiData);
    });

    it('should refresh recordUi, record type id changes', async () => {
        const mockRecordUiData = getMock('single-record-Account-layouttypes-Full-modes-View');
        const recordId = getRecordIdFromMock(mockRecordUiData);
        const recordFields = extractRecordFields(mockRecordUiData.records[recordId], {
            add: ['Account.Parent.Id', 'Account.Parent.Name'],
            omit: ['Account.Parent'],
        });

        const refreshMockUiData = getMock('single-record-Account-layouttypes-Full-modes-View');
        const refreshMockRecord = refreshMockUiData.records[recordId];
        updateRefreshRecord(refreshMockRecord);

        // Update the record's recordTypeId
        const newRecordTypeId = '012000000000000BBB';
        refreshMockRecord.recordTypeId = newRecordTypeId;
        refreshMockRecord.recordTypeInfo = {
            available: true,
            defaultRecordTypeMapping: true,
            master: false,
            name: 'New Record Type',
            recordTypeId: newRecordTypeId,
        };

        // Update the recordUi layout for the new record type
        refreshMockUiData.layouts.Account[newRecordTypeId] = clone(
            refreshMockUiData.layouts.Account[MASTER_RECORD_TYPE_ID]
        );
        delete refreshMockUiData.layouts.Account[MASTER_RECORD_TYPE_ID];

        const config = {
            recordIds: recordId,
            layoutTypes: ['Full'],
            modes: ['View'],
            optionalFields: ['Account.Industry'],
        };

        mockGetRecordUiNetwork(config, [mockRecordUiData, refreshMockUiData]);
        mockGetRecordNetwork(
            { recordId, optionalFields: recordFields },
            refreshMockUiData.records[recordId]
        );

        const element = await setupElement(config, RecordUi);
        expect(element.pushCount()).toBe(1);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockRecordUiData);

        await element.refresh();
        expect(element.pushCount()).toBe(2);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(refreshMockUiData);
    });

    it('should refreshUi, lookup field null -> populated', async () => {
        const mockRecordUiData = getMock('single-record-Account-layouttypes-Full-modes-View');
        const recordId = getRecordIdFromMock(mockRecordUiData);

        const refreshMockUiData = getMock('single-record-Account-layouttypes-Full-modes-View');
        const refreshMockRecord = refreshMockUiData.records[recordId];
        updateRefreshRecord(refreshMockRecord);

        // Add mock lookup fields
        mockRecordUiData.records[recordId].fields.Contact__c = {
            displayValue: null,
            value: null,
        };

        refreshMockUiData.records[recordId].fields.Contact__c = {
            displayValue: null,
            value: '0033h000005X8gZAAS',
        };

        const recordFields = extractRecordFields(mockRecordUiData.records[recordId], {
            add: ['Account.Parent.Id', 'Account.Parent.Name'],
            omit: ['Account.Parent'],
        });
        const config = {
            recordIds: recordId,
            layoutTypes: ['Full'],
            modes: ['View'],
            optionalFields: ['Account.Industry'],
        };

        mockGetRecordUiNetwork(config, [mockRecordUiData, refreshMockUiData]);
        mockGetRecordNetwork(
            { recordId, optionalFields: recordFields },
            refreshMockUiData.records[recordId]
        );

        const element = await setupElement(config, RecordUi);
        expect(element.pushCount()).toBe(1);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockRecordUiData);

        await element.refresh();
        expect(element.pushCount()).toBe(2);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(refreshMockUiData);
    });

    it('should refreshUi, lookup field populated -> null', async () => {
        const mockRecordUiData = getMock('single-record-Account-layouttypes-Full-modes-View');
        const recordId = getRecordIdFromMock(mockRecordUiData);

        const refreshMockUiData = getMock('single-record-Account-layouttypes-Full-modes-View');
        const refreshMockRecord = refreshMockUiData.records[recordId];
        updateRefreshRecord(refreshMockRecord);

        // Add mock lookup fields
        mockRecordUiData.records[recordId].fields.Contact__c = {
            displayValue: null,
            value: '0033h000005X8gZAAS',
        };
        refreshMockUiData.records[recordId].fields.Contact__c = {
            displayValue: null,
            value: null,
        };

        const recordFields = extractRecordFields(mockRecordUiData.records[recordId], {
            add: ['Account.Parent.Id', 'Account.Parent.Name'],
            omit: ['Account.Parent'],
        });
        const config = {
            recordIds: recordId,
            layoutTypes: ['Full'],
            modes: ['View'],
            optionalFields: ['Account.Industry'],
        };

        mockGetRecordUiNetwork(config, [mockRecordUiData, refreshMockUiData]);
        mockGetRecordNetwork(
            { recordId, optionalFields: recordFields },
            refreshMockUiData.records[recordId]
        );

        const element = await setupElement(config, RecordUi);
        expect(element.pushCount()).toBe(1);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockRecordUiData);

        await element.refresh();
        expect(element.pushCount()).toBe(2);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(refreshMockUiData);
    });

    it('should refreshUi, but server returns 404', async () => {
        const mockRecordUiData = getMock('single-record-Account-layouttypes-Full-modes-View');
        const recordId = getRecordIdFromMock(mockRecordUiData);

        const mockError = {
            status: 404,
            statusText: 'Not Found',
            ok: false,
            body: [
                {
                    errorCode: 'NOT_FOUND',
                    message: 'The requested resource does not exist',
                },
            ],
        };

        const config = {
            recordIds: recordId,
            layoutTypes: ['Full'],
            modes: ['View'],
            optionalFields: ['Account.Industry'],
        };

        mockGetRecordUiNetwork(config, [
            mockRecordUiData,
            {
                reject: true,
                data: mockError,
            },
        ]);

        const element = await setupElement(config, RecordUi);
        expect(element.pushCount()).toBe(1);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockRecordUiData);

        try {
            await element.refresh();
        } catch (e) {
            expect(e).toEqual(mockError);
            expect(e).toBeImmutable();
        }
    });

    it('should refreshUi, but server returns 500', async () => {
        const mockRecordUiData = getMock('single-record-Account-layouttypes-Full-modes-View');
        const recordId = getRecordIdFromMock(mockRecordUiData);

        const config = {
            recordIds: recordId,
            layoutTypes: ['Full'],
            modes: ['View'],
            optionalFields: ['Account.Industry'],
        };

        const mockErrorResponse = {
            body: {},
            ok: false,
            status: 500,
            statusText: 'Server Error',
        };

        mockGetRecordUiNetwork(config, [
            mockRecordUiData,
            {
                reject: true,
                data: mockErrorResponse,
            },
        ]);

        const element = await setupElement(config, RecordUi);
        expect(element.pushCount()).toBe(1);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockRecordUiData);

        try {
            await element.refresh();
        } catch (e) {
            expect(e).toEqual(mockErrorResponse);
            expect(e).toBeImmutable();
        }
    });

    it('should automatically refreshUi when child object info is 404 ', async () => {
        const objectInfoError = {
            status: 404,
            statusText: 'Not Found',
            ok: false,
            body: getMock('objectInfo-error'),
        };
        const mockRecordUiData = getMock('single-record-Account-layouttypes-Full-modes-View');
        const recordId = getRecordIdFromMock(mockRecordUiData);
        const mockRecordUiDataChanged = getMock(
            'single-record-Account-layouttypes-Full-modes-View'
        );
        mockRecordUiDataChanged.objectInfos.Account.createable = false;

        const configRecordUi = {
            recordIds: recordId,
            layoutTypes: ['Full'],
            modes: ['View'],
            optionalFields: ['Account.Industry'],
        };
        const configObjectInfo = {
            objectApiName: 'Account',
        };

        mockGetRecordUiNetwork(configRecordUi, [mockRecordUiData, mockRecordUiDataChanged]);
        mockGetObjectInfoNetwork(configObjectInfo, {
            reject: true,
            data: objectInfoError,
        });

        // Get Record Ui.
        const elementRecordUi = await setupElement(configRecordUi, RecordUi);
        expect(elementRecordUi.pushCount()).toBe(1);
        expect(elementRecordUi.getWiredData()).toEqualSnapshotWithoutEtags(mockRecordUiData);

        expireObjectInfo();

        // Request Object Info with 404 response
        const elementObjectInfo = await setupElement(configObjectInfo, ObjectInfo);
        expect(elementObjectInfo.pushCount()).toBe(1);
        expect(elementObjectInfo.getWiredData()).toBeUndefined();
        expect(elementObjectInfo.getWiredError()).toEqual(objectInfoError);

        // Verify we made another call and got fresh data.
        expect(elementRecordUi.pushCount()).toBe(2);
        expect(elementRecordUi.getWiredData()).toEqualSnapshotWithoutEtags(mockRecordUiDataChanged);
    });
    it('should re-emit fresh value when dependent layout user state changes', async () => {
        const mockRecordUiData = getMock('single-record-Account-layouttypes-Full-modes-View');
        const recordId = getRecordIdFromMock(mockRecordUiData);
        const layoutUserStateId = Object.keys(mockRecordUiData.layoutUserStates)[0];
        const mockLayoutUserStateDataUpdated = clone(
            mockRecordUiData.layoutUserStates[layoutUserStateId]
        );
        const sectionUserStateId = Object.keys(mockLayoutUserStateDataUpdated.sectionUserStates)[0];
        mockLayoutUserStateDataUpdated.sectionUserStates[sectionUserStateId].collapsed =
            !mockLayoutUserStateDataUpdated.sectionUserStates[sectionUserStateId].collapsed;

        const configRecordUi = {
            recordIds: recordId,
            layoutTypes: ['Full'],
            modes: ['View'],
            optionalFields: ['Account.Industry'],
        };
        const configLayoutUserState = {
            objectApiName: 'Account',
            layoutType: LayoutType.Full,
            mode: LayoutMode.View,
            recordTypeId: MASTER_RECORD_TYPE_ID,
        };

        mockGetRecordUiNetwork(configRecordUi, mockRecordUiData);
        mockGetLayoutUserStateNetwork(configLayoutUserState, mockLayoutUserStateDataUpdated);

        // Get record ui.
        const elementRecordUi = await setupElement(configRecordUi, RecordUi);
        expect(elementRecordUi.pushCount()).toBe(1);
        expect(elementRecordUi.getWiredData()).toEqualSnapshotWithoutEtags(mockRecordUiData);

        expireLayoutUserState();

        // Fetch updated layout user state with changed data
        const elementLayoutUserState = await setupElement(
            configLayoutUserState,
            GetLayoutUserState
        );
        expect(elementLayoutUserState.pushCount()).toBe(1);
        expect(elementLayoutUserState.getWiredData()).toEqualSnapshotWithoutEtags(
            mockLayoutUserStateDataUpdated
        );

        // Validate record ui emitted again with changed record data.
        mockRecordUiData.layoutUserStates[layoutUserStateId] = mockLayoutUserStateDataUpdated;
        expect(elementRecordUi.pushCount()).toBe(2);
        expect(elementRecordUi.getWiredData()).toEqualSnapshotWithoutEtags(mockRecordUiData);
    });

    it('should re-emit fresh value when dependent record changes', async () => {
        const mockRecordUiData = getMock('single-record-Account-layouttypes-Full-modes-View');
        const recordId = getRecordIdFromMock(mockRecordUiData);
        const recordFields = extractRecordFields(mockRecordUiData.records[recordId]);

        const mockRecordDataUpdated = clone(mockRecordUiData.records[recordId]);
        mockRecordDataUpdated.fields.Name.value =
            mockRecordDataUpdated.fields.Name.value + ' Updated';

        const configRecordUi = {
            recordIds: recordId,
            layoutTypes: ['Full'],
            modes: ['View'],
            optionalFields: ['Account.Industry'],
        };
        const configRecord = {
            recordId: mockRecordDataUpdated.id,
            fields: recordFields,
        };

        mockGetRecordUiNetwork(configRecordUi, mockRecordUiData);
        mockGetRecordNetwork(configRecord, mockRecordDataUpdated);

        // Get record ui.
        const elementRecordUi = await setupElement(configRecordUi, RecordUi);
        expect(elementRecordUi.pushCount()).toBe(1);
        expect(elementRecordUi.getWiredData()).toEqualSnapshotWithoutEtags(mockRecordUiData);

        expireRecords();

        // Fetch new record with changed data
        const elementRecord = await setupElement(configRecord, RecordFields);
        expect(elementRecord.pushCount()).toBe(1);
        expect(elementRecord.getWiredData()).toEqualSnapshotWithoutEtags(mockRecordDataUpdated);

        // Validate record ui emitted again with changed record data.
        mockRecordUiData.records[recordId] = mockRecordDataUpdated;
        expect(elementRecordUi.pushCount()).toBe(2);
        expect(elementRecordUi.getWiredData()).toEqualSnapshotWithoutEtags(mockRecordUiData);
    });

    it('should re-emit fresh value when two records change', async () => {
        const mockRecordUiData = getMock('multiple-record-Account-layouttypes-Full-modes-View');
        const recordIdOne = getRecordIdFromMock(mockRecordUiData, 0);
        const recordIdTwo = getRecordIdFromMock(mockRecordUiData, 1);
        const recordFieldsOne = extractRecordFields(mockRecordUiData.records[recordIdOne], {
            add: ['Account.Parent.Id', 'Account.Parent.Name'],
            omit: ['Account.Parent'],
        });

        const refreshMockUiData = getMock('multiple-record-Account-layouttypes-Full-modes-View');
        const refreshMockRecordOne = refreshMockUiData.records[recordIdOne];
        const refreshMockRecordTwo = refreshMockUiData.records[recordIdTwo];
        updateRefreshRecord(refreshMockRecordOne);
        updateRefreshRecord(refreshMockRecordTwo);

        const configRecordUi = {
            recordIds: [recordIdOne, recordIdTwo].sort(),
            layoutTypes: ['Full'],
            modes: ['View'],
            optionalFields: ['Account.Industry'],
        };

        mockGetRecordUiNetwork(configRecordUi, [mockRecordUiData, refreshMockUiData]);
        mockGetRecordNetwork(
            { recordId: recordIdOne, optionalFields: recordFieldsOne },
            refreshMockRecordOne
        );
        mockGetRecordNetwork(
            { recordId: recordIdTwo, optionalFields: recordFieldsOne },
            refreshMockRecordTwo
        );

        // Get record ui.
        const elementRecordUi = await setupElement(configRecordUi, RecordUi);
        expect(elementRecordUi.pushCount()).toBe(1);
        expect(elementRecordUi.getWiredData()).toEqualSnapshotWithoutEtags(mockRecordUiData);

        // Refresh record ui.
        await elementRecordUi.refresh();
        expect(elementRecordUi.pushCount()).toBe(2);
        expect(elementRecordUi.getWiredData()).toEqualSnapshotWithoutEtags(refreshMockUiData);
    });
});

describe('Non-layoutable entities', () => {
    it('should emit when layout config is empty', async () => {
        const mock = getMock('record-ui-non-layoutable');
        const recordId = getRecordIdFromMock(mock);
        const config = {
            recordIds: recordId,
            layoutTypes: ['Full'],
            modes: ['View'],
        };

        mockGetRecordUiNetwork(config, mock);

        const element = await setupElement(config, RecordUi);
        expect(element.pushCount()).toBe(1);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });
});
