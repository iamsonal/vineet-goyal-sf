import { getMock as globalGetMock, setupElement } from 'test-util';
import { extractRecordFields, mockGetRecordUiNetwork } from 'uiapi-test-util';

import RecordUi from '../lwc/record-ui';

function getRecordIdFromMock(mock) {
    return Object.keys(mock.records)[0];
}

const MOCK_PREFIX = 'wire/getRecordUi/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('refresh', () => {
    it('should refresh recordUi', async () => {
        const mockRecordUiData = getMock('single-record-Account-layouttypes-Full-modes-View');
        const recordId = getRecordIdFromMock(mockRecordUiData);
        const recordFields = extractRecordFields(mockRecordUiData.records[recordId]);

        const refershMockUiData = getMock('single-record-Account-layouttypes-Full-modes-View');
        const refreshMockRecord = refershMockUiData.records[recordId];
        refreshMockRecord.lastModifiedDate = new Date(
            new Date(refreshMockRecord.lastModifiedDate).getTime() + 60 * 1000
        ).toISOString();
        refreshMockRecord.weakEtag = refreshMockRecord.weakEtag + 999;

        const config = {
            recordIds: recordId,
            layoutTypes: ['Full'],
            modes: ['View'],
            optionalFields: ['Account.Industry'],
        };

        mockGetRecordUiNetwork(config, mockRecordUiData);

        mockGetRecordUiNetwork(
            {
                ...config,
                optionalFields: recordFields,
            },
            refershMockUiData
        );

        const element = await setupElement(config, RecordUi);

        expect(element.pushCount()).toBe(1);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockRecordUiData);

        await element.refresh();

        expect(element.pushCount()).toBe(2);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(refershMockUiData);
    });
});

describe('Non-layoutable entities', () => {
    it('should emit when layout config is empty', async () => {
        const mock = getMock('record-ui-non-layoutable');
        const recordId = getRecordIdFromMock(mock);
        const config = {
            recordIds: recordId,
            layoutTypes: ['Full'],
            modes: ['View'],
        };

        mockGetRecordUiNetwork(config, mock);

        const element = await setupElement(config, RecordUi);
        expect(element.pushCount()).toBe(1);
        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });
});
