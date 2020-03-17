const path = require('path');
const fs = require('fs');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);

const OPPORTUNITY_NAME = 'Burlington Textiles Weaving Plant Generator';
const id = await helpers.getOpportunityByName(OPPORTUNITY_NAME);

const entries = [
    {
        filename: 'record-Opportunity-fields-Opportunity.Name',
        params: '?fields=Opportunity.Name',
    },
    {
        filename: 'record-Opportunity-fields-Opportunity.Name,Opportunity.SystemModStamp',
        params: '?fields=Opportunity.Name,Opportunity.SystemModStamp',
    },
    {
        filename:
            'record-Opportunity-fields-Opportunity.Name,Opportunity.OwnerId-optionalFields-Opportunity.NoExist',
        params: '?fields=Opportunity.Name,Opportunity.OwnerId&optionalfields=Opportunity.NoExist',
    },
    {
        filename:
            'record-Opportunity-fields-Opportunity.Account.Name,Opportunity.Account.Owner.Name,Opportunity.Owner.City',
        params:
            '?fields=Opportunity.Account.Name,Opportunity.Account.Owner.Name,Opportunity.Owner.City',
    },
];

entries.forEach(async function(entry) {
    await helpers.requestGetAndSave(
        `/ui-api/records/${id}${entry.params}`,
        path.join(rootDir, `${entry.filename}.json`)
    );
});

const getRecordCreateDefaults = [
    {
        endpoint: 'record-defaults/create/Account',
        filename: 'record-defaults-create-Account',
    },
];

getRecordCreateDefaults.forEach(async function({ endpoint, filename }) {
    await helpers.requestGetAndSave(`/ui-api/${endpoint}`, path.join(rootDir, `${filename}.json`));
});

// Refresh Record Defaults Create "Owner" field as top level
const recordDefaultsAccount = JSON.parse(
    fs.readFileSync(path.join(rootDir, `record-defaults-create-Account.json`)).toString()
);
const userId = recordDefaultsAccount.record.fields.Owner.value.id;

const userRefresh = {
    endpoint: `records/${userId}?fields=User.Name`,
    filename: 'record-User-fields-User.Name',
};
await helpers.requestGetAndSave(
    `/ui-api/${userRefresh.endpoint}`,
    path.join(rootDir, `${userRefresh.filename}.json`)
);
