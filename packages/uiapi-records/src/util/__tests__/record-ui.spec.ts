import recordUi from './data/record-ui';

import { getRecordUiMissingRecordLookupFields } from '../record-ui';
import { RecordUiRepresentation } from '../../generated/types/RecordUiRepresentation';

function clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
}

describe('Object Info Utils', () => {
    describe('getMissingRecordLookupFields', () => {
        it('should return correct fields', () => {
            const cloneRecord = clone<RecordUiRepresentation>(recordUi);

            const fields = getRecordUiMissingRecordLookupFields(cloneRecord);
            expect(fields).toEqual({
                '006RM000003IvA2YAK': [
                    'Opportunity.Account.Id',
                    'Opportunity.Account.Name',
                    'Opportunity.Campaign.Id',
                    'Opportunity.Campaign.Name',
                ],
            });
        });
    });
});
