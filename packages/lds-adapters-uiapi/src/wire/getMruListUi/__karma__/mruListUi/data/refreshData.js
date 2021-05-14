const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);

const OBJECT_API_NAME = 'Opportunity';

// ensure MRU contains some records
const listRecords = await helpers.requestGet(
    `/ui-api/list-records/${OBJECT_API_NAME}/AllOpportunities`
);
const recordIds = listRecords.records.map((r) => `'${r.id}'`).join(',');
await $conn.query(`SELECT Id FROM ${OBJECT_API_NAME} WHERE Id IN (${recordIds}) FOR VIEW`);

const entries = [
    {
        filename: 'mru-list-ui-Opportunity',
        endpoint: 'mru-list-ui',
        params: '',
    },

    // mru-list-ui/mru-list-records with caching
    {
        filename: 'mru-list-ui-Opportunity-pageSize-3',
        endpoint: 'mru-list-ui',
        params: '?pageSize=3',
    },
    {
        filename: 'mru-list-ui-Opportunity-pageToken-3-pageSize-3',
        endpoint: 'mru-list-ui',
        params: '?pageToken=3&pageSize=3',
    },
    {
        filename: 'mru-list-ui-Opportunity-pageSize-6',
        endpoint: 'mru-list-ui',
        params: '?pageSize=6',
    },
    {
        filename: 'mru-list-records-Opportunity-pageToken-3-pageSize-3',
        endpoint: 'mru-list-records',
        params: '?pageToken=3&pageSize=3',
    },

    // mru-list-ui/mru-list-records with caching & sortBy
    {
        filename: 'mru-list-ui-Opportunity-pageSize-3-sortBy-Account.Name',
        endpoint: 'mru-list-ui',
        params: '?pageSize=3&sortBy=Account.Name',
    },
    {
        filename: 'mru-list-ui-Opportunity-pageToken-3-pageSize-3-sortBy-Account.Name',
        endpoint: 'mru-list-ui',
        params: '?pageToken=3&pageSize=3&sortBy=Account.Name',
    },
    {
        filename: 'mru-list-ui-Opportunity-pageSize-6-sortBy-Account.Name',
        endpoint: 'mru-list-ui',
        params: '?pageSize=6&sortBy=Account.Name',
    },
    {
        filename: 'mru-list-records-Opportunity-pageToken-3-pageSize-3-sortBy-Account.Name',
        endpoint: 'mru-list-records',
        params: '?pageToken=3&pageSize=3&sortBy=Account.Name',
    },

    // sortBy
    {
        filename: 'mru-list-ui-Opportunity-pageSize-3-sortBy--Account.Name',
        endpoint: 'mru-list-ui',
        params: '?pageSize=3&sortBy=-Account.Name',
    },

    // string/schema fields/optionalFields
    {
        filename: 'mru-list-ui-Opportunity-pageSize-1-fields-IsPrivate,NextStep',
        endpoint: 'mru-list-ui',
        params: '?pageSize=1&fields=IsPrivate,NextStep',
    },
    {
        filename:
            'mru-list-ui-Opportunity-pageSize-1-fields-Opportunity.IsPrivate,Opportunity.NextStep',
        endpoint: 'mru-list-ui',
        params: '?pageSize=1&fields=Opportunity.IsPrivate,Opportunity.NextStep',
    },
    {
        filename: 'mru-list-ui-Opportunity-pageSize-1-optionalFields-IsPrivate,NextStep',
        endpoint: 'mru-list-ui',
        params: '?pageSize=1&optionalFields=IsPrivate,NextStep',
    },
    {
        filename:
            'mru-list-ui-Opportunity-pageSize-1-optionalFields-Opportunity.IsPrivate,Opportunity.NextStep',
        endpoint: 'mru-list-ui',
        params: '?pageSize=1&optionalFields=Opportunity.IsPrivate,Opportunity.NextStep',
    },

    // magic fields
    {
        filename: 'mru-list-ui-Lead-pageSize-1',
        endpoint: 'mru-list-ui',
        params: '?pageSize=1',
    },
];

entries.forEach(async function (entry) {
    await helpers.requestGetAndSave(
        `/ui-api/${entry.endpoint}/${OBJECT_API_NAME}${entry.params}`,
        path.join(rootDir, `${entry.filename}.json`)
    );
});
