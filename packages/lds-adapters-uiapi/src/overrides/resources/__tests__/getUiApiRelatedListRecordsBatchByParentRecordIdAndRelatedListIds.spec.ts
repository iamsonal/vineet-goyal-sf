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
        relatedListIds: ['relatedList1__r', 'relatedList2', 'relatedList1'],
    },
    queryParams: {
        fields: 'relatedList1__r:Opportunity.Name,Opportunity.Id;relatedList2:Account.Name,Account.Revenue;relatedList1:Account.Name',
        optionalFields:
            'relatedList1__r:Opportunity.AccountName;relatedList2:Account.Id;relatedList1:Account.Id',
        pageSize: 'relatedList1__r:10;relatedList2:10;relatedList1:15',
        sortBy: 'relatedList1__r:Name;relatedList2:Id;relatedList1:Account.Name',
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
                    relatedListId: 'relatedList1__r',
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
            {
                urlParams: {
                    parentRecordId: 'aParentRecordId',
                    relatedListId: 'relatedList1',
                },
                queryParams: {
                    fields: ['Account.Name'],
                    optionalFields: ['Account.Id'],
                    pageSize: 15,
                    sortBy: ['Account.Name'],
                },
            },
        ]);
    });
});
