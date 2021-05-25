import { getMock as globalGetMock, setupElement, clone } from 'test-util';
import { expireRecords, mockCreateRecordNetwork, mockGetRecordNetwork } from 'uiapi-test-util';
import { createRecord } from 'lds-adapters-uiapi';

import RecordFields from '../../getRecord/__karma__/lwc/record-fields';

const MOCK_PREFIX = 'wire/createRecord/__karma__/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('createRecord', () => {
    const createRecordConfig = {
        apiName: 'Opportunity',
        fields: {
            Name: 'Foo',
            StageName: 'Stage',
            CloseDate: '2020-01-01T00:26:58+00:00',
        },
        allowSaveOnDuplicate: false,
        useDefaultRule: false,
        triggerOtherEmail: false,
        triggerUserEmail: false,
    };
    it('should make return correct snapshot data', async () => {
        const mockRecord = getMock('record-Opportunity-new');
        mockCreateRecordNetwork(createRecordConfig, mockRecord);

        const data = await createRecord(createRecordConfig);

        expect(data).toEqualSnapshotWithoutEtags(mockRecord);
    });

    it('should not hit the network when another wire tries to access the newly created record', async () => {
        const mockRecord = getMock('record-Opportunity-new');
        mockCreateRecordNetwork(createRecordConfig, mockRecord);

        await createRecord(createRecordConfig);

        const mockGetRecord = getMock(
            'record-Opportunity-fields-Opportunity.Account.Id,Opportunity.Account.Name'
        );
        const element = await setupElement(
            {
                recordId: mockRecord.id,
                fields: [
                    'Opportunity.Account.Id',
                    'Opportunity.Account.Name',
                    'Opportunity.AccountId',
                ],
            },
            RecordFields
        );

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockGetRecord);
    });

    it('should hit the network when another wire tries to access created record after it has expired', async () => {
        const mockRecord = getMock('record-Opportunity-new');
        const recordId = mockRecord.id;
        mockCreateRecordNetwork(createRecordConfig, mockRecord);

        const mockGetRecord = getMock(
            'record-Opportunity-fields-Opportunity.Account.Id,Opportunity.Account.Name'
        );
        const recordConfig = {
            recordId,
            fields: ['Opportunity.Account.Id', 'Opportunity.Account.Name', 'Opportunity.AccountId'],
        };
        mockGetRecordNetwork(recordConfig, mockGetRecord);

        await createRecord(createRecordConfig);

        expireRecords();

        const element = await setupElement(recordConfig, RecordFields);

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockGetRecord);
    });

    it('should make network request when component tries to access untracked fields on created record', async () => {
        const mockRecord = getMock('record-Opportunity-new');
        const recordId = mockRecord.id;
        mockCreateRecordNetwork(createRecordConfig, mockRecord);

        const mockRecordGet = getMock('record-Opportunity-fields-Opportunity.FiscalYear');
        const recordConfig = {
            recordId,
            fields: ['Opportunity.FiscalYear'],
        };
        mockGetRecordNetwork(recordConfig, mockRecordGet);

        await createRecord(createRecordConfig);

        const element = await setupElement(recordConfig, RecordFields);

        expect(element.pushCount()).toBe(1);
    });

    it('should make network request when component tries to access untracked fields on created record that is stale', async () => {
        const mockRecord = getMock('record-Opportunity-new');
        const recordId = mockRecord.id;
        mockCreateRecordNetwork(createRecordConfig, mockRecord);

        const mockRecordGet = getMock('record-Opportunity-fields-Opportunity.FiscalYear');
        const recordConfig = {
            recordId,
            fields: ['Opportunity.FiscalYear'],
        };
        mockGetRecordNetwork(recordConfig, mockRecordGet);

        await createRecord(createRecordConfig);

        expireRecords();

        const element = await setupElement(recordConfig, RecordFields);

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockRecordGet);
    });

    /*
     * The schema for this is as follows:
     * Parent_Object__c has a Roll-Up Summary Field to COUNT the number of Child_Object__c children
     *   --> Parent_Object__c.Child_Object_Count__c
     * Child_Object__c has a master-detail lookup to Parent_Object__c
     *   --> Child_Object__c.Parent_Object__r
     */
    it('should resolve record merge conflicts when the payload contains updated spanning record', async () => {
        const childMockRecord = getMock('record-Child_Object__c-new');
        const childRecordConfig = {
            allowSaveOnDuplicate: false,
            apiName: 'Child_Object__c',
            fields: {
                CurrencyIsoCode: 'USD',
                Name: '4',
                Parent_Object__c: 'a06xx000001a2lIAAQ',
            },
        };
        mockCreateRecordNetwork(childRecordConfig, childMockRecord);

        const parentMockRecordGetOld = getMock('record-Parent_Object__c-fields-all-old');
        const recordId = parentMockRecordGetOld.id;
        const parentMockRecordGetUpdated = getMock('record-Parent_Object__c-fields-all-updated');
        const parentRecordConfig = {
            recordId,
            fields: ['Parent_Object__c.Child_Object_Count__c'],
        };
        const recordConfigRefresh = {
            recordId,
            optionalFields: [
                'Parent_Object__c.Child_Object_Count__c',
                'Parent_Object__c.Id',
                'Parent_Object__c.Name',
            ],
        };
        mockGetRecordNetwork(parentRecordConfig, parentMockRecordGetOld);
        mockGetRecordNetwork(recordConfigRefresh, parentMockRecordGetUpdated);

        // Request ParentObject, create ChildObject
        const element = await setupElement(parentRecordConfig, RecordFields);
        await createRecord(childRecordConfig);

        const parentMockRecordWithoutNameId = clone(parentMockRecordGetUpdated);
        delete parentMockRecordWithoutNameId.fields.Id;
        delete parentMockRecordWithoutNameId.fields.Name;

        expect(element.pushCount()).toBe(2);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(parentMockRecordWithoutNameId);
    });
});

describe('error', () => {
    const config = {
        apiName: 'Opportunity',
        fields: {
            Name: 'Imperative adapter methods',
        },
        allowSaveOnDuplicate: true,
    };

    it('should reject when server returns an error', async () => {
        const mockError = {
            message: 'Error occured',
        };

        mockCreateRecordNetwork(config, { reject: true, data: mockError });

        try {
            await createRecord(config);
        } catch (e) {
            expect(e).toContainErrorResponse(mockError);
        }
    });

    it('should emit read-only error', async () => {
        const mockError = {
            message: 'Error occured',
        };

        mockCreateRecordNetwork(config, { reject: true, data: mockError });

        try {
            await createRecord(config);
            // make sure we are hitting the catch
            fail('createRecord did not throw');
        } catch (e) {
            try {
                e.body.message = 'changed';
            } catch (e) {
                // do nothing
            }
            expect(e).toContainErrorResponse(mockError);
        }
    });
});
