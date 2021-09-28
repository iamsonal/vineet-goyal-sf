const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);

const MASTER_RECORD_TYPE_ID = '012000000000000AAA';

await helpers.requestGetAndSave(
    `/ui-api/object-info/Account/picklist-values/${MASTER_RECORD_TYPE_ID}`,
    path.join(rootDir, 'picklist-Account-MasterRecordTypeId.json')
);
