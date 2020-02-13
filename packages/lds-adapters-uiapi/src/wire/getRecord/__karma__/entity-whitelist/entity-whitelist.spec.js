import { getMock as globalGetMock, setupElement } from 'test-util';
import { expireRecords, mockGetRecordNetwork } from 'uiapi-test-util';

import RecordFields from '../lwc/record-fields';

const MOCK_PREFIX = 'wire/getRecord/__karma__/entity-whitelist/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('entity white list', () => {
    it('should not attempt to refresh merge conflict for unsupported entity', async () => {
        const mock = getMock('record-Account-fields-Account.Owner.Id');
        const config = {
            recordId: mock.id,
            fields: ['Account.Owner.Id'],
        };

        const updatedMock = getMock('record-Account-fields-Account.Owner.Id-newer');

        mockGetRecordNetwork(config, [mock, updatedMock]);

        await setupElement(config, RecordFields);

        // Expire this record because we want to go back to the server
        // to get the updated record
        expireRecords();

        const updated = await setupElement(config, RecordFields);

        delete updatedMock.fields.Owner.value.fields.City;
        expect(updated.getWiredData()).toEqualSnapshotWithoutEtags(updatedMock);
    });
});
