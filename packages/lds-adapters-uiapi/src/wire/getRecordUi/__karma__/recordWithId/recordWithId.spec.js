import {
    getMock as globalGetMock,
    clone,
    setupElement,
    updateElement,
    flushPromises,
} from 'test-util';

import {
    MASTER_RECORD_TYPE_ID,
    expireLayout,
    expireLayoutUserState,
    expireObjectInfo,
    expireRecords,
    expireRecordUi,
    extractRecordFields,
    getTrackedFieldLeafNodeIdOnly,
    mockDeleteRecordNetwork,
    mockGetRecordNetwork,
    mockGetRecordDeepParamsNetwork,
    mockGetRecordUiNetwork,
    mockUpdateRecordNetwork,
} from 'uiapi-test-util';
import { updateRecord } from 'lds-adapters-uiapi';
import { karmaNetworkAdapter } from 'lds-engine';

import GetLayout from '../../../../raml-artifacts/adapters/getLayout/__karma__/lwc/get-layout';
import RecordFields from '../../../getRecord/__karma__/lwc/record-fields';
import ObjectInfo from '../../../getObjectInfo/__karma__/lwc/object-basic';
import RecordUi from '../lwc/record-ui';

const MOCK_PREFIX = 'wire/getRecordUi/__karma__/recordWithId/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

function getRecordIdFromMock(mock) {
    return Object.keys(mock.records)[0];
}

describe('single recordId - basic', () => {
    it('should make correct HTTP request with layoutTypes "Full" and mode "View"', async () => {
        const mockData = getMock('single-record-Account-layouttypes-Full-modes-View');
        const config = {
            recordIds: getRecordIdFromMock(mockData),
            layoutTypes: ['Full'],
            modes: ['View'],
        };
        mockGetRecordUiNetwork(config, mockData);

        const wireA = await setupElement(config, RecordUi);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
    });

    it('should make correct HTTP request with layoutTypes "Full", mode "View" and optionalFields "Opportunity.IsDeleted"', async () => {
        const mockData = getMock(
            'single-record-Opportunity-layouttypes-Full-modes-View-optionalFields-IsDeleted'
        );
        const config = {
            recordIds: getRecordIdFromMock(mockData),
            layoutTypes: ['Full'],
            modes: ['View'],
            optionalFields: ['Opportunity.IsDeleted'],
        };
        mockGetRecordUiNetwork(config, mockData);

        const wireA = await setupElement(config, RecordUi);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
    });

    it('does not make an extra http request when getRecordUi with optional fields is requested followed by getRecord with same required fields', async () => {
        const mockData = getMock(
            'single-record-Opportunity-layouttypes-Full-modes-View-optionalFields-IsDeleted-OrderNumber__c'
        );
        const recordId = getRecordIdFromMock(mockData);
        const config = {
            recordIds: recordId,
            layoutTypes: ['Full'],
            modes: ['View'],
            optionalFields: ['Opportunity.IsDeleted', 'Opportunity.OrderNumber__c'],
        };
        mockGetRecordUiNetwork(config, mockData);

        const wireA = await setupElement(config, RecordUi);

        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mockData);

        await setupElement(
            {
                recordId,
                fields: ['Opportunity.IsDeleted', 'Opportunity.OrderNumber__c'],
            },
            RecordFields
        );

        // mockNetworkOnce ensures at most one network request was made
    });

    it('does not make an extra http request when getRecordUi request is followed by getRecord with same fields', async () => {
        const mockData = getMock(
            'single-record-Opportunity-layouttypes-Full-modes-View-optionalFields-IsDeleted-OrderNumber__c'
        );
        const recordId = getRecordIdFromMock(mockData);
        const config = {
            recordIds: recordId,
            layoutTypes: ['Full'],
            modes: ['View'],
        };
        mockGetRecordUiNetwork(config, mockData);

        const wireA = await setupElement(config, RecordUi);

        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mockData);

        const recordFields = extractRecordFields(mockData.records[recordId]);
        await setupElement(
            {
                recordId,
                fields: recordFields,
            },
            RecordFields
        );

        // the test utilities have built in assertions to verify we did not
        // make any unmocked HTTP requests
    });

    it('should not request previously requested optional fields when getRecordUi is called with optionalFields', async () => {
        const mockDataIsDeleted = getMock(
            'single-record-Opportunity-layouttypes-Full-modes-View-optionalFields-IsDeleted-OrderNumber__c'
        );
        const recordId = getRecordIdFromMock(mockDataIsDeleted);
        const baseConfig = {
            recordIds: recordId,
            layoutTypes: ['Full'],
            modes: ['View'],
            optionalFields: ['Opportunity.IsDeleted'],
        };

        mockGetRecordUiNetwork(baseConfig, mockDataIsDeleted);
        await setupElement(baseConfig, RecordUi);

        const mockDataIsDeletedOrderC = getMock(
            'single-record-Opportunity-layouttypes-Full-modes-View-optionalFields-IsDeleted-OrderNumber__c'
        );
        const deletedConfig = {
            ...baseConfig,
            optionalFields: ['Opportunity.OrderNumber__c'],
        };
        mockGetRecordUiNetwork(deletedConfig, mockDataIsDeletedOrderC);
        await setupElement(deletedConfig, RecordUi);

        // it should have made request for Opportunity.OrderNumber__c, and nothing else
        expect(karmaNetworkAdapter.secondCall.args[0].queryParams.optionalFields).toEqual([
            'Opportunity.OrderNumber__c',
        ]);
    });

    it('dedupes optionalFields before making http request', async () => {
        const mockData = getMock(
            'single-record-Opportunity-layouttypes-Full-modes-View-optionalFields-IsDeleted'
        );
        const config = {
            recordIds: getRecordIdFromMock(mockData),
            layoutTypes: ['Full'],
            modes: ['View'],
            optionalFields: ['Opportunity.IsDeleted'],
        };
        mockGetRecordUiNetwork(config, mockData);

        await setupElement(
            {
                ...config,
                optionalFields: ['Opportunity.IsDeleted', 'Opportunity.IsDeleted'],
            },
            RecordUi
        );

        const expectedParams = { ...config };
        delete expectedParams.recordIds;
        expect(karmaNetworkAdapter.firstCall.args[0].queryParams).toEqual(expectedParams);
    });

    it("verifies the record ui observable emits an error when the record ui's dependent record is deleted", async () => {
        const mock = getMock('single-record-Account-layouttypes-Full-modes-View');
        const recordId = getRecordIdFromMock(mock);
        const params = {
            recordIds: recordId,
            layoutTypes: ['Full'],
            modes: ['View'],
        };
        const mockError = {
            ok: false,
            status: 404,
            statusText: 'NOT_FOUND',
            body: [
                {
                    errorCode: 'NOT_FOUND',
                    message: 'The requested resource does not exist',
                },
            ],
        };
        mockGetRecordUiNetwork(params, [
            mock,
            {
                reject: true,
                data: mockError,
            },
        ]);

        mockDeleteRecordNetwork(recordId);

        const elm = await setupElement(params, RecordUi);

        expect(elm.pushCount()).toBe(1);

        await elm.deleteRecord(recordId);
        await flushPromises();
        expect(elm.pushCount()).toBe(2);
        expect(elm.getWiredError()).toEqual(mockError);
        expect(elm.getWiredError()).toBeImmutable();
        expect(elm.getWiredData()).toBeUndefined();
    });

    it('should not emit data if the data from network is not changed', async () => {
        const mockRecordUiData = getMock(
            'single-record-Opportunity-layouttypes-Compact-modes-View-optionalFields-IsDeleted'
        );
        const recordId = getRecordIdFromMock(mockRecordUiData);
        const mockRecordData = mockRecordUiData.records[recordId];

        const recordUiConfig = {
            recordIds: recordId,
            layoutTypes: ['Compact'],
            modes: ['View'],
        };
        mockGetRecordUiNetwork(recordUiConfig, mockRecordUiData);

        const recordConfig = {
            recordId: recordId,
            fields: extractRecordFields(mockRecordData),
        };
        mockGetRecordNetwork(recordConfig, mockRecordData);

        const wireA = await setupElement(recordUiConfig, RecordUi);
        expireRecords();
        await setupElement(recordConfig, RecordFields);

        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mockRecordUiData);
        expect(wireA.pushCount()).toBe(1);
    });

    it('does not re-request optional field when server does not return optional field on first request', async () => {
        const mockData = getMock('single-record-Account-layouttypes-Full-modes-View');
        const recordId = getRecordIdFromMock(mockData);
        const config = {
            recordIds: recordId,
            layoutTypes: ['Full'],
            modes: ['View'],
            optionalFields: ['Account.Foo'],
        };
        mockGetRecordUiNetwork(config, mockData);

        const wireA = await setupElement(config, RecordUi);

        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mockData);

        const elm = await setupElement(
            {
                recordId,
                optionalFields: ['Account.Foo'],
            },
            RecordFields
        );

        const record = mockData.records[recordId];
        const expected = {
            ...record,
            fields: {},
        };

        // Expected record has no fields because the optional field isn't resolvable
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(expected);
    });
});

describe('single recordId - caching', () => {
    it('emits data from cache when cached data is available', async () => {
        const mockData = getMock('single-record-Account-layouttypes-Full-modes-View');
        const config = {
            recordIds: getRecordIdFromMock(mockData),
            layoutTypes: ['Full'],
            modes: ['View'],
        };
        mockGetRecordUiNetwork(config, mockData);

        // populate cache
        const wireA = await setupElement(config, RecordUi);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mockData);

        const wireB = await setupElement(config, RecordUi);
        // wireA should not have received new data
        expect(wireA.pushCount()).toBe(1);

        expect(wireB.pushCount()).toBe(1);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
    });

    it('fetches data from network when cached data is expired', async () => {
        const mockData = getMock('single-record-Account-layouttypes-Full-modes-View');
        const config = {
            recordIds: getRecordIdFromMock(mockData),
            layoutTypes: ['Full'],
            modes: ['View'],
        };
        mockGetRecordUiNetwork(config, [mockData, mockData]);

        // populate cache
        await setupElement(config, RecordUi);
        // expire cache
        expireRecordUi();
        const wireB = await setupElement(config, RecordUi);

        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
    });

    it('does not make extra HTTP request when optional fields are passed in different order', async () => {
        const mockData = getMock(
            'single-record-Opportunity-layouttypes-Full-modes-View-optionalFields-IsDeleted-OrderNumber__c'
        );
        const config = {
            recordIds: getRecordIdFromMock(mockData),
            layoutTypes: ['Full'],
            modes: ['View'],
            optionalFields: ['Opportunity.IsDeleted', 'Opportunity.OrderNumber__c'],
        };
        mockGetRecordUiNetwork(config, mockData);

        // first request
        const wireA = await setupElement(config, RecordUi);

        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mockData);

        // second request, should not make HTTP request because we have all the data
        await setupElement(
            {
                recordIds: getRecordIdFromMock(mockData),
                layoutTypes: ['Full'],
                modes: ['View'],
                optionalFields: ['Opportunity.OrderNumber__c', 'Opportunity.IsDeleted'],
            },
            RecordUi
        );

        // Verify the correct data was emitted to wireB
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
    });
});

describe('single recordId - record', () => {
    it('caches record data', async () => {
        const mockRecordUiData = getMock('single-record-Account-layouttypes-Full-modes-View');
        const recordId = getRecordIdFromMock(mockRecordUiData);
        const recordUiConfig = {
            recordIds: recordId,
            layoutTypes: ['Full'],
            modes: ['View'],
        };
        mockGetRecordUiNetwork(recordUiConfig, mockRecordUiData);

        const mockRecordData = mockRecordUiData.records[recordId];
        const recordConfig = {
            recordId,
            fields: extractRecordFields(mockRecordData),
        };

        // populate record-ui cache
        const wireA = await setupElement(recordUiConfig, RecordUi);
        // the data should be emitted from cache
        const wireB = await setupElement(recordConfig, RecordFields);

        expect(wireA.pushCount()).toBe(1);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(mockRecordData);
    });

    it('fetches data from network when cached record is expired', async () => {
        const mockData = getMock(
            'single-record-Opportunity-layouttypes-Full-modes-View-optionalFields-IsDeleted'
        );
        const recordId = getRecordIdFromMock(mockData);
        const config = {
            recordIds: recordId,
            layoutTypes: ['Full'],
            modes: ['View'],
        };
        mockGetRecordUiNetwork(config, [mockData, mockData]);

        // populate record-ui cache
        const wireA = await setupElement(config, RecordUi);

        // expire record
        expireRecords();
        const wireB = await setupElement(config, RecordUi);

        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
        // same record-ui data returns from network, no push to wireA
        expect(wireA.pushCount()).toBe(1);
    });

    it('emits updated record-ui data when changed record is fetched', async () => {
        const mockData = getMock(
            'single-record-Opportunity-layouttypes-Full-modes-View-optionalFields-CloneSourceId'
        );

        const recordId = getRecordIdFromMock(mockData);
        const config = {
            recordIds: recordId,
            layoutTypes: ['Full'],
            modes: ['View'],
            optionalFields: ['Opportunity.CloneSourceId'],
        };
        mockGetRecordUiNetwork(config, mockData);

        const cloneSourceId = '1234567';
        const updatedMockData = getMock(
            'single-record-Opportunity-layouttypes-Full-modes-View-optionalFields-CloneSourceId'
        );
        updatedMockData.records[recordId].fields.CloneSourceId.value = cloneSourceId;

        // updated record
        const mockRecordData = getMock('record-Opportunity-fields-Opportunity.CloneSourceId');
        mockRecordData.fields.CloneSourceId.value = cloneSourceId;

        const recordConfig = {
            recordId,
            fields: ['Opportunity.CloneSourceId'],
        };
        mockGetRecordNetwork(recordConfig, mockRecordData);

        // populate record-ui cache
        const wireA = await setupElement(config, RecordUi);

        // only expire record
        expireRecords();
        const wireB = await setupElement(recordConfig, RecordFields);

        expect(wireA.pushCount()).toBe(2);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(updatedMockData);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(mockRecordData);
    });

    it('should not emit data when getRecord requests field that is not returned by getRecordUi request', async () => {
        const mockRecordData = getMock('record-Opportunity-fields-Opportunity.CloneSourceId');
        const recordId = mockRecordData.id;

        const mockRecordUiData = getMock(
            'single-record-Opportunity-layouttypes-Full-modes-View-optionalFields-IsDeleted'
        );
        const recordUiConfig = {
            recordIds: recordId,
            layoutTypes: ['Full'],
            modes: ['View'],
        };
        mockGetRecordUiNetwork(recordUiConfig, mockRecordUiData);

        const recordConfig = {
            recordId: recordId,
            fields: ['Opportunity.CloneSourceId'],
        };
        mockGetRecordNetwork(recordConfig, mockRecordData);

        const wireA = await setupElement(recordUiConfig, RecordUi);
        const wireB = await setupElement(recordConfig, RecordFields);

        expect(wireA.pushCount()).toBe(1);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(mockRecordData);
    });
});

describe('single recordId - object info', () => {
    it('caches object info data', async () => {
        const mockRecordUiData = getMock('single-record-Account-layouttypes-Full-modes-View');
        const recordId = getRecordIdFromMock(mockRecordUiData);
        const recordUiConfig = {
            recordIds: recordId,
            layoutTypes: ['Full'],
            modes: ['View'],
        };
        mockGetRecordUiNetwork(recordUiConfig, mockRecordUiData);

        const mockObjectInfoData = mockRecordUiData.objectInfos.Account;
        const objectInfoConfig = { objectApiName: 'Account' };

        // populate record-ui cache
        const wireA = await setupElement(recordUiConfig, RecordUi);
        // the data should be emitted from cache
        const wireB = await setupElement(objectInfoConfig, ObjectInfo);

        expect(wireA.pushCount()).toBe(1);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(mockObjectInfoData);
    });

    it('fetches record-ui data from network when object info is expired', async () => {
        const mockData = getMock(
            'single-record-Opportunity-layouttypes-Compact-modes-View-optionalFields-IsDeleted'
        );
        const config = {
            recordIds: getRecordIdFromMock(mockData),
            layoutTypes: ['Compact'],
            modes: ['View'],
        };

        const updatedMockData = getMock(
            'single-record-Opportunity-layouttypes-Compact-modes-View-optionalFields-IsDeleted'
        );
        // eTag is a integrity field of ObjectInfo
        updatedMockData.objectInfos.Account.eTag = '12345678123456781234567812345678';

        mockGetRecordUiNetwork(config, [mockData, updatedMockData]);

        const wireA = await setupElement(config, RecordUi);
        expireObjectInfo();
        const wireB = await setupElement(config, RecordUi);

        expect(wireA.pushCount()).toBe(2);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(updatedMockData);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(updatedMockData);
    });

    it('emits updated record-ui data when object info gets changed', async () => {
        const mockData = getMock(
            'single-record-Opportunity-layouttypes-Compact-modes-View-optionalFields-IsDeleted'
        );
        const config = {
            recordIds: getRecordIdFromMock(mockData),
            layoutTypes: ['Compact'],
            modes: ['View'],
        };

        const updatedMockData = getMock(
            'single-record-Opportunity-layouttypes-Compact-modes-View-optionalFields-IsDeleted'
        );
        // eTag is a integrity field of ObjectInfo
        updatedMockData.objectInfos.Account.eTag = '12345678123456781234567812345678';

        mockGetRecordUiNetwork(config, [mockData, updatedMockData]);

        const wireA = await setupElement(config, RecordUi);
        expireRecordUi();
        const wireB = await setupElement(config, RecordUi);

        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(updatedMockData);
        expect(wireA.pushCount()).toBe(2);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(updatedMockData);
    });
});

describe('single recordId - layouts', () => {
    it('caches layouts data', async () => {
        const mockRecordUiData = getMock('single-record-Account-layouttypes-Full-modes-View');
        const recordId = getRecordIdFromMock(mockRecordUiData);
        const recordUiConfig = {
            recordIds: recordId,
            layoutTypes: ['Full'],
            modes: ['View'],
        };
        mockGetRecordUiNetwork(recordUiConfig, mockRecordUiData);

        const objectApiName = 'Account';
        const layoutType = 'Full';
        const mode = 'View';
        const mockLayoutData =
            mockRecordUiData.layouts[objectApiName][MASTER_RECORD_TYPE_ID][layoutType][mode];
        const layoutConfig = {
            objectApiName,
            layoutType,
            mode,
            recordTypeId: MASTER_RECORD_TYPE_ID,
        };

        // populate record-ui cache
        const wireA = await setupElement(recordUiConfig, RecordUi);
        // the data should be emitted from cache
        const wireB = await setupElement(layoutConfig, GetLayout);

        expect(wireA.pushCount()).toBe(1);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(mockLayoutData);
    });

    it('fetches record-ui data from network when layout is expired', async () => {
        const mockData = getMock('single-record-Account-layouttypes-Full-modes-View');
        const config = {
            recordIds: getRecordIdFromMock(mockData),
            layoutTypes: ['Full'],
            modes: ['View'],
        };

        const updatedMockData = getMock('single-record-Account-layouttypes-Full-modes-View');
        // eTag is a integrity field of layout
        updatedMockData.layouts.Account[MASTER_RECORD_TYPE_ID].Full.View.eTag =
            '12345678123456781234567812345678';

        mockGetRecordUiNetwork(config, [mockData, updatedMockData]);

        const wireA = await setupElement(config, RecordUi);
        expireLayout();
        const wireB = await setupElement(config, RecordUi);

        expect(wireA.pushCount()).toBe(2);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(updatedMockData);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(updatedMockData);
    });

    it('emits updated record-ui data when layout is changed', async () => {
        const mockData = getMock('single-record-Account-layouttypes-Full-modes-View');
        const config = {
            recordIds: getRecordIdFromMock(mockData),
            layoutTypes: ['Full'],
            modes: ['View'],
        };

        const updatedMockData = getMock('single-record-Account-layouttypes-Full-modes-View');
        // eTag is a integrity field of ObjectInfo
        updatedMockData.objectInfos.Account.eTag = '12345678123456781234567812345678';

        mockGetRecordUiNetwork(config, [mockData, updatedMockData]);

        const wireA = await setupElement(config, RecordUi);
        expireRecordUi();
        const wireB = await setupElement(config, RecordUi);

        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(updatedMockData);
        expect(wireA.pushCount()).toBe(2);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(updatedMockData);
    });
});

describe('single recordId - layout user state', () => {
    it('fetches data from network when cached layout user state is expired', async () => {
        const mockData = getMock('single-record-Account-layouttypes-Full-modes-View');
        const recordId = getRecordIdFromMock(mockData);
        const config = {
            recordIds: recordId,
            layoutTypes: ['Full'],
            modes: ['View'],
        };

        const updatedMockData = getMock('single-record-Account-layouttypes-Full-modes-View');
        const sectionUserStates = Object.entries(updatedMockData.layoutUserStates)[0][1]
            .sectionUserStates;
        Object.entries(sectionUserStates)[0][1].collapsed = true;

        mockGetRecordUiNetwork(config, [mockData, updatedMockData]);

        const wireA = await setupElement(config, RecordUi);
        expireLayoutUserState();
        const wireB = await setupElement(config, RecordUi);

        expect(wireA.pushCount()).toBe(2);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(updatedMockData);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(updatedMockData);
    });

    it('emits updated record-ui data when layout user state gets changed', async () => {
        const mockData = getMock('single-record-Account-layouttypes-Full-modes-View');
        const recordId = getRecordIdFromMock(mockData);
        const config = {
            recordIds: recordId,
            layoutTypes: ['Full'],
            modes: ['View'],
        };

        const updatedMockData = getMock('single-record-Account-layouttypes-Full-modes-View');
        const sectionUserStates = Object.entries(updatedMockData.layoutUserStates)[0][1]
            .sectionUserStates;
        Object.entries(sectionUserStates)[0][1].collapsed = true;

        mockGetRecordUiNetwork(config, [mockData, updatedMockData]);

        const wireA = await setupElement(config, RecordUi);
        expireRecordUi();
        const wireB = await setupElement(config, RecordUi);

        expect(wireA.pushCount()).toBe(2);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(updatedMockData);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(updatedMockData);
    });
});

describe('single recordId - layout types', () => {
    it('should make http request for compact layout type following request for full layout type', async () => {
        const mockDataCompact = getMock(
            'single-record-Opportunity-layouttypes-Compact-modes-View-optionalFields-IsDeleted'
        );
        const recordId = getRecordIdFromMock(mockDataCompact);
        const compactConfig = {
            recordIds: recordId,
            layoutTypes: ['Compact'],
            modes: ['View'],
            optionalFields: ['Opportunity.IsDeleted'],
        };

        const mockDataFull = getMock(
            'single-record-Opportunity-layouttypes-Full-modes-View-optionalFields-IsDeleted'
        );

        mockGetRecordUiNetwork(compactConfig, mockDataCompact);
        const fullConfig = {
            recordIds: recordId,
            layoutTypes: ['Full'],
            modes: ['View'],
            optionalFields: ['Opportunity.IsDeleted'],
        };
        mockGetRecordUiNetwork(fullConfig, mockDataFull);

        await setupElement(fullConfig, RecordUi);
        const wireB = await setupElement(compactConfig, RecordUi);

        // Verify the correct data was emitted to wireB
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(mockDataCompact);
    });

    it('should make http request for full layout type following request for compact layout type', async () => {
        const mockDataCompact = getMock(
            'single-record-Opportunity-layouttypes-Compact-modes-View-optionalFields-IsDeleted'
        );
        const recordId = getRecordIdFromMock(mockDataCompact);
        const compactConfig = {
            recordIds: recordId,
            layoutTypes: ['Compact'],
            modes: ['View'],
            optionalFields: ['Opportunity.IsDeleted'],
        };
        mockGetRecordUiNetwork(compactConfig, mockDataCompact);

        const mockDataFull = getMock(
            'single-record-Opportunity-layouttypes-Full-modes-View-optionalFields-IsDeleted'
        );

        const expectedOptionalFields = extractRecordFields(mockDataCompact.records[recordId]);
        const fullConfig = {
            recordIds: recordId,
            layoutTypes: ['Full'],
            modes: ['View'],
            optionalFields: expectedOptionalFields,
        };
        mockGetRecordUiNetwork(fullConfig, mockDataFull);

        await setupElement(compactConfig, RecordUi);
        const wireB = await setupElement(fullConfig, RecordUi);

        // Verify the correct data was emitted to wireB
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(mockDataFull);
    });

    it('should make correct HTTP request when single recordId is present', async () => {
        const mockData = getMock(
            'single-record-Account-layouttypes-Full-Compact-modes-Create,Edit,View'
        );
        const config = {
            recordIds: getRecordIdFromMock(mockData),
            layoutTypes: ['Compact', 'Full'],
            modes: ['Create', 'Edit', 'View'],
        };
        mockGetRecordUiNetwork(config, mockData);

        const wireA = await setupElement(config, RecordUi);

        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
    });

    it('should be a cache miss when Compact layout is requested after Full and Compat', async () => {
        const mockData = getMock(
            'single-record-Account-layouttypes-Full-Compact-modes-Create,Edit,View'
        );
        const config = {
            recordIds: getRecordIdFromMock(mockData),
            layoutTypes: ['Compact', 'Full'],
            modes: ['Create', 'Edit', 'View'],
        };
        mockGetRecordUiNetwork(config, mockData);

        const compactMock = getMock(
            'single-record-Account-layouttypes-Compact-modes-Create,Edit,View'
        );
        const compatConfig = {
            ...config,
            layoutTypes: ['Compact'],
        };
        mockGetRecordUiNetwork(compatConfig, compactMock);

        const wireA = await setupElement(config, RecordUi);

        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mockData);

        const wireB = await setupElement(compatConfig, RecordUi);
        expect(wireB.pushCount()).toBe(1);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(compactMock);
    });
});

describe('single recordId - multiple modes', () => {
    it('should be a cache miss when View and Create modes are requested after View', async () => {
        const mockViewData = getMock('single-record-Account-layouttypes-Full-modes-View');
        const recordId = getRecordIdFromMock(mockViewData);
        const viewConfig = {
            recordIds: recordId,
            layoutTypes: ['Full'],
            modes: ['View'],
        };
        mockGetRecordUiNetwork(viewConfig, mockViewData);

        const mockViewCreateData = getMock(
            'single-record-Account-layouttypes-Full-modes-Create,View'
        );
        const viewCreateConfig = {
            recordIds: recordId,
            layoutTypes: ['Full'],
            modes: ['Create', 'View'],
        };

        mockGetRecordUiNetwork(viewCreateConfig, mockViewCreateData);

        const wireA = await setupElement(viewConfig, RecordUi);
        const wireB = await setupElement(viewCreateConfig, RecordUi);

        // Verify the correct data was emitted to wireB
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(mockViewCreateData);

        // Verify that wireA did not receive any new data
        expect(wireA.pushCount()).toBe(1);
    });

    it('should be a cache miss when View mode is requested after Create, Edit, View', async () => {
        const mockData = getMock('single-record-Account-layouttypes-Full-modes-Create,Edit,View');
        const config = {
            recordIds: getRecordIdFromMock(mockData),
            layoutTypes: ['Full'],
            modes: ['Create', 'Edit', 'View'],
        };
        mockGetRecordUiNetwork(config, mockData);

        const viewModeMock = getMock('single-record-Account-layouttypes-Full-modes-View');
        const viewModeConfig = {
            ...config,
            modes: ['View'],
        };
        mockGetRecordUiNetwork(viewModeConfig, viewModeMock);

        const wireA = await setupElement(config, RecordUi);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mockData);

        const wireB = await setupElement(viewModeConfig, RecordUi);
        expect(wireB.pushCount()).toBe(1);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(viewModeMock);
    });

    it('should be a cache miss when Edit mode is requested after Create, Edit, View', async () => {
        const mockData = getMock('single-record-Account-layouttypes-Full-modes-Create,Edit,View');
        const config = {
            recordIds: getRecordIdFromMock(mockData),
            layoutTypes: ['Full'],
            modes: ['Create', 'Edit', 'View'],
        };
        mockGetRecordUiNetwork(config, mockData);

        const editModeMock = getMock('single-record-Account-layouttypes-Full-modes-Edit');
        const editModeConfig = {
            ...config,
            modes: ['Edit'],
        };
        mockGetRecordUiNetwork(editModeConfig, editModeMock);

        const wireA = await setupElement(config, RecordUi);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mockData);

        const wireB = await setupElement(editModeConfig, RecordUi);
        expect(wireB.pushCount()).toBe(1);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(editModeMock);
    });

    it('should be a cache miss when Create mode is requested after Create, Edit, View', async () => {
        const mockData = getMock('single-record-Account-layouttypes-Full-modes-Create,Edit,View');
        const config = {
            recordIds: getRecordIdFromMock(mockData),
            layoutTypes: ['Full'],
            modes: ['Create', 'Edit', 'View'],
        };
        mockGetRecordUiNetwork(config, mockData);

        const createModeMockData = getMock('single-record-Account-layouttypes-Full-modes-Create');
        const createModeConfig = {
            ...config,
            modes: ['Create'],
        };
        mockGetRecordUiNetwork(createModeConfig, createModeMockData);

        const wireA = await setupElement(config, RecordUi);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mockData);

        const wireB = await setupElement(createModeConfig, RecordUi);
        expect(wireB.pushCount()).toBe(1);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(createModeMockData);
    });

    it('should be a cache miss when recordUi is requested with Edit mode and optionalFields after Create, Edit, View', async () => {
        const mockData = getMock('single-record-Account-layouttypes-Full-modes-Create,Edit,View');
        const recordId = getRecordIdFromMock(mockData);
        const config = {
            recordIds: [recordId],
            layoutTypes: ['Full'],
            modes: ['Create', 'Edit', 'View'],
        };
        mockGetRecordUiNetwork(config, mockData);

        const editModeMock = getMock(
            'single-record-Account-layouttypes-Full-modes-Edit-optionalFields-IsDeleted'
        );
        const editModeConfig = {
            recordIds: [recordId],
            layoutTypes: ['Full'],
            modes: ['Edit'],
            optionalFields: ['Account.IsDeleted'],
        };

        const editModeNetworkParams = {
            ...editModeConfig,
            optionalFields: ['Account.IsDeleted'],
        };
        mockGetRecordUiNetwork(editModeNetworkParams, editModeMock);

        const wireA = await setupElement(config, RecordUi);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mockData);

        const wireB = await setupElement(editModeConfig, RecordUi);
        expect(wireB.pushCount()).toBe(1);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(editModeMock);
    });
});

describe('populating null nested record', () => {
    it('should handle when null spanning record becomes populated', async () => {
        const mock = getMock('record-ui-Opportunity-null-Account');
        const recordMock = getMock('record-ui-Opportunity-null-Account-populated');
        const recordId = getRecordIdFromMock(mock);
        const recordUiConfig = {
            recordIds: recordId,
            layoutTypes: ['Full'],
            modes: ['View'],
        };

        mockGetRecordUiNetwork(recordUiConfig, mock);

        const recordConfig = {
            recordId,
            fields: ['Opportunity.Account.Name'],
        };

        const optionalFields = [
            'Opportunity.Account.Id',
            'Opportunity.AccountId',
            'Opportunity.Amount',
            'Opportunity.Campaign.Id',
            'Opportunity.Campaign.Name',
            'Opportunity.CampaignId',
            'Opportunity.CloseDate',
            'Opportunity.CreatedBy.Id',
            'Opportunity.CreatedById',
            'Opportunity.CreatedDate',
            'Opportunity.CurrentGenerators__c',
            'Opportunity.DeliveryInstallationStatus__c',
            'Opportunity.Description',
            'Opportunity.ExpectedRevenue',
            'Opportunity.IsPrivate',
            'Opportunity.LastModifiedBy.Id',
            'Opportunity.LastModifiedById',
            'Opportunity.LastModifiedDate',
            'Opportunity.LeadSource',
            'Opportunity.MainCompetitors__c',
            'Opportunity.Name',
            'Opportunity.NextStep',
            'Opportunity.OrderNumber__c',
            'Opportunity.Owner.Id',
            'Opportunity.OwnerId',
            'Opportunity.Probability',
            'Opportunity.StageName',
            'Opportunity.TrackingNumber__c',
            'Opportunity.Type',
        ];
        if (!getTrackedFieldLeafNodeIdOnly()) {
            optionalFields.push(
                'Opportunity.CreatedBy.Name',
                'Opportunity.LastModifiedBy.Name',
                'Opportunity.Owner.Name'
            );
            optionalFields.sort();
        }
        mockGetRecordDeepParamsNetwork(
            {
                recordId,
                fields: ['Opportunity.Account.Name'],
                optionalFields,
            },
            recordMock
        );
        mockGetRecordDeepParamsNetwork(
            {
                recordId,
                optionalFields: extractRecordFields(recordMock, {
                    omit: ['Opportunity.Campaign'],
                    useNewTrackedFieldBehavior: getTrackedFieldLeafNodeIdOnly(),
                    add: ['Opportunity.Campaign.Id', 'Opportunity.Campaign.Name'],
                }),
            },
            recordMock
        );

        // Load record-ui without Account field present
        const recordUiWire = await setupElement(recordUiConfig, RecordUi);
        expireRecords();

        // Load record with spanning fields populated
        await setupElement(recordConfig, RecordFields);
        expect(recordUiWire.pushCount()).toBe(2);
        expect(recordUiWire.getWiredData()).toEqualSnapshotWithoutEtags({
            ...mock,
            records: {
                [recordId]: {
                    ...recordMock,
                    fields: {
                        ...mock.records[recordId].fields,
                        Account: {
                            ...recordMock.fields.Account,
                        },
                        AccountId: {
                            ...recordMock.fields.AccountId,
                        },
                        LastModifiedDate: {
                            ...recordMock.fields.LastModifiedDate,
                        },
                    },
                },
            },
        });
    });

    it('should handle when populated spanning record becomes null', async () => {
        const mockData = getMock('single-record-Opportunity-layouttypes-Full-modes-View');
        const recordId = getRecordIdFromMock(mockData);

        const recordMock = clone(mockData.records[recordId]);
        const optionalFields = extractRecordFields(recordMock, {
            omit: ['Opportunity.Account.Name', 'Opportunity.Campaign'],
            useNewTrackedFieldBehavior: getTrackedFieldLeafNodeIdOnly(),
            add: ['Opportunity.Campaign.Id', 'Opportunity.Campaign.Name'],
        }).sort();
        recordMock.fields.Account = {
            displayValue: null,
            value: null,
        };
        recordMock.fields.AccountId = {
            displayValue: null,
            value: null,
        };

        const recordUiConfig = {
            recordIds: recordId,
            layoutTypes: ['Full'],
            modes: ['View'],
        };

        const recordConfig = {
            recordId,
            fields: ['Opportunity.Account.Name'],
        };

        mockGetRecordUiNetwork(recordUiConfig, mockData);
        mockGetRecordNetwork({ ...recordConfig, optionalFields }, recordMock);

        // Load record-ui with Account field present
        const recordUiWire = await setupElement(recordUiConfig, RecordUi);

        expireRecords();

        // Load record with null spanning fields
        await setupElement(recordConfig, RecordFields);

        expect(recordUiWire.pushCount()).toBe(2);
        expect(recordUiWire.getWiredData()).toEqualSnapshotWithoutEtags({
            ...mockData,
            records: {
                [recordId]: {
                    ...recordMock,
                    fields: {
                        ...mockData.records[recordId].fields,
                        Account: {
                            ...recordMock.fields.Account,
                        },
                        AccountId: {
                            ...recordMock.fields.AccountId,
                        },
                    },
                },
            },
        });
    });

    it('should handle when two record ids, one is a spanning record nested inside the other, one becomes null', async () => {
        const mockOpportunityAndAccountRecordUi = getMock(
            'record-ui-Opportunity-Account-layouttypes-Full-modes-View'
        );
        let mockOpportunityRecord, mockAccountRecord;
        Object.keys(mockOpportunityAndAccountRecordUi.records).forEach((recordId) => {
            const record = mockOpportunityAndAccountRecordUi.records[recordId];
            if (record.apiName === 'Opportunity') {
                mockOpportunityRecord = clone(record);
            }

            if (record.apiName === 'Account') {
                mockAccountRecord = clone(record);
            }
        });

        const mockOpportunityRecordId = mockOpportunityRecord.id;
        const mockAccountRecordId = mockAccountRecord.id;
        const refreshMock = clone(mockOpportunityAndAccountRecordUi);
        refreshMock.records = {
            [mockOpportunityRecordId]: {
                ...mockOpportunityRecord,
                fields: {
                    ...mockOpportunityRecord.fields,
                    Account: {
                        displayValue: null,
                        value: null,
                    },
                    AccountId: {
                        displayValue: null,
                        value: null,
                    },
                },
            },
            [mockAccountRecordId]: {
                ...mockAccountRecord,
            },
        };

        const recordUiConfig = {
            recordIds: [mockOpportunityRecordId, mockAccountRecordId].sort(),
            layoutTypes: ['Full'],
            modes: ['View'],
        };

        mockGetRecordUiNetwork(recordUiConfig, [mockOpportunityAndAccountRecordUi, refreshMock]);

        // Load record-ui with Account field present
        const recordUiWire = await setupElement(recordUiConfig, RecordUi);

        expireRecordUi();

        // Load record-ui with null spanning fields
        await setupElement(recordUiConfig, RecordUi);

        expect(recordUiWire.pushCount()).toBe(2);
        expect(recordUiWire.getWiredData().records).toEqualSnapshotWithoutEtags(
            refreshMock.records
        );
    });
});

describe('recordTypeId update', () => {
    const newStageName = 'Open - This is Changed';
    const newRecordTypeId = '0129000000006ByAAI';

    // eslint-disable-next-line @salesforce/lds/no-invalid-todo
    // TODO: generated updated data with refreshData script
    function createUpdatedOpportunityRecordUi(baseRecordUi) {
        const updatedRecordUi = clone(baseRecordUi);
        const recordId = getRecordIdFromMock(baseRecordUi);

        // Records - record change causes recordTypeId change
        const updatedRecordData = updatedRecordUi.records[recordId];
        const recordTypeId = updatedRecordData.recordTypeId;

        updatedRecordData.fields.StageName = {
            displayValue: newStageName,
            value: newStageName,
        };
        updatedRecordData.recordTypeId = newRecordTypeId;
        updatedRecordData.weakEtag = updatedRecordData.weakEtag + 1;

        // Layouts - recordTypeId change causes layout change
        updatedRecordUi.layouts.Opportunity[newRecordTypeId] = {
            ...updatedRecordUi.layouts.Opportunity[recordTypeId],
        };
        delete updatedRecordUi.layouts.Opportunity[recordTypeId];

        // ObjectInfos - recordTypeId change causes ObjectInfo change
        delete updatedRecordUi.objectInfos.Campaign;

        return updatedRecordUi;
    }

    it('emits updated recordUi data when recordTypeId gets changed', async () => {
        const mockRecordUiData = getMock('single-record-Opportunity-layouttypes-Full-modes-View');
        const recordId = getRecordIdFromMock(mockRecordUiData);

        const config = {
            recordIds: recordId,
            layoutTypes: ['Full'],
            modes: ['View'],
        };

        const updatedRecordUiData = createUpdatedOpportunityRecordUi(mockRecordUiData);
        const updatedRecordData = updatedRecordUiData.records[recordId];

        const updatedRecordUiNetworkConfig = {
            ...config,
            optionalFields: extractRecordFields(updatedRecordData, {
                omit: ['Opportunity.Campaign'],
                useNewTrackedFieldBehavior: getTrackedFieldLeafNodeIdOnly(),
                add: ['Opportunity.Campaign.Id', 'Opportunity.Campaign.Name'],
            }),
        };

        mockGetRecordUiNetwork(config, [mockRecordUiData, updatedRecordUiData]);
        mockGetRecordNetwork(
            { recordId, optionalFields: updatedRecordUiNetworkConfig.optionalFields },
            updatedRecordData
        );

        // 1. fetch recordUi data from network
        const wireA = await setupElement(config, RecordUi);

        // 2. fetch updated recordUi with recordTypeId from network
        expireRecordUi();
        const wireB = await setupElement(config, RecordUi);

        expect(wireA.pushCount()).toBe(2);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(updatedRecordUiData);
        expect(wireB.pushCount()).toBe(1);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(updatedRecordUiData);
    });

    it('emits updated recordUi data when a new recordTypeId from recordUi with different mode', async () => {
        const editRecordUiData = getMock('single-record-Opportunity-layouttypes-Full-modes-Edit');
        const recordId = getRecordIdFromMock(editRecordUiData);
        const recordData = editRecordUiData.records[recordId];

        const updatedEditRecordUiData = createUpdatedOpportunityRecordUi(editRecordUiData);

        const editConfig = {
            recordIds: recordId,
            layoutTypes: ['Full'],
            modes: ['Edit'],
        };

        const recordFields = extractRecordFields(recordData, {
            omit: ['Opportunity.Campaign'],
            useNewTrackedFieldBehavior: getTrackedFieldLeafNodeIdOnly(),
            add: ['Opportunity.Campaign.Id', 'Opportunity.Campaign.Name'],
        });

        mockGetRecordUiNetwork(editConfig, [editRecordUiData, updatedEditRecordUiData]);

        const viewRecordUiData = getMock('single-record-Opportunity-layouttypes-Full-modes-View');
        const updatedViewRecordUiData = createUpdatedOpportunityRecordUi(viewRecordUiData);

        const viewConfig = {
            recordIds: recordId,
            layoutTypes: ['Full'],
            modes: ['View'],
        };

        mockGetRecordUiNetwork(viewConfig, updatedViewRecordUiData);
        mockGetRecordNetwork(
            { recordId, optionalFields: recordFields },
            updatedViewRecordUiData.records[recordId]
        );

        // 1. Fetch recordUi data from network
        const wireA = await setupElement(editConfig, RecordUi);

        // 2. Record and recordTypeId get updated on the server.
        // Updated recordUi data with view is fetched from network.
        const wireB = await setupElement(viewConfig, RecordUi);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(updatedViewRecordUiData);

        expect(wireA.pushCount()).toBe(2);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(updatedEditRecordUiData);
    });

    it('refreshes recordUi snapshot when updateRecord receives a new recordTypeId', async () => {
        const mockRecordUiData = getMock('single-record-Opportunity-layouttypes-Full-modes-View');
        const recordId = getRecordIdFromMock(mockRecordUiData);

        const config = {
            recordIds: recordId,
            layoutTypes: ['Full'],
            modes: ['View'],
        };

        const updatedRecordUiData = createUpdatedOpportunityRecordUi(mockRecordUiData);
        const updatedRecordData = updatedRecordUiData.records[recordId];

        const updateParams = {
            fields: {
                Id: recordId,
                StageName: newStageName,
                RecordTypeId: newRecordTypeId,
            },
            allowSaveOnDuplicate: false,
        };

        mockUpdateRecordNetwork(recordId, updateParams, updatedRecordData);
        mockGetRecordUiNetwork(config, [mockRecordUiData, updatedRecordUiData]);
        mockGetRecordNetwork(
            {
                recordId,
                optionalFields: extractRecordFields(updatedRecordData, {
                    omit: ['Opportunity.Campaign'],
                    useNewTrackedFieldBehavior: getTrackedFieldLeafNodeIdOnly(),
                    add: ['Opportunity.Campaign.Id', 'Opportunity.Campaign.Name'],
                }),
            },
            updatedRecordData
        );

        // 1. fetch recordUi data from network
        const wireA = await setupElement(config, RecordUi);

        // 2. updated recordTypeId with updateRecord.
        // This will trigger the existing snapshots refresh.
        await updateRecord(updateParams);
        await flushPromises();

        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(updatedRecordUiData);
    });

    it('emits cached data which is updated by refresh', async () => {
        const mockRecordUiData = getMock('single-record-Opportunity-layouttypes-Full-modes-View');
        const recordId = getRecordIdFromMock(mockRecordUiData);

        const config = {
            recordIds: recordId,
            layoutTypes: ['Full'],
            modes: ['View'],
        };

        const updatedRecordUiData = createUpdatedOpportunityRecordUi(mockRecordUiData);
        const updatedRecordData = updatedRecordUiData.records[recordId];

        const updateParams = {
            fields: {
                Id: recordId,
                StageName: newStageName,
                RecordTypeId: newRecordTypeId,
            },
            allowSaveOnDuplicate: false,
        };
        mockUpdateRecordNetwork(recordId, updateParams, updatedRecordData);

        mockGetRecordUiNetwork(config, [mockRecordUiData, updatedRecordUiData]);
        mockGetRecordNetwork(
            {
                recordId,
                optionalFields: extractRecordFields(updatedRecordData, {
                    omit: ['Opportunity.Campaign'],
                    useNewTrackedFieldBehavior: getTrackedFieldLeafNodeIdOnly(),
                    add: ['Opportunity.Campaign.Id', 'Opportunity.Campaign.Name'],
                }),
            },
            updatedRecordData
        );

        // 1. fetch recordUi data from
        await setupElement(config, RecordUi);

        // 2. updated recordTypeId with updateRecord.
        // This will trigger the existing snapshots refresh.
        await updateRecord(updateParams);
        await flushPromises();

        // 3. set up a new wire with same config. It should hit cache.
        const wireB = await setupElement(config, RecordUi);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(updatedRecordUiData);
    });

    it('emits updated data when record expires after recordTypeId updated', async () => {
        const mockRecordUiData = getMock('single-record-Opportunity-layouttypes-Full-modes-View');
        const recordId = getRecordIdFromMock(mockRecordUiData);

        const config = {
            recordIds: recordId,
            layoutTypes: ['Full'],
            modes: ['View'],
        };

        const updatedRecordUiData = createUpdatedOpportunityRecordUi(mockRecordUiData);
        const updatedRecordData = updatedRecordUiData.records[recordId];

        const updateParams = {
            fields: {
                Id: recordId,
                StageName: newStageName,
                RecordTypeId: newRecordTypeId,
            },
            allowSaveOnDuplicate: false,
        };

        mockUpdateRecordNetwork(recordId, updateParams, updatedRecordData);
        mockGetRecordUiNetwork(config, [mockRecordUiData, mockRecordUiData, updatedRecordUiData]);
        mockGetRecordNetwork(
            {
                recordId,
                optionalFields: extractRecordFields(updatedRecordData, {
                    omit: ['Opportunity.Campaign'],
                    useNewTrackedFieldBehavior: getTrackedFieldLeafNodeIdOnly(),
                    add: ['Opportunity.Campaign.Id', 'Opportunity.Campaign.Name'],
                }),
            },
            updatedRecordData
        );

        // 1. fetch recordUi data from network.
        const wireA = await setupElement(config, RecordUi);

        // 2. updated recordTypeId with updateRecord.
        await updateRecord(updateParams);

        // 3. set up a new wire with same config. Fetch data from network, since record is expired.
        expireRecords();
        const wireB = await setupElement(config, RecordUi);

        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(updatedRecordUiData);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(updatedRecordUiData);
    });

    it('emits updated data when providing a config which has been used before recordTypeId change', async () => {
        const mockRecordUiData = getMock('single-record-Opportunity-layouttypes-Full-modes-View');
        const recordId = getRecordIdFromMock(mockRecordUiData);

        const config = {
            recordIds: recordId,
            layoutTypes: ['Full'],
            modes: ['View'],
        };

        const optionalFieldsConfig = {
            recordIds: recordId,
            layoutTypes: ['Full'],
            modes: ['View'],
            optionalFields: ['Opportunity.CloseDate'],
        };

        const updatedRecordUiData = createUpdatedOpportunityRecordUi(mockRecordUiData);
        const updatedRecordData = updatedRecordUiData.records[recordId];

        const updateParams = {
            fields: {
                Id: recordId,
                StageName: newStageName,
                RecordTypeId: newRecordTypeId,
            },
            allowSaveOnDuplicate: false,
        };

        mockUpdateRecordNetwork(recordId, updateParams, updatedRecordData);
        mockGetRecordUiNetwork(config, [
            mockRecordUiData,
            mockRecordUiData,
            updatedRecordUiData,
            updatedRecordUiData,
        ]);
        mockGetRecordNetwork(
            {
                recordId,
                optionalFields: extractRecordFields(updatedRecordData, {
                    omit: ['Opportunity.Campaign'],
                    useNewTrackedFieldBehavior: getTrackedFieldLeafNodeIdOnly(),
                    add: ['Opportunity.Campaign.Id', 'Opportunity.Campaign.Name'],
                }),
            },
            updatedRecordData
        );

        // 1. fetch recordUi data from network
        const wireA = await setupElement(config, RecordUi);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mockRecordUiData);

        // 2. fetch recordUi data from network with a new config
        await updateElement(wireA, optionalFieldsConfig);

        // 3. updated recordTypeId with updateRecord.
        await updateRecord(updateParams);

        // 4. fetch recordUi data from network, since record is expired
        expireRecords();
        await updateElement(wireA, config);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(updatedRecordUiData);
    });

    it('refreshes snapshot with no additional optional fields when recordTypeId gets changed', async () => {
        // network mock for 1. fetch recordUi from network
        const mockRecordUiData = getMock('single-record-Opportunity-layouttypes-Full-modes-View');
        const updatedRecordUiData = createUpdatedOpportunityRecordUi(
            clone(clone(mockRecordUiData))
        );
        const recordId = getRecordIdFromMock(mockRecordUiData);

        const config = {
            recordIds: recordId,
            layoutTypes: ['Full'],
            modes: ['View'],
        };

        // network mock for 2. getRecordUi - request with additional optional fields, fetch from network
        const recordUiWithExtraFieldsData = getMock(
            'single-record-Opportunity-layouttypes-Full-modes-View-optionalFields-CloneSourceId'
        );

        const updatedRecordUiWithExtraFieldsData = createUpdatedOpportunityRecordUi(
            clone(recordUiWithExtraFieldsData)
        );

        const optionalFieldsConfig = {
            recordIds: recordId,
            layoutTypes: ['Full'],
            modes: ['View'],
            optionalFields: ['Opportunity.CloneSourceId'],
        };

        const optionalFields = extractRecordFields(mockRecordUiData.records[recordId], {
            omit: ['Opportunity.Campaign'],
            useNewTrackedFieldBehavior: getTrackedFieldLeafNodeIdOnly(),
            add: [
                'Opportunity.CloneSourceId',
                'Opportunity.Campaign.Id',
                'Opportunity.Campaign.Name',
            ],
        });

        // network mock for 3. updated recordTypeId with updateRecord.
        const updatedRecordDataWithExtraFields =
            updatedRecordUiWithExtraFieldsData.records[recordId];
        const updateParams = {
            fields: {
                Id: recordId,
                StageName: newStageName,
                RecordTypeId: newRecordTypeId,
            },
            allowSaveOnDuplicate: false,
        };

        // mocks for 4. existing recordUi snapshots refresh (wireA and wireB)
        mockGetRecordUiNetwork(config, [
            mockRecordUiData,
            recordUiWithExtraFieldsData,
            updatedRecordUiData,
            updatedRecordUiWithExtraFieldsData,
        ]);
        mockUpdateRecordNetwork(recordId, updateParams, updatedRecordDataWithExtraFields);
        mockGetRecordNetwork({ recordId, optionalFields }, updatedRecordDataWithExtraFields);

        // 1. fetch recordUi from network
        const wireA = await setupElement(config, RecordUi);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mockRecordUiData);

        // 2. getRecordUi - request with additional optional fields, fetch from network
        const wireB = await setupElement(optionalFieldsConfig, RecordUi);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(recordUiWithExtraFieldsData);

        // 3. updated recordTypeId with updateRecord.
        // This will triggers
        //   1) existing recordUi snapshots refresh (wireA and wireB)
        //   2) a getRecord network call for fetching all updated fields
        await updateRecord(updateParams);
        await flushPromises();

        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(updatedRecordUiData);
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(
            updatedRecordUiWithExtraFieldsData
        );

        // 4. getRecordUi with same config as #2, cache hit
        const wireC = await setupElement(optionalFieldsConfig, RecordUi);
        expect(wireC.getWiredData()).toEqualSnapshotWithoutEtags(
            updatedRecordUiWithExtraFieldsData
        );
    });
});
