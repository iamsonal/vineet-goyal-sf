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

await helpers.requestGetAndSave(
    `/ui-api/mru-list-ui/${OBJECT_API_NAME}?pageSize=1`,
    path.join(rootDir, 'mru-list-ui-Lead-pageSize-1.json')
);
