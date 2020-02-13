const fs = require('fs');
const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);

const accountResult = await helpers.requestPost('/ui-api/records/', {
    apiName: 'Account',
    fields: {
        Name: 'Seahawks',
    },
});

// should keep in-sync as the createRecordConfig in create-record.spec.js
const postBody = {
    apiName: 'Opportunity',
    fields: {
        Name: 'Foo',
        StageName: 'Stage',
        CloseDate: '2020-01-01T00:26:58+00:00',
        AccountId: `${accountResult.id}`,
    },
    allowSaveOnDuplicate: false,
};

const opportunityResult = await helpers.requestPost('/ui-api/records/', postBody);
fs.writeFileSync(
    path.join(rootDir, 'record-Opportunity-new.json'),
    JSON.stringify(opportunityResult, null, 4)
);

// Opportunity record data
[
    {
        filename: 'record-Opportunity-fields-Opportunity.FiscalYear',
        params: '?fields=Opportunity.FiscalYear',
    },
    {
        filename: 'record-Opportunity-fields-Opportunity.Account.Id,Opportunity.Account.Name',
        params: '?fields=Opportunity.Account.Id,Opportunity.Account.Name',
    },
].forEach(async ({ params, filename }) => {
    await helpers.requestGetAndSave(
        `/ui-api/records/${opportunityResult.id}${params}`,
        path.join(rootDir, `${filename}.json`)
    );
});

await helpers.requestDelete(`/ui-api/records/${opportunityResult.id}`);
await helpers.requestDelete(`/ui-api/records/${accountResult.id}`);
