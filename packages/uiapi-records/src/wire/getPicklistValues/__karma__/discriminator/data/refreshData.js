const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);

const MASTER_RECORD_TYPE_ID = '012000000000000AAA';

const entries = [
    {
        objectApiName: 'Case',
        recordTypeId: MASTER_RECORD_TYPE_ID,
        fieldApiName: 'Status',
        filename: 'picklist-Case-MasterRecordTypeId-Status',
    },
    {
        objectApiName: 'Opportunity',
        recordTypeId: MASTER_RECORD_TYPE_ID,
        fieldApiName: 'StageName',
        filename: 'picklist-Opportunity-MasterRecordTypeId-StageName',
    },
];

// /services/data/v47.0/ui-api/object-info/ Account/picklist-values/012000000000000AAA/Type
entries.forEach(async ({ fieldApiName, filename, objectApiName, recordTypeId }) => {
    await helpers.requestGetAndSave(
        `/ui-api/object-info/${objectApiName}/picklist-values/${recordTypeId}/${fieldApiName}`,
        path.join(rootDir, `${filename}.json`)
    );
});
