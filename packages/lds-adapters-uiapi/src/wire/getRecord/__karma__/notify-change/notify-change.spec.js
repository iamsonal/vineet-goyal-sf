import { getMock as globalGetMock, setupElement } from 'test-util';
import { getTrackedFieldLeafNodeIdOnly, mockGetRecordNetwork } from 'uiapi-test-util';

import RecordFields from '../lwc/record-fields';

const MOCK_PREFIX = 'wire/getRecord/__karma__/notify-change/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('notify change', () => {
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

        const refreshConfig = {
            recordId: mockDataOpportunityName.id,
            optionalFields: ['Opportunity.Name'],
        };

        mockGetRecordNetwork(config, mockDataOpportunityName);
        mockGetRecordNetwork(refreshConfig, refreshMockData);

        const element = await setupElement(config, RecordFields);

        expect(element.pushCount()).toBe(1);

        const representation = element.getWiredData();
        expect(representation).toEqualSnapshotWithoutEtags(mockDataOpportunityName);

        await element.notifyChange([{ recordId: representation.id }]);

        expect(element.pushCount()).toBe(2);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(refreshMockData);
    });

    it('does not return optionalFields that were there previously', async () => {
        const initialMock = getMock('record-TestD__c-fields-TestD__c.TestC__r.Id-populated');
        const initialConfig = {
            recordId: initialMock.id,
            optionalFields: ['TestD__c.TestC__r.Id'],
        };

        mockGetRecordNetwork(initialConfig, initialMock);

        const refreshMock = getMock('record-TestD__c-TestD__c.TestC__r-missing-updated');
        const refreshConfig = {
            recordId: refreshMock.id,
            optionalFields: [
                'TestD__c.CreatedBy.Id',
                'TestD__c.CreatedById',
                'TestD__c.CreatedDate',
                'TestD__c.LastModifiedBy.Id',
                'TestD__c.LastModifiedById',
                'TestD__c.LastModifiedDate',
                'TestD__c.Name',
                'TestD__c.Owner.Id',
                'TestD__c.OwnerId',
                'TestD__c.TestC__c',
                'TestD__c.TestC__r.Id',
            ],
        };

        if (!getTrackedFieldLeafNodeIdOnly()) {
            refreshConfig.optionalFields.push(
                'TestD__c.CreatedBy.Name',
                'TestD__c.LastModifiedBy.Name',
                'TestD__c.Owner.Name'
            );
            refreshConfig.optionalFields.sort();
        }

        mockGetRecordNetwork(refreshConfig, [refreshMock, refreshMock]);

        const element = await setupElement(initialConfig, RecordFields);
        const representation = element.getWiredData();

        await element.notifyChange([{ recordId: representation.id }]);

        expect(element.pushCount()).toBe(2);

        const expected = {
            ...refreshMock,
            fields: {},
        };

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(expected);
    });

    it('returns a populated lookup field that was previously null', async () => {
        const initialMock = getMock('record-TestD__c-fields-TestD__c.TestC__r-null');
        const initialConfig = {
            recordId: initialMock.id,
            optionalFields: ['TestD__c.TestC__r.Id'],
        };

        const refreshMock = getMock('record-TestD__c-fields-TestD__c.TestC__r.Id-populated');

        mockGetRecordNetwork(initialConfig, [initialMock, refreshMock]);

        const element = await setupElement(initialConfig, RecordFields);
        const representation = element.getWiredData();

        await element.notifyChange([{ recordId: representation.id }]);

        expect(element.pushCount()).toBe(2);

        const expected = {
            ...refreshMock,
            fields: {
                TestC__r: refreshMock.fields.TestC__r,
            },
        };

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(expected);
    });

    it('returns a null lookup field that was previously populated', async () => {
        const initialMock = getMock('record-TestD__c-fields-TestD__c.TestC__r.Id-populated');
        const initialConfig = {
            recordId: initialMock.id,
            optionalFields: ['TestD__c.TestC__r.Id'],
        };

        mockGetRecordNetwork(initialConfig, initialMock);

        const refreshMock = getMock('record-TestD__c-TestD__c.TestC__r-null-refreshed');
        const refreshconfig = {
            recordId: refreshMock.id,
            optionalFields: [
                'TestD__c.CreatedBy.Id',
                'TestD__c.CreatedById',
                'TestD__c.CreatedDate',
                'TestD__c.LastModifiedBy.Id',
                'TestD__c.LastModifiedById',
                'TestD__c.LastModifiedDate',
                'TestD__c.Name',
                'TestD__c.Owner.Id',
                'TestD__c.OwnerId',
                'TestD__c.TestC__c',
                'TestD__c.TestC__r.Id',
            ],
        };

        if (!getTrackedFieldLeafNodeIdOnly()) {
            refreshconfig.optionalFields.push(
                'TestD__c.CreatedBy.Name',
                'TestD__c.LastModifiedBy.Name',
                'TestD__c.Owner.Name'
            );
            refreshconfig.optionalFields.sort();
        }

        mockGetRecordNetwork(refreshconfig, refreshMock);

        const element = await setupElement(initialConfig, RecordFields);
        const representation = element.getWiredData();

        await element.notifyChange([{ recordId: representation.id }]);

        expect(element.pushCount()).toBe(2);

        const expected = {
            ...refreshMock,
            fields: {
                TestC__r: {
                    value: null,
                    displayValue: null,
                },
            },
        };

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(expected);
    });

    it('transforms recordId from 15 char format to 18 char format', async () => {
        const mockDataOpportunityName = getMock('record-Opportunity-fields-Opportunity.Name');
        const refreshMockData = getMock('record-Opportunity-fields-Opportunity.Name');
        refreshMockData.lastModifiedDate = new Date(
            new Date(refreshMockData.lastModifiedDate).getTime() + 60 * 1000
        ).toISOString();
        refreshMockData.weakEtag = refreshMockData.weakEtag + 999;

        const recordId18 = mockDataOpportunityName.id;
        const recordId15 = recordId18.slice(0, 15);

        const config = {
            recordId: recordId18,
            fields: ['Opportunity.Name'],
        };

        const refreshConfig = {
            recordId: recordId18,
            optionalFields: ['Opportunity.Name'],
        };

        mockGetRecordNetwork(config, mockDataOpportunityName);
        mockGetRecordNetwork(refreshConfig, refreshMockData);

        const element = await setupElement(config, RecordFields);

        expect(element.pushCount()).toBe(1);

        const representation = element.getWiredData();
        expect(representation).toEqualSnapshotWithoutEtags(mockDataOpportunityName);

        await element.notifyChange([{ recordId: recordId15 }]);

        expect(element.pushCount()).toBe(2);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(refreshMockData);
    });

    it('does not refresh when called with invalid recordId', async () => {
        const mockDataOpportunityName = getMock('record-Opportunity-fields-Opportunity.Name');
        const refreshMockData = getMock('record-Opportunity-fields-Opportunity.Name');
        refreshMockData.lastModifiedDate = new Date(
            new Date(refreshMockData.lastModifiedDate).getTime() + 60 * 1000
        ).toISOString();
        refreshMockData.weakEtag = refreshMockData.weakEtag + 999;

        const validRecordId = mockDataOpportunityName.id;
        const invalidRecordId = 'foobar';

        const config = {
            recordId: validRecordId,
            fields: ['Opportunity.Name'],
        };

        mockGetRecordNetwork(config, mockDataOpportunityName);

        const element = await setupElement(config, RecordFields);

        expect(element.pushCount()).toBe(1);

        const representation = element.getWiredData();
        expect(representation).toEqualSnapshotWithoutEtags(mockDataOpportunityName);

        await element.notifyChange([{ recordId: invalidRecordId }]);

        expect(element.pushCount()).toBe(1);
    });
});
