import {
    coerceActualAdapterConfigToGeneratedRepresentation,
    GetRelatedListRecordsBatchConfig,
} from '../getRelatedListRecordsBatch';

const standardAdapterInput: GetRelatedListRecordsBatchConfig = {
    parentRecordId: 'aStandardRecordId',
    relatedLists: [
        {
            relatedListId: 'relatedList1',
            fields: ['Opportunity.Name', 'Opportunity.Id'],
            optionalFields: ['Account.Name', 'Account.Revenue'],
            pageSize: 10,
            sortBy: ['Opportunity.Name', 'Account.Name'],
        },
        {
            relatedListId: 'relatedList2',
            fields: ['Account.Name', 'Account.Id'],
            optionalFields: ['Opportunity.Name', 'Opportunity.Id'],
            pageSize: 6,
            sortBy: ['Account.Name', 'Account.Id'],
        },
    ],
};

describe('getRelatedListRecordsBatch', () => {
    it('converts adapter config to generated config correctly', async () => {
        expect(coerceActualAdapterConfigToGeneratedRepresentation(standardAdapterInput)).toEqual({
            parentRecordId: 'aStandardRecordId',
            relatedListIds: ['relatedList1', 'relatedList2'],
            fields:
                'relatedList1:Opportunity.Name,Opportunity.Id;relatedList2:Account.Name,Account.Id',
            optionalFields:
                'relatedList1:Account.Name,Account.Revenue;relatedList2:Opportunity.Name,Opportunity.Id',
            pageSize: 'relatedList1:10;relatedList2:6',
            sortBy:
                'relatedList1:Opportunity.Name,Account.Name;relatedList2:Account.Name,Account.Id',
        });
    });
});
