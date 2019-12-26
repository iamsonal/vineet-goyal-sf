import GetPicklistValuesByRecordType from '../lwc/get-picklist-values-by-record-type';
import { getMock as globalGetMock, setupElement } from 'test-util';
import { MASTER_RECORD_TYPE_ID, mockGetPicklistValuesNetwork } from 'uiapi-test-util';

const MOCK_PREFIX = 'wire/getPicklistValuesByRecordType/__karma__/discriminator/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

describe('discriminator picklist values by record type', () => {
    it('should emit OpportunityStage attributes', async () => {
        const mock = getMock('picklist-Opportunity-MasterRecordTypeId');

        const config = {
            objectApiName: 'Opportunity',
            recordTypeId: MASTER_RECORD_TYPE_ID,
        };

        mockGetPicklistValuesNetwork(config, mock);

        const elm = await setupElement(config, GetPicklistValuesByRecordType);
        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });

    it('should emit CaseStatus attributes', async () => {
        const mock = getMock('picklist-Case-MasterRecordTypeId');

        const config = {
            objectApiName: 'Case',
            recordTypeId: MASTER_RECORD_TYPE_ID,
        };

        mockGetPicklistValuesNetwork(config, mock);

        const elm = await setupElement(config, GetPicklistValuesByRecordType);
        expect(elm.pushCount()).toBe(1);
        expect(elm.getWiredData()).toEqualSnapshotWithoutEtags(mock);
    });
});
