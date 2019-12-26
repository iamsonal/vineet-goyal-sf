const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);

const MASTER_RECORD_TYPE_ID = '012000000000000AAA';

const entries = [
    {
        // picklist values without fieldApiName parma in url
        objectApiName: 'Account',
        recordTypeId: MASTER_RECORD_TYPE_ID,
        filename: 'picklist-Account-MasterRecordTypeId',
    },
    {
        // picklist values with fieldApiName parma in url
        objectApiName: 'Account',
        recordTypeId: MASTER_RECORD_TYPE_ID,
        fieldApiName: 'Type',
        filename: 'picklist-Account-MasterRecordTypeId-fieldApiName-Type',
    },
    {
        objectApiName: 'AccountFoo',
        recordTypeId: MASTER_RECORD_TYPE_ID,
        filename: 'picklist-Account-bad-objectApiName',
    },
];

entries.forEach(async ({ fieldApiName, filename, objectApiName, recordTypeId }) => {
    let url = `/ui-api/object-info/${objectApiName}/picklist-values/${recordTypeId}`;
    if (fieldApiName) {
        url += `/${fieldApiName}`;
    }
    await helpers.requestGetAndSave(url, path.join(rootDir, `${filename}.json`));
});
