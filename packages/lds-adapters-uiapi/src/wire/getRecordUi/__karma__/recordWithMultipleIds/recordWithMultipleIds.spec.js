import { getMock as globalGetMock, setupElement } from 'test-util';
import { mockGetRecordUiNetwork } from 'uiapi-test-util';

import RecordUi from '../lwc/record-ui';
import RecordFields from '../../../getRecord/__karma__/lwc/record-fields';

function getRecordIdsFromMock(mock) {
    return Object.keys(mock.records).sort();
}

const MOCK_PREFIX = 'wire/getRecordUi/__karma__/recordWithMultipleIds/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('multiple recordIds', () => {
    it('should make correct HTTP request when multiple recordIds are present', async () => {
        const mockData = getMock('records-Opportunity-layouttypes-Full-modes-View');
        const config = {
            recordIds: getRecordIdsFromMock(mockData),
            layoutTypes: ['Full'],
            modes: ['View'],
        };
        mockGetRecordUiNetwork(config, mockData);

        const wireA = await setupElement(config, RecordUi);

        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
    });

    it('should NOT make extra HTTP request when getRecord wire is used after getRecordUi with multiple record Ids', async () => {
        const mockData = getMock('records-Opportunity-layouttypes-Full-modes-View');
        const recordIds = getRecordIdsFromMock(mockData);
        const config = {
            recordIds,
            layoutTypes: ['Full'],
            modes: ['View'],
        };
        mockGetRecordUiNetwork(config, mockData);

        await setupElement(config, RecordUi);

        const wireB = await setupElement(
            {
                recordId: recordIds[0],
                fields: ['Opportunity.CloseDate'],
            },
            RecordFields
        );

        expect(wireB.getWiredData()).not.toBeUndefined();
    });
});
