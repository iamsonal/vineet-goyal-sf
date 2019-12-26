import { setupElement, getMock as globalGetMock } from 'test-util';
import {
    MASTER_RECORD_TYPE_ID,
    extractRecordFields,
    mockGetRecordNetwork,
    mockGetRecordUiNetwork,
    mockGetLayoutNetwork,
    mockGetObjectInfoNetwork,
} from 'uiapi-test-util';

import RecordFields from '../lwc/record-fields';
import RecordLayoutTypes from '../lwc/record-layout-types';
import GetLayout from './../../../getLayout/__karma__/lwc/get-layout';
import GetObjectInfo from './../../../getObjectInfo/__karma__/lwc/object-basic';

const MOCK_PREFIX = 'wire/getRecord/__karma__/layout/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('layout', () => {
    it('fetches record layout when record has not been fetched before (apiName and recordTypeId are both unknown)', async () => {
        const mockRecordUiData = getMock('record-Opportunity-layouttypes-Full-modes-View');
        const mockRecord = mockRecordUiData.records[Object.keys(mockRecordUiData.records)[0]];
        const config = {
            recordId: mockRecord.id,
            layoutTypes: ['Full'],
        };

        const networkParams = {
            recordIds: config.recordId,
            layoutTypes: config.layoutTypes,
        };
        mockGetRecordUiNetwork(networkParams, mockRecordUiData);

        const element = await setupElement(config, RecordLayoutTypes);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockRecord);
    });

    it('should call record-ui when not all layouts are available', async () => {
        // Mock record fields request
        const mockRecordNameField = getMock('record-Opportunity-fields-Opportunity.Name');
        mockRecordNameField.recordTypeInfo = {
            available: true,
            defaultRecordTypeMapping: true,
            master: true,
            name: 'Master',
            recordTypeId: MASTER_RECORD_TYPE_ID,
        };
        const recordFieldsConfig = {
            recordId: mockRecordNameField.id,
            fields: ['Opportunity.Name'],
        };
        mockGetRecordNetwork(recordFieldsConfig, mockRecordNameField);

        const mockRecordUiData = getMock('record-Opportunity-layouttypes-Full-modes-View');
        const mockRecord = mockRecordUiData.records[Object.keys(mockRecordUiData.records)[0]];

        const networkParams = {
            recordIds: mockRecord.id,
            layoutTypes: ['Full'],
        };
        mockGetRecordUiNetwork(networkParams, mockRecordUiData);

        // Load Opportunity.Name
        const wireA = await setupElement(recordFieldsConfig, RecordFields);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mockRecordNameField);

        // Load Opportunity layout type full
        const wireB = await setupElement(
            {
                recordId: mockRecordNameField.id,
                layoutTypes: ['Full'],
            },
            RecordLayoutTypes
        );

        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(mockRecord);
    });

    it('should call record-ui when object-info is not available', async () => {
        // Mock record fields request
        const mockRecordNameField = getMock('record-Opportunity-fields-Opportunity.Name');
        mockRecordNameField.recordTypeInfo = {
            available: true,
            defaultRecordTypeMapping: true,
            master: true,
            name: 'Master',
            recordTypeId: MASTER_RECORD_TYPE_ID,
        };
        const recordFieldsConfig = {
            recordId: mockRecordNameField.id,
            fields: ['Opportunity.Name'],
        };
        mockGetRecordNetwork(recordFieldsConfig, mockRecordNameField);

        // Mock layout request
        const mockLayout = getMock('layout-Opportunity-layoutType-Full-modes-View');
        const layoutConfig = {
            objectApiName: 'Opportunity',
            layoutType: 'Full',
            mode: 'View',
            recordTypeId: mockRecordNameField.recordTypeId,
        };
        mockGetLayoutNetwork(layoutConfig, mockLayout);

        // Mock record-ui request
        const mockRecordUiData = getMock('record-Opportunity-layouttypes-Full-modes-View');
        const mockRecord = mockRecordUiData.records[Object.keys(mockRecordUiData.records)[0]];
        const networkParams = {
            recordIds: mockRecord.id,
            layoutTypes: ['Full'],
        };
        mockGetRecordUiNetwork(networkParams, mockRecordUiData);

        // Load Opportunity Full, View layout
        await setupElement(
            {
                objectApiName: 'Opportunity',
                layoutType: 'Full',
                mode: 'View',
                recordTypeId: mockRecordNameField.recordTypeId,
            },
            GetLayout
        );

        // Load Opportunity.Name
        const wireA = await setupElement(recordFieldsConfig, RecordFields);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mockRecordNameField);

        // Load Opportunity layout type full
        const wireB = await setupElement(
            {
                recordId: mockRecordNameField.id,
                layoutTypes: ['Full'],
            },
            RecordLayoutTypes
        );

        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(mockRecord);
    });

    it('should not go to network (record-ui) when record apiName, recordTypeId layout, and object-info are available locally', async () => {
        const mockRecordNameField = getMock('record-Opportunity-fields-Opportunity.Name');
        const recordId = mockRecordNameField.id;
        const recordFieldsConfig = {
            recordId,
            fields: ['Opportunity.Name'],
        };
        mockGetRecordNetwork(recordFieldsConfig, mockRecordNameField);

        // Mock layout request
        const mockLayoutData = getMock('layout-Opportunity-layoutType-Full-modes-View');
        const layoutConfig = {
            objectApiName: 'Opportunity',
            layoutType: 'Full',
            mode: 'View',
            recordTypeId: mockRecordNameField.recordTypeId,
        };
        mockGetLayoutNetwork(layoutConfig, mockLayoutData);

        // Mock object info request
        const mockObjectInfo = getMock('object-info-Opportunity');
        const objectInfoConfig = {
            objectApiName: 'Opportunity',
        };
        mockGetObjectInfoNetwork(objectInfoConfig, mockObjectInfo);

        // Mock full layout fields request
        const mockRecordUiData = getMock('record-Opportunity-layouttypes-Full-modes-View');
        const mockFullLayoutRecord = mockRecordUiData.records[recordId];

        const recordFields = extractRecordFields(mockFullLayoutRecord, {
            // TODO: this seems a bug (UIAPI). In object-info, the CampaignId fields has referenceToInfos which points to
            // Campaign with Name fields. However, in the record-ui, Campaign has a null value.
            omit: ['Opportunity.Campaign'],
        });
        recordFields.push(...['Opportunity.Campaign.Id', 'Opportunity.Campaign.Name']);

        const fullLayoutFieldParams = {
            recordId,
            fields: recordFields.sort(),
            optionalFields: [],
        };

        mockGetRecordNetwork(fullLayoutFieldParams, mockFullLayoutRecord);

        // Load Opportunity Full, View layout
        await setupElement(layoutConfig, GetLayout);

        // Load Opportunity Object Info
        await setupElement(objectInfoConfig, GetObjectInfo);

        // Load Opportunity.Name
        const wireA = await setupElement(recordFieldsConfig, RecordFields);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mockRecordNameField);

        // Load Opportunity layout type full
        const wireB = await setupElement(
            {
                recordId,
                layoutTypes: ['Full'],
            },
            RecordLayoutTypes
        );

        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(mockFullLayoutRecord);
    });

    it('should not go to network (record-ui) when record apiName, layout, and object-info are available locally', async () => {
        // Mock record fields request w/ null recordTypeId
        const mockRecordNameField = getMock('record-Opportunity-fields-Opportunity.Name');
        // TODO: it should use real record which does not support record type.
        mockRecordNameField.recordTypeId = null;

        const recordId = mockRecordNameField.id;
        const recordFieldsConfig = {
            recordId,
            fields: ['Opportunity.Name'],
        };
        mockGetRecordNetwork(recordFieldsConfig, mockRecordNameField);

        // Mock object info request
        const mockObjectInfo = getMock('object-info-Opportunity');
        const objectInfoConfig = {
            objectApiName: 'Opportunity',
        };
        mockGetObjectInfoNetwork(objectInfoConfig, mockObjectInfo);

        // Mock layout request
        const mockLayout = getMock('layout-Opportunity-layoutType-Full-modes-View');
        const layoutConfig = {
            objectApiName: 'Opportunity',
            layoutType: 'Full',
            mode: 'View',
            recordTypeId: mockObjectInfo.defaultRecordTypeId,
        };

        mockGetLayoutNetwork(layoutConfig, mockLayout);

        // Mock full layout fields request
        const mockRecordUiData = getMock('record-Opportunity-layouttypes-Full-modes-View');
        const mockFullLayoutRecord = mockRecordUiData.records[recordId];

        const recordFields = extractRecordFields(mockFullLayoutRecord, {
            // TODO: this seems a bug (UIAPI). In object-info, the CampaignId fiedls has referenceToInfos which points to
            // Campaign with Name fields. However, in the record-ui, Campaign has a null value.
            omit: ['Opportunity.Campaign'],
        });
        recordFields.push(...['Opportunity.Campaign.Id', 'Opportunity.Campaign.Name']);

        const fullLayoutFieldParams = {
            recordId,
            fields: recordFields.sort(),
            optionalFields: [],
        };
        mockGetRecordNetwork(fullLayoutFieldParams, mockFullLayoutRecord);

        // Load Opportunity Full, View layout
        await setupElement(layoutConfig, GetLayout);
        // Load Opportunity Object Info
        await setupElement(objectInfoConfig, GetObjectInfo);

        // Load Opportunity.Name
        const wireA = await setupElement(recordFieldsConfig, RecordFields);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mockRecordNameField);

        // Load Opportunity layout type full
        const wireB = await setupElement(
            {
                recordId,
                layoutTypes: ['Full'],
            },
            RecordLayoutTypes
        );

        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(mockFullLayoutRecord);
    });

    it('gets record with layoutType and non-existent optional field', async () => {
        const mockRecordUiData = getMock('record-Opportunity-layouttypes-Full-modes-View');
        const mockRecord = mockRecordUiData.records[Object.keys(mockRecordUiData.records)[0]];

        const config = {
            recordId: mockRecord.id,
            layoutTypes: ['Full'],
            optionalFields: ['Opportunity.NoExist'],
        };

        const networkParams = {
            recordIds: mockRecord.id,
            layoutTypes: config.layoutTypes,
            optionalFields: config.optionalFields,
        };
        mockGetRecordUiNetwork(networkParams, mockRecordUiData);

        const element = await setupElement(config, RecordLayoutTypes);

        // Verify that "Opportunity.NoExist" does not exist
        expect(element.getWiredData().fields.NoExist).not.toBeDefined();
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockRecord);
    });
});

describe('refresh', () => {
    it('should refresh record by layout type', async () => {
        const mockRecordUiData = getMock('record-Opportunity-layouttypes-Full-modes-View');
        const mockRecord = mockRecordUiData.records[Object.keys(mockRecordUiData.records)[0]];
        const recordId = mockRecord.id;
        const refershMockUiData = getMock('record-Opportunity-layouttypes-Full-modes-View');
        refershMockUiData.records[recordId].lastModifiedDate = new Date(
            new Date(mockRecord.lastModifiedDate).getTime() + 60 * 1000
        ).toISOString();
        refershMockUiData.records[recordId].weakEtag = mockRecord.weakEtag + 999;

        const networkParams = {
            recordIds: recordId,
            layoutTypes: ['Full'],
        };
        mockGetRecordUiNetwork(networkParams, [mockRecordUiData, refershMockUiData]);

        const config = {
            recordId,
            layoutTypes: ['Full'],
        };
        const element = await setupElement(config, RecordLayoutTypes);

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockRecord);

        await element.refresh();

        expect(element.pushCount()).toBe(2);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(
            refershMockUiData.records[mockRecord.id]
        );
    });
});
