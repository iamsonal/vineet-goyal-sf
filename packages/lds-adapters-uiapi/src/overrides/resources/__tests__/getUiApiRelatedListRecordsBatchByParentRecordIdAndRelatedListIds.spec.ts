import {
    createChildResourceParams,
    ResourceRequestConfig,
} from '../getUiApiRelatedListRecordsBatchByParentRecordIdAndRelatedListIds';

const basicResourceRequestConfig: ResourceRequestConfig = {
    urlParams: {
        parentRecordId: 'aParentRecordId',
        relatedListIds: ['relatedList1', 'relatedList2'],
    },
    queryParams: {},
};

const standardResourceRequestConfig: ResourceRequestConfig = {
    urlParams: {
        parentRecordId: 'aParentRecordId',
        relatedListIds: ['relatedList1', 'relatedList2'],
    },
    queryParams: {
        fields:
            'relatedList1:Opportunity.Name,Opportunity.Id;relatedList2:Account.Name,Account.Revenue',
        optionalFields: 'relatedList1:Opportunity.AccountName;relatedList2:Account.Id',
        pageSize: 'relatedList1:10;relatedList2:10',
        sortBy: 'relatedList1:Name;relatedList2:Id',
    },
};

describe('createChildResourceParams', () => {
    it('parses url parameters correctly', async () => {
        expect(createChildResourceParams(basicResourceRequestConfig)).toEqual([
            {
                urlParams: {
                    parentRecordId: 'aParentRecordId',
                    relatedListId: 'relatedList1',
                },
                queryParams: {},
            },
            {
                urlParams: {
                    parentRecordId: 'aParentRecordId',
                    relatedListId: 'relatedList2',
                },
                queryParams: {},
            },
        ]);
    });

    it('parses query parameters correctly', async () => {
        expect(createChildResourceParams(standardResourceRequestConfig)).toEqual([
            {
                urlParams: {
                    parentRecordId: 'aParentRecordId',
                    relatedListId: 'relatedList1',
                },
                queryParams: {
                    fields: ['Opportunity.Name', 'Opportunity.Id'],
                    optionalFields: ['Opportunity.AccountName'],
                    pageSize: 10,
                    sortBy: ['Name'],
                },
            },
            {
                urlParams: {
                    parentRecordId: 'aParentRecordId',
                    relatedListId: 'relatedList2',
                },
                queryParams: {
                    fields: ['Account.Name', 'Account.Revenue'],
                    optionalFields: ['Account.Id'],
                    pageSize: 10,
                    sortBy: ['Id'],
                },
            },
        ]);
    });
});
