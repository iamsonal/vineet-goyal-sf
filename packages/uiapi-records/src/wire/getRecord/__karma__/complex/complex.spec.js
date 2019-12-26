import { setupElement, getMock as globalGetMock } from 'test-util';
import {
    expireRecords,
    mockGetRecordNetwork,
    mockGetRecordCreateDefaultsNetwork,
} from 'uiapi-test-util';

import RecordFields from '../lwc/record-fields';
import RecordDefaultsCreate from '../../../getRecordCreateDefaults/__karma__/lwc/get-record-create-defaults';

const MOCK_PREFIX = 'wire/getRecord/__karma__/complex/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('complex', () => {
    it('gets record with required fields and non-existent optional field', async () => {
        const mockData = getMock(
            'record-Opportunity-fields-Opportunity.Name,Opportunity.OwnerId-optionalFields-Opportunity.NoExist'
        );
        const config = {
            recordId: mockData.id,
            fields: ['Opportunity.Name', 'Opportunity.OwnerId'],
            optionalFields: ['Opportunity.NoExist'],
        };
        mockGetRecordNetwork(config, mockData);

        const element = await setupElement(config, RecordFields);

        // Verify that "Opportunity.NoExist" does not exist
        expect(element.getWiredData().fields.NoExist).not.toBeDefined();
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
    });

    it('should merge fields occurring twice on a single response', async () => {
        const mockData = getMock(
            'record-Opportunity-fields-Opportunity.Account.Name,Opportunity.Account.Owner.Name,Opportunity.Owner.City'
        );
        const configA = {
            recordId: mockData.id,
            fields: [
                'Opportunity.Account.Name',
                'Opportunity.Account.Owner.Name',
                'Opportunity.Owner.City',
            ],
        };
        mockGetRecordNetwork(configA, mockData);

        await setupElement(configA, RecordFields);

        const wireB = await setupElement(
            {
                recordId: mockData.fields.OwnerId.value,
                fields: ['User.City', 'User.Id', 'User.Name'],
            },
            RecordFields
        );

        // It should not have made a new HTTP request because all fields should be merged
        expect(wireB.pushCount()).toBe(1);

        const ownerId = mockData.fields.OwnerId.value;
        const ownerSystemModstamp = mockData.fields.Owner.value.systemModstamp;
        const ownerLastModifiedDate = mockData.fields.Owner.value.lastModifiedDate;
        const cityValue = mockData.fields.Owner.value.fields.City.value;
        const nameValue = mockData.fields.Account.value.fields.Owner.value.fields.Name.value;
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags({
            apiName: 'User',
            childRelationships: {},
            fields: {
                Id: {
                    displayValue: null,
                    value: ownerId,
                },
                Name: {
                    displayValue: null,
                    value: nameValue,
                },
                City: {
                    displayValue: null,
                    value: cityValue,
                },
            },
            id: ownerId,
            lastModifiedById: ownerId,
            lastModifiedDate: ownerLastModifiedDate,
            recordTypeId: null,
            recordTypeInfo: null,
            systemModstamp: ownerSystemModstamp,
        });
    });

    it('should request all previously requested fields for a record with fields from configuration', async () => {
        const mockDataOpportunityName = getMock('record-Opportunity-fields-Opportunity.Name');
        const configA = {
            recordId: mockDataOpportunityName.id,
            fields: ['Opportunity.Name'],
        };
        mockGetRecordNetwork(configA, mockDataOpportunityName);

        const wireA = await setupElement(configA, RecordFields);

        const mockDataOpportunityNameSystemModstamp = getMock(
            'record-Opportunity-fields-Opportunity.Name,Opportunity.SystemModStamp'
        );
        const configB = {
            recordId: mockDataOpportunityNameSystemModstamp.id,
            fields: ['Opportunity.SystemModstamp'],
        };

        mockGetRecordNetwork(
            {
                recordId: mockDataOpportunityNameSystemModstamp.id,
                fields: ['Opportunity.SystemModstamp'],
                optionalFields: ['Opportunity.Name'],
            },
            mockDataOpportunityNameSystemModstamp
        );

        const wireB = await setupElement(configB, RecordFields);

        // wireA should not have received new data
        expect(wireA.pushCount()).toBe(1);

        delete mockDataOpportunityNameSystemModstamp.fields.Name;
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(
            mockDataOpportunityNameSystemModstamp
        );
    });

    it('should request all previously requested fields for a record with optional fields from configuration', async () => {
        const mockDataOpportunityName = getMock('record-Opportunity-fields-Opportunity.Name');
        const configA = {
            recordId: mockDataOpportunityName.id,
            fields: ['Opportunity.Name'],
        };
        mockGetRecordNetwork(configA, mockDataOpportunityName);

        const wireA = await setupElement(configA, RecordFields);

        const mockDataOpportunityNameSystemModstamp = getMock(
            'record-Opportunity-fields-Opportunity.Name,Opportunity.SystemModStamp'
        );
        const configB = {
            recordId: mockDataOpportunityNameSystemModstamp.id,
            optionalFields: ['Opportunity.SystemModstamp'],
        };

        mockGetRecordNetwork(
            {
                recordId: mockDataOpportunityNameSystemModstamp.id,
                optionalFields: ['Opportunity.Name', 'Opportunity.SystemModstamp'],
            },
            mockDataOpportunityNameSystemModstamp
        );

        const wireB = await setupElement(configB, RecordFields);

        // wireA should not have received new data
        expect(wireA.pushCount()).toBe(1);

        delete mockDataOpportunityNameSystemModstamp.fields.Name;
        expect(wireB.getWiredData()).toEqualSnapshotWithoutEtags(
            mockDataOpportunityNameSystemModstamp
        );
    });
});

describe('refresh', () => {
    it('should refresh record by fields', async () => {
        const mockDataOpportunityName = getMock('record-Opportunity-fields-Opportunity.Name');
        const refreshMockData = getMock('record-Opportunity-fields-Opportunity.Name');
        refreshMockData.lastModifiedDate = new Date(
            new Date(refreshMockData.lastModifiedDate).getTime() + 60 * 1000
        ).toISOString();
        refreshMockData.weakEtag = refreshMockData.weakEtag + 999;

        const config = {
            recordId: mockDataOpportunityName.id,
            fields: ['Opportunity.Name'],
        };
        mockGetRecordNetwork(config, [mockDataOpportunityName, refreshMockData]);

        const wire = await setupElement(config, RecordFields);

        expect(wire.pushCount()).toBe(1);
        expect(wire.getWiredData()).toEqualSnapshotWithoutEtags(mockDataOpportunityName);

        await wire.refresh();

        expect(wire.pushCount()).toBe(2);
        expect(wire.getWiredData()).toEqualSnapshotWithoutEtags(refreshMockData);
    });
});

describe('Null lastModifiedById, lastModifiedDate, systemModstamp', () => {
    it('should emit correct values when null record is ingested second', async () => {
        const mock = getMock('record-User-fields-User.Name');
        const config = {
            recordId: mock.id,
            fields: ['User.Name'],
        };

        mockGetRecordNetwork(config, mock);

        // Ingest the record with populated lastModifiedDate
        const elm = await setupElement(config, RecordFields);

        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        // Ingest the same record via record defaults create
        // This record has the same User
        const recordDefaultCreatesMock = getMock('record-defaults-create-Account');
        const defaultConfig = {
            objectApiName: 'Account',
        };

        mockGetRecordCreateDefaultsNetwork(defaultConfig, recordDefaultCreatesMock);

        const defaultsElm = await setupElement(defaultConfig, RecordDefaultsCreate);

        expect(defaultsElm.pushCount()).toBe(1);
        const expected = {
            ...recordDefaultCreatesMock,
            record: {
                ...recordDefaultCreatesMock.record,
                fields: {
                    ...recordDefaultCreatesMock.record.fields,
                    Owner: {
                        ...recordDefaultCreatesMock.record.fields.Owner,
                        value: {
                            ...recordDefaultCreatesMock.record.fields.Owner.value,
                            // lastModifiedById, lastModifiedDate, systemModstamp and weakEtag should equal the previous value we ingested
                            lastModifiedById: mock.lastModifiedById,
                            lastModifiedDate: mock.lastModifiedDate,
                            systemModstamp: mock.systemModstamp,
                        },
                    },
                },
            },
        };

        // Record elm should not have received a new push
        expect(elm.pushCount()).toBe(1);
        expect(defaultsElm.getWiredData()).toEqualSnapshotWithoutEtags(expected);
    });

    it('should emit correct values when null record is ingested first', async () => {
        // Ingest the null record via record defaults create
        const recordDefaultCreatesMock = getMock('record-defaults-create-Account');
        const defaultConfig = {
            objectApiName: 'Account',
        };

        mockGetRecordCreateDefaultsNetwork(defaultConfig, recordDefaultCreatesMock);

        const defaultsElm = await setupElement(defaultConfig, RecordDefaultsCreate);

        const mock = getMock('record-User-fields-User.Name');
        const config = {
            recordId: mock.id,
            fields: ['User.Name'],
        };

        mockGetRecordNetwork(config, mock);

        expireRecords();
        // Ingest the record with populated lastModifiedDate
        // This record appears in record defaults
        const elm = await setupElement(config, RecordFields);

        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        const expected = {
            ...recordDefaultCreatesMock,
            record: {
                ...recordDefaultCreatesMock.record,
                fields: {
                    ...recordDefaultCreatesMock.record.fields,
                    Owner: {
                        ...recordDefaultCreatesMock.record.fields.Owner,
                        value: {
                            ...recordDefaultCreatesMock.record.fields.Owner.value,
                            // lastModifiedById, lastModifiedDate, systemModstamp and weakEtag should equal the previous value we ingested
                            lastModifiedById: mock.lastModifiedById,
                            lastModifiedDate: mock.lastModifiedDate,
                            systemModstamp: mock.systemModstamp,
                        },
                    },
                },
            },
        };

        // defaultsElm should have received two values
        expect(defaultsElm.pushCount()).toBe(2);
        expect(defaultsElm.getWiredData()).toEqualSnapshotWithoutEtags(expected);
    });
});
