const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);

const MASTER_RECORD_TYPE_ID = '012000000000000AAA';

const entries = [
    {
        objectApiName: 'Opportunity',
        recordTypeId: MASTER_RECORD_TYPE_ID,
        filename: 'picklist-Opportunity-MasterRecordTypeId',
    },
    {
        // picklist values with fieldApiName parma in url
        objectApiName: 'Case',
        recordTypeId: MASTER_RECORD_TYPE_ID,
        filename: 'picklist-Case-MasterRecordTypeId',
    },
];

entries.forEach(async ({ filename, objectApiName, recordTypeId }) => {
    let url = `/ui-api/object-info/${objectApiName}/picklist-values/${recordTypeId}`;
    await helpers.requestGetAndSave(url, path.join(rootDir, `${filename}.json`));
});
