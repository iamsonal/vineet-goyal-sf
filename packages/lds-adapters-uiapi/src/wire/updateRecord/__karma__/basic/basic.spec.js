import { updateRecord } from 'lds-adapters-uiapi';
import { getMock as globalGetMock, setupElement } from 'test-util';
import {
    expireRecords,
    extractRecordFields,
    mockGetRecordNetwork,
    mockUpdateRecordNetwork,
} from 'uiapi-test-util';

import RecordFields from '../../../getRecord/__karma__/lwc/record-fields';

const MOCK_PREFIX = 'wire/updateRecord/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('update record', () => {
    it('passes all parameters, including nulls, to HTTP request', async () => {
        const updateParams = {
            fields: {
                Id: 'a07B0000007BIVQIA4',
                Priority__c: 'P4',
                Impact__c: null,
                Frequency__c: null,
                Product_Tag__c: null,
                Origin__c: 'ADM_WorkLightning',
                RecordTypeId: '0129000000006ByAAI',
            },
            allowSaveOnDuplicate: false,
        };

        const mockResponse = getMock(
            'record-ADM_Work__c-fields-Id,Priority__c,Impact__c,Frequency__c,Product_tag__c,Origin__c,RecordTypeId-updated'
        );

        mockUpdateRecordNetwork(updateParams.fields.Id, updateParams, mockResponse);

        const response = await updateRecord(updateParams);
        expect(response.data).toEqualSnapshotWithoutEtags(mockResponse);
    });

    it('refreshes all record fields when updating a subset of fields', async () => {
        const isDeletedMock = getMock('record-ADM_Work__c-fields-ADM_Work_c.IsDeleted');
        const isDeletedConfig = {
            recordId: isDeletedMock.id,
            fields: ['ADM_Work__c.IsDeleted'],
        };

        mockGetRecordNetwork(isDeletedConfig, isDeletedMock);

        const mockUpdatedResponse = getMock(
            'record-ADM_Work__c-fields-Id,Priority__c,Impact__c,Frequency__c,Product_tag__c,Origin__c,RecordTypeId-updated'
        );
        const updateParams = {
            fields: {
                Id: 'a07B0000007BIVQIA4',
                Priority__c: 'P4',
                Impact__c: null,
                Frequency__c: null,
                Product_Tag__c: null,
                Origin__c: 'ADM_WorkLightning',
                RecordTypeId: '0129000000006ByAAI',
            },
        };
        mockUpdateRecordNetwork(updateParams.fields.Id, updateParams, mockUpdatedResponse);

        const wireA = await setupElement(isDeletedConfig, RecordFields);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(isDeletedMock);

        const expected = getMock('record-ADM_Work__c-fields-ADM_Work_c.IsDeleted');
        expected.fields.IsDeleted.value = !expected.fields.IsDeleted.value;

        const optionalFields = [
            'ADM_Work__c.Assignee__c',
            'ADM_Work__c.Assignee__r.Id',
            'ADM_Work__c.Assignee__r.Name',
            'ADM_Work__c.CreatedBy.Id',
            'ADM_Work__c.CreatedBy.Name',
            'ADM_Work__c.CreatedById',
            'ADM_Work__c.CreatedDate',
            'ADM_Work__c.Description__c',
            'ADM_Work__c.IsDeleted',
            'ADM_Work__c.LastModifiedBy.Id',
            'ADM_Work__c.LastModifiedBy.Name',
            'ADM_Work__c.LastModifiedById',
            'ADM_Work__c.LastModifiedDate',
            'ADM_Work__c.Previous_Comments__c',
            'ADM_Work__c.Priority_Rank__c',
            'ADM_Work__c.Priority__c',
            'ADM_Work__c.Scheduled_Build__c',
            'ADM_Work__c.Scheduled_Build__r',
            'ADM_Work__c.Scrum_Team__c',
            'ADM_Work__c.Scrum_Team__r',
            'ADM_Work__c.Sprint__c',
            'ADM_Work__c.Sprint__r',
            'ADM_Work__c.Status__c',
            'ADM_Work__c.Story_Points__c',
            'ADM_Work__c.Subject__c',
        ];
        const refetchConfig = {
            recordId: isDeletedMock.id,
            optionalFields,
        };

        const refetchMock = getMock(
            'record-ADM_Work__c-fields-IsDeleted-Id,Priority__c,Impact__c,Frequency__c,Product_tag__c,Origin__c,RecordTypeId'
        );
        refetchMock.fields.IsDeleted.value = expected.fields.IsDeleted.value;

        mockGetRecordNetwork(refetchConfig, refetchMock);

        const response = await updateRecord(updateParams);
        expect(response.data).toEqualSnapshotWithoutEtags(mockUpdatedResponse);

        expect(wireA.pushCount()).toBe(2);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(expected);
    });

    it('does not refresh record when all known fields are returned in the update response', async () => {
        const subjectCMock = getMock('record-ADM_Work__c-fields-ADM_Work__c.Subject__c');
        const isDeletedConfig = {
            recordId: subjectCMock.id,
            fields: ['ADM_Work__c.Subject__c'],
        };

        mockGetRecordNetwork(isDeletedConfig, subjectCMock);

        const mockUpdatedResponse = getMock(
            'record-ADM_Work__c-fields-Id,Priority__c,Impact__c,Frequency__c,Product_tag__c,Origin__c,RecordTypeId-updated'
        );
        const updateParams = {
            apiName: 'ADM_Work__c',
            fields: {
                Id: 'a07B0000007BIVQIA4',
                Priority__c: 'P4',
                Impact__c: null,
                Frequency__c: null,
                Product_Tag__c: null,
                Origin__c: 'ADM_WorkLightning',
                RecordTypeId: '0129000000006ByAAI',
            },
        };
        mockUpdateRecordNetwork(updateParams.fields.Id, updateParams, mockUpdatedResponse);

        const wireA = await setupElement(isDeletedConfig, RecordFields);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(subjectCMock);

        const response = await updateRecord(updateParams);
        expect(response.data).toEqualSnapshotWithoutEtags(mockUpdatedResponse);

        // The updated data has changed the underlying record,
        // so wireA gets a new push
        expect(wireA.pushCount()).toBe(2);
    });

    it('includes fields from update response when refreshing an expired record', async () => {
        const mockUpdatedResponse = getMock('record-ADM_Work__c-fields-ADM_Work_c.IsDeleted');
        const updateParams = {
            fields: {
                Id: 'a07B0000007BIVQIA4',
                Priority__c: 'P4',
                Impact__c: null,
                Frequency__c: null,
                Product_Tag__c: null,
                Origin__c: 'ADM_WorkLightning',
                RecordTypeId: '0129000000006ByAAI',
            },
        };
        mockUpdateRecordNetwork(updateParams.fields.Id, updateParams, mockUpdatedResponse);

        const mockGetExpiredRecord = getMock(
            'record-ADM_Work__c-fields-ADM_Work__c.Subject__c,IsDeleted'
        );
        const getExpiredRecordConfig = {
            recordId: mockGetExpiredRecord.id,
            fields: ['ADM_Work__c.Subject__c'],
        };

        mockGetRecordNetwork(
            {
                recordId: mockGetExpiredRecord.id,
                fields: getExpiredRecordConfig.fields,
                optionalFields: ['ADM_Work__c.IsDeleted'],
            },
            mockGetExpiredRecord
        );

        await updateRecord(updateParams);

        expireRecords();

        const wireA = await setupElement(getExpiredRecordConfig, RecordFields);
        delete mockGetExpiredRecord.fields.IsDeleted;
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mockGetExpiredRecord);
    });

    it('ingests response from update response so subsequent reads may avoid network trips', async () => {
        const mockUpdatedResponse = getMock(
            'record-ADM_Work__c-fields-Id,Priority__c,Impact__c,Frequency__c,Product_tag__c,Origin__c,RecordTypeId-updated'
        );
        const updateParams = {
            fields: {
                Id: 'a07B0000007BIVQIA4',
                Priority__c: 'P4',
                Impact__c: null,
                Frequency__c: null,
                Product_Tag__c: null,
                Origin__c: 'ADM_WorkLightning',
                RecordTypeId: '0129000000006ByAAI',
            },
        };
        mockUpdateRecordNetwork(updateParams.fields.Id, updateParams, mockUpdatedResponse);

        await updateRecord(updateParams);

        const apiName = mockUpdatedResponse.apiName;
        const fields = Object.keys(mockUpdatedResponse.fields).map(field => {
            const value = mockUpdatedResponse.fields[field].value;
            if (typeof value === 'object') {
                return `${apiName}.${field}.Id`;
            }
            return `${apiName}.${field}`;
        });

        const expectedCacheHitConfig = {
            recordId: mockUpdatedResponse.id,
            fields,
        };

        await setupElement(expectedCacheHitConfig, RecordFields);
    });

    it('incorporates clientOptions parameter in HTTP request', async () => {
        const updateParams = {
            apiName: 'ADM_Work__c',
            fields: {
                Id: 'a07B0000007BIVQIA4',
                Priority__c: 'P4',
                Impact__c: null,
                Frequency__c: null,
                Product_Tag__c: null,
                Origin__c: 'ADM_WorkLightning',
                RecordTypeId: '0129000000006ByAAI',
            },
        };

        const mockResponse = getMock(
            'record-ADM_Work__c-fields-Id,Priority__c,Impact__c,Frequency__c,Product_tag__c,Origin__c,RecordTypeId-updated'
        );

        const headers = {
            'If-Unmodified-Since': '2012-01-01',
        };
        mockUpdateRecordNetwork(updateParams.fields.Id, updateParams, mockResponse, headers);

        const response = await updateRecord(updateParams, {
            ifUnmodifiedSince: '2012-01-01',
        });
        expect(response.data).toEqualSnapshotWithoutEtags(mockResponse);
    });

    it('passes allowSaveOnDuplicate to HTTP request', async () => {
        const updateParams = {
            apiName: 'ADM_Work__c',
            fields: {
                Id: 'a07B0000007BIVQIA4',
                Priority__c: 'P4',
                Impact__c: null,
                Frequency__c: null,
                Product_Tag__c: null,
                Origin__c: 'ADM_WorkLightning',
                RecordTypeId: '0129000000006ByAAI',
            },
            allowSaveOnDuplicate: true,
        };

        const mockResponse = getMock(
            'record-ADM_Work__c-fields-Id,Priority__c,Impact__c,Frequency__c,Product_tag__c,Origin__c,RecordTypeId-updated'
        );

        mockUpdateRecordNetwork(updateParams.fields.Id, updateParams, mockResponse);

        const response = await updateRecord(updateParams);
        expect(response.data).toEqualSnapshotWithoutEtags(mockResponse);
    });

    it('propagates an immutable error when server rejects request', async () => {
        const updateParams = {
            fields: {
                Id: 'a07B0000007BIVQIA4',
                Priority__c: 'P4',
                Impact__c: null,
                Frequency__c: null,
                Product_Tag__c: null,
                Origin__c: 'ADM_WorkLightning',
                RecordTypeId: '0129000000006ByAAI',
            },
            allowSaveOnDuplicate: false,
        };

        const mockError = { message: 'Error occured' };
        mockUpdateRecordNetwork(updateParams.fields.Id, updateParams, {
            reject: true,
            data: mockError,
        });

        try {
            await updateRecord(updateParams);
            // Make sure we went into the try..catch
            fail('updateRecord did not throw');
        } catch (e) {
            expect(e.body).toEqual({
                message: 'Error occured',
            });
            try {
                e.body.message = 'changed';
            } catch (e) {
                // do nothing
            }

            expect(e.body).toEqual({
                message: 'Error occured',
            });
        }
    });

    it('rebroadcasts when there are no extra fields to refresh', async () => {
        const subjectCMock = getMock('record-ADM_Work__c-fields-ADM_Work__c.Subject__c');
        const recordConfig = {
            recordId: subjectCMock.id,
            fields: ['ADM_Work__c.Subject__c'],
        };

        mockGetRecordNetwork(recordConfig, subjectCMock);

        const mockUpdatedResponse = getMock(
            'record-ADM_Work__c-fields-Id,Priority__c,Impact__c,Frequency__c,Product_tag__c,Origin__c,RecordTypeId-updated'
        );
        const updateParams = {
            fields: {
                Id: subjectCMock.id,
                Priority__c: 'P4',
                Impact__c: null,
                Frequency__c: null,
                Product_Tag__c: null,
                Origin__c: 'ADM_WorkLightning',
                RecordTypeId: subjectCMock.recordTypeId,
            },
        };
        mockUpdateRecordNetwork(updateParams.fields.Id, updateParams, mockUpdatedResponse);

        const wireA = await setupElement(recordConfig, RecordFields);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(subjectCMock);

        const response = await updateRecord(updateParams);
        expect(response.data).toEqualSnapshotWithoutEtags(mockUpdatedResponse);

        const expectedFields = {};
        Object.keys(subjectCMock.fields).forEach(fieldName => {
            expectedFields[fieldName] = mockUpdatedResponse.fields[fieldName];
        });

        const expected = {
            ...mockUpdatedResponse,
            fields: expectedFields,
        };

        expect(wireA.pushCount()).toBe(2);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(expected);
    });

    it('should emit when SysModstamp field is updated on refresh', async () => {
        const mock = getMock(
            'record-Opportunity-fields-Opportunity.Name,Opportunity.SystemModstamp'
        );
        const mockUpdatedResponse = getMock(
            'record-Opportunity-fields-Opportunity.Name,Opportunity.SystemModstamp--updated'
        );
        const firstResponseMock = getMock(
            'record-Opportunity-fields-Opportunity.Name,Opportunity.SystemModstamp--first-refresh'
        );

        const initialConfig = {
            recordId: mock.id,
            optionalFields: [
                'Opportunity.Name',
                'Opportunity.NoExist',
                'Opportunity.SystemModstamp',
            ],
        };

        const updateConfig = {
            fields: {
                Id: mock.id,
                Name: 'One',
            },
        };

        // 'Opportunity.NoExist', 'Opportunity.SystemModstamp' do not come back on update record request
        const firstRefreshConfig = {
            recordId: mock.id,
            optionalFields: extractRecordFields(mockUpdatedResponse)
                .concat(['Opportunity.NoExist', 'Opportunity.SystemModstamp'])
                .sort(),
        };

        mockGetRecordNetwork(initialConfig, mock);
        mockUpdateRecordNetwork(updateConfig.fields.Id, updateConfig, mockUpdatedResponse);
        mockGetRecordNetwork(firstRefreshConfig, firstResponseMock);

        // First, load the record into an element
        const elm = await setupElement(initialConfig, RecordFields);

        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);

        // Second, update the record
        await updateRecord(updateConfig);

        expect(elm.pushCount()).toBe(2);
    });

    it('should send correct XHR when updating a numeric field with float value', async () => {
        const mockResponse = getMock(
            'record-Opportunity-fields-Opportunity.Name,Opportunity.SystemModstamp'
        );

        const updateParams = {
            fields: {
                Id: mockResponse.id,
                Float_Field__c: 12.3,
            },
            allowSaveOnDuplicate: false,
        };

        mockUpdateRecordNetwork(mockResponse.id, updateParams, mockResponse);

        const response = await updateRecord(updateParams);
        expect(response.data).toEqualSnapshotWithoutEtags(mockResponse);
    });

    it('should send correct XHR when updating a numeric field with integer value', async () => {
        const mockResponse = getMock(
            'record-Opportunity-fields-Opportunity.Name,Opportunity.SystemModstamp'
        );

        const updateParams = {
            fields: {
                Id: mockResponse.id,
                Float_Field__c: 12,
            },
            allowSaveOnDuplicate: false,
        };

        mockUpdateRecordNetwork(mockResponse.id, updateParams, mockResponse);

        const response = await updateRecord(updateParams);
        expect(response.data).toEqualSnapshotWithoutEtags(mockResponse);
    });
});
