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
];

entries.forEach(async function (entry) {
    await helpers.requestGetAndSave(
        `/ui-api/${entry.endpoint}/${OBJECT_API_NAME}${entry.params}`,
        path.join(rootDir, `${entry.filename}.json`)
    );
});
