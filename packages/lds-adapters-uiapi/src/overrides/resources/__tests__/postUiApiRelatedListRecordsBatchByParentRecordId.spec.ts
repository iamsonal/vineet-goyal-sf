import {
    createChildResourceParams,
    ResourceRequestConfig,
} from '../postUiApiRelatedListRecordsBatchByParentRecordId';

const basicResourceRequestConfig: ResourceRequestConfig = {
    urlParams: {
        parentRecordId: 'aParentRecordId',
    },
    body: {
        relatedListParameters: [
            {
                relatedListId: 'relatedList1',
            },
            {
                relatedListId: 'relatedList2',
            },
        ],
    },
};

const standardResourceRequestConfig: ResourceRequestConfig = {
    urlParams: {
        parentRecordId: 'aParentRecordId',
    },
    body: {
        relatedListParameters: [
            {
                relatedListId: 'relatedList1__r',
                fields: ['Opportunity.Name', 'Opportunity.Id'],
                optionalFields: ['Opportunity.AccountName'],
                pageSize: 10,
                sortBy: ['Name'],
            },
            {
                relatedListId: 'relatedList1',
                fields: ['Account.Name'],
                optionalFields: ['Account.Id'],
                pageSize: 15,
                sortBy: ['Account.Name'],
            },
            {
                relatedListId: 'relatedList2',
                fields: ['Account.Name', 'Account.Revenue'],
                optionalFields: ['Account.Id'],
                pageSize: 10,
                sortBy: ['Id'],
            },
        ],
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
                body: {},
            },
            {
                urlParams: {
                    parentRecordId: 'aParentRecordId',
                    relatedListId: 'relatedList2',
                },
                body: {},
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
                body: {
                    fields: ['Opportunity.Name', 'Opportunity.Id'],
                    optionalFields: ['Opportunity.AccountName'],
                    pageSize: 10,
                    sortBy: ['Name'],
                },
            },
            {
                urlParams: {
                    parentRecordId: 'aParentRecordId',
                    relatedListId: 'relatedList1',
                },
                body: {
                    fields: ['Account.Name'],
                    optionalFields: ['Account.Id'],
                    pageSize: 15,
                    sortBy: ['Account.Name'],
                },
            },
            {
                urlParams: {
                    parentRecordId: 'aParentRecordId',
                    relatedListId: 'relatedList2',
                },
                body: {
                    fields: ['Account.Name', 'Account.Revenue'],
                    optionalFields: ['Account.Id'],
                    pageSize: 10,
                    sortBy: ['Id'],
                },
            },
        ]);
    });
});
