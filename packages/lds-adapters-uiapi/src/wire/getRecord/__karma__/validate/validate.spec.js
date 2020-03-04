import { getMock as globalGetMock, setupElement } from 'test-util';
import { mockGetRecordNetwork } from 'uiapi-test-util';

import RecordFields from '../lwc/record-fields';

const MOCK_PREFIX = 'wire/getRecord/__karma__/validate/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('validate', () => {
    it('should not throw a validation error when FieldValueRep returns a number (non-integer)', async () => {
        const mockData = getMock('record-Opportunity-fields-Opportunity.Amount');
        const config = {
            recordId: mockData.id,
            fields: ['Opportunity.Amount'],
        };
        mockGetRecordNetwork(config, mockData);

        const element = await setupElement(config, RecordFields);

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
    });
});
