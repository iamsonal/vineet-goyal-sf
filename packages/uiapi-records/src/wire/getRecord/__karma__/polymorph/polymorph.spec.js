import { getMock as globalGetMock, setupElement } from 'test-util';
import { mockGetRecordNetwork } from 'uiapi-test-util';

import RecordFields from '../lwc/record-fields';

const MOCK_PREFIX = 'wire/getRecord/__karma__/polymorph/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('polymorph', () => {
    it('normalizes RecordRepresentation which apiName === "Name"', async () => {
        const mockRecord = getMock('record-Case-fields-Case.Id-Case.Owner.Id-Case.Owner.Type');

        const recordConfig = {
            recordId: mockRecord.id,
            fields: ['Case.Id', 'Case.Owner.Id', 'Case.Owner.Type'],
        };

        mockGetRecordNetwork(recordConfig, mockRecord);

        const elm = await setupElement(recordConfig, RecordFields);
        expect(elm.pushCount()).toBe(1);

        // simulate case owner update
        const mockUserRecord = getMock('record-User-fields-User.Name');
        mockUserRecord.fields.Name.value = 'Foo Bar';

        const userRecordConfig = {
            recordId: mockUserRecord.id,
            fields: ['User.Name'],
        };

        mockGetRecordNetwork(userRecordConfig, mockUserRecord);

        await setupElement(userRecordConfig, RecordFields);

        // push count should not change because user record is normalized with a different key
        // and the wire with case record would not be notified
        expect(elm.pushCount()).toBe(1);
    });
});
