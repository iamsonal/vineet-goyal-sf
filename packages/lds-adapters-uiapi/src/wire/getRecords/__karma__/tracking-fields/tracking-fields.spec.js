import { getMock as globalGetMock, setupElement, clone } from 'test-util';
import { mockGetRecordsNetwork, mockGetRecordNetwork } from 'uiapi-test-util';
import GetRecords from '../lwc/get-records';
import RecordFields from '../../../getRecord/__karma__/lwc/record-fields';
import { getIdsFromGetRecordsMock } from '../testUtil';
const MOCK_PREFIX = 'wire/getRecords/__karma__/tracking-fields/data/';

function getMock(fileName) {
    return globalGetMock(MOCK_PREFIX + fileName);
}

describe('tracking fields', () => {
    it('should not include 6-level lookup fields', async () => {
        const combinedMock = getMock('records-6-level-lookup-fields');
        const recordIds = getIdsFromGetRecordsMock(combinedMock);

        // prime cache with records which may yield 6-level lookup fields
        // e.g. Account.Parent.Parent.Parent.Parent.Parent.Parent.Id
        const config = {
            records: [
                {
                    recordIds,
                    fields: ['Account.Parent.Id'],
                },
            ],
        };
        mockGetRecordsNetwork(config, combinedMock);
        await setupElement(config, GetRecords);

        // request the root record to verify that tracking fields don't include 6-level lookup fields
        const recordMock = getMock('record-single-record-Account');
        const recordId = recordMock.id;
        const recordConfig = {
            recordId: recordId,
            fields: ['Account.Name'],
        };

        mockGetRecordNetwork(
            {
                ...recordConfig,
                optionalFields: [
                    'Account.Parent.Id',
                    'Account.Parent.Parent.Id',
                    'Account.Parent.Parent.Parent.Id',
                    'Account.Parent.Parent.Parent.Parent.Id',
                    'Account.Parent.Parent.Parent.Parent.Parent.Id',
                    'Account.Parent.Parent.Parent.Parent.ParentId',
                    'Account.Parent.Parent.Parent.ParentId',
                    'Account.Parent.Parent.ParentId',
                    'Account.Parent.ParentId',
                    'Account.ParentId',
                ],
            },
            recordMock
        );
        const element = await setupElement(recordConfig, RecordFields);

        const expectedData = clone(recordMock);
        // remove tracking fields
        delete expectedData.fields.Parent;
        delete expectedData.fields.ParentId;

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(expectedData);
    });
});
