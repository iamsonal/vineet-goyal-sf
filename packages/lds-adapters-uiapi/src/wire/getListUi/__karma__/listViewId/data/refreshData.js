const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);

const LIST_VIEW_NAME = 'All Opportunities';
const id = await helpers.getListViewByName(LIST_VIEW_NAME);

const entries = [
    {
        filename: 'list-ui-All-Opportunities',
        endpoint: 'list-ui',
        params: '',
    },

    // list-ui/list-records with caching
    {
        filename: 'list-ui-All-Opportunities-pageSize-3',
        endpoint: 'list-ui',
        params: '?pageSize=3',
    },
    {
        filename: 'list-ui-All-Opportunities-pageToken-3-pageSize-3',
        endpoint: 'list-ui',
        params: '?pageToken=3&pageSize=3',
    },
    {
        filename: 'list-ui-All-Opportunities-pageSize-6',
        endpoint: 'list-ui',
        params: '?pageSize=6',
    },
    {
        filename: 'list-records-All-Opportunities-pageToken-3-pageSize-3',
        endpoint: 'list-records',
        params: '?pageToken=3&pageSize=3',
    },

    // list-ui/list-records with caching & sortBy
    {
        filename: 'list-ui-All-Opportunities-pageSize-3-sortBy-Account.Name',
        endpoint: 'list-ui',
        params: '?pageSize=3&sortBy=Account.Name',
    },
    {
        filename: 'list-ui-All-Opportunities-pageToken-3-pageSize-3-sortBy-Account.Name',
        endpoint: 'list-ui',
        params: '?pageToken=3&pageSize=3&sortBy=Account.Name',
    },
    {
        filename: 'list-records-All-Opportunities-pageToken-3-pageSize-3-sortBy-Account.Name',
        endpoint: 'list-records',
        params: '?pageToken=3&pageSize=3&sortBy=Account.Name',
    },
    {
        filename: 'list-ui-All-Opportunities-pageSize-6-sortBy-Account.Name',
        endpoint: 'list-ui',
        params: '?pageSize=6&sortBy=Account.Name',
    },

    // sortBy
    {
        filename: 'list-ui-All-Opportunities-pageSize-3-sortBy--Account.Name',
        endpoint: 'list-ui',
        params: '?pageSize=3&sortBy=-Account.Name',
    },

    // string/schema fields/optionalFields
    {
        filename: 'list-ui-All-Opportunities-pageSize-1-fields-IsPrivate,NextStep',
        endpoint: 'list-ui',
        params: '?pageSize=1&fields=IsPrivate,NextStep',
    },
    {
        filename:
            'list-ui-All-Opportunities-pageSize-1-fields-Opportunity.IsPrivate,Opportunity.NextStep',
        endpoint: 'list-ui',
        params: '?pageSize=1&fields=Opportunity.IsPrivate,Opportunity.NextStep',
    },
    {
        filename: 'list-ui-All-Opportunities-pageSize-1-optionalFields-IsPrivate,NextStep',
        endpoint: 'list-ui',
        params: '?pageSize=1&optionalFields=IsPrivate,NextStep',
    },
    {
        filename:
            'list-ui-All-Opportunities-pageSize-1-optionalFields-Opportunity.IsPrivate,Opportunity.NextStep',
        endpoint: 'list-ui',
        params: '?pageSize=1&optionalFields=Opportunity.IsPrivate,Opportunity.NextStep',
    },
];

entries.forEach(async function(entry) {
    await helpers.requestGetAndSave(
        `/ui-api/${entry.endpoint}/${id}${entry.params}`,
        path.join(rootDir, `${entry.filename}.json`)
    );
});
