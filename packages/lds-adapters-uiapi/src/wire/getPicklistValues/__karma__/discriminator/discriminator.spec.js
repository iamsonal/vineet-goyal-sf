import { getMock as globalGetMock, setupElement } from 'test-util';
import { MASTER_RECORD_TYPE_ID, mockGetPicklistValuesNetwork } from 'uiapi-test-util';

import GetPicklistValues from '../lwc/get-picklist-values';

const MOCK_PREFIX = 'wire/getPicklistValues/__karma__/discriminator/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('discriminator picklist values', () => {
    it('should emit CaseStatus attributes', async () => {
        const mock = getMock('picklist-Case-MasterRecordTypeId-Status');

        const config = {
            recordTypeId: MASTER_RECORD_TYPE_ID,
            fieldApiName: 'Case.Status',
        };

        mockGetPicklistValuesNetwork(config, mock);

        const elm = await setupElement(config, GetPicklistValues);
        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });

    it('should emit OpportunityStage attributes', async () => {
        const mock = getMock('picklist-Opportunity-MasterRecordTypeId-StageName');

        const config = {
            recordTypeId: MASTER_RECORD_TYPE_ID,
            fieldApiName: 'Opportunity.StageName',
        };

        mockGetPicklistValuesNetwork(config, mock);

        const elm = await setupElement(config, GetPicklistValues);
        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });
});
