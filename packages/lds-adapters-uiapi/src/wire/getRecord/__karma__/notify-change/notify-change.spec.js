import { getMock as globalGetMock, setupElement } from 'test-util';
import { mockGetRecordNetwork } from 'uiapi-test-util';

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
});
