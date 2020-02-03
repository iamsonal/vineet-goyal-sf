import { getMock as globalGetMock, setupElement } from 'test-util';
import { mockGetRecordNetwork } from 'uiapi-test-util';

import RecordFields from '../lwc/record-fields';

const MOCK_PREFIX = 'wire/getRecord/__karma__/basic/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('basic', () => {
    it('fetches data from network', async () => {
        const mockData = getMock('record-Account-fields-Account.Id,Account.Name');
        const config = {
            recordId: mockData.id,
            fields: ['Account.Id', 'Account.Name'],
        };
        mockGetRecordNetwork(config, mockData);

        const element = await setupElement(config, RecordFields);

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
    });

    it('fetch record which does not support record type', async () => {
        const mockData = getMock('record-User-fields-User.Id,User.Name');
        const config = {
            recordId: mockData.id,
            fields: ['User.Id', 'User.Name'],
        };
        mockGetRecordNetwork(config, mockData);

        const element = await setupElement(config, RecordFields);

        expect(element.getWiredData()).toEqualSnapshotWithoutEtags(mockData);
    });
});
