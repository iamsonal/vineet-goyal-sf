import {
    getMock as globalGetMock,
    mockNetworkOnce as globalMockNetworkOnce,
    setupElement,
} from 'test-util';
import { mockGetRecordNetwork } from 'uiapi-test-util';

import { karmaNetworkAdapter } from 'lds';
import sinon from 'sinon';

import GetListUi from '../../../getListUi/__karma__/lwc/listViewId';
import RecordFields from '../lwc/record-fields';

const MOCK_PREFIX = 'wire/getRecord/__karma__/merge/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

function mockListNetworkOnce(mockList) {
    globalMockNetworkOnce(
        karmaNetworkAdapter,
        sinon.match({
            urlParams: {
                listViewId: mockList.info.listReference.id,
            },
        }),
        mockList
    );
}

describe('merge fields', () => {
    it('does not replace non-null displayValue with null', async () => {
        const ownerNameRecordData = getMock('record-Case-fields-Case.CaseNumber,Case.Owner.Name');
        const recordId = ownerNameRecordData.id;
        const ownerNameRecordConfig = {
            recordId,
            fields: ['Case.CaseNumber', 'Case.Owner.Name'],
        };
        mockGetRecordNetwork(ownerNameRecordConfig, ownerNameRecordData);

        const listMockData = getMock('listUi-Case');
        const listConfig = {
            listViewId: listMockData.info.listReference.id,
        };
        mockListNetworkOnce(listMockData);

        // remove fields for which the wire doesn't ask
        const expectedRecordData = getMock('record-Case-fields-Case.CaseNumber,Case.Owner.Name');
        delete expectedRecordData.fields.OwnerId;
        delete expectedRecordData.fields.Owner.value.fields.Id;

        const wireA = await setupElement(ownerNameRecordConfig, RecordFields);
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(expectedRecordData);

        // listUi doesn't ask for Owner.Name, so the displayName of Owner is null.
        await setupElement(listConfig, GetListUi);
        // verify that the displayValue is not replaced by null.
        expect(wireA.getWiredData()).toEqualSnapshotWithoutEtags(expectedRecordData);
    });
});
