const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);

const OPPORTUNITY_NAME = 'Burlington Textiles Weaving Plant Generator';
const opportunityId = await helpers.getOpportunityByName(OPPORTUNITY_NAME);

const ACCOUNT_NAME = 'Burlington Textiles Corp of America';
const accountId = await helpers.getAccountByName(ACCOUNT_NAME);

const sysAdminUserId = await helpers.getSysAdminUserId();

// User record data
await helpers.requestGetAndSave(
    `/ui-api/records/${sysAdminUserId}?fields=User.Id,User.City`,
    path.join(rootDir, 'record-User-fields-User.Id,User.City.json')
);

// Account record data
[
    {
        filename:
            'record-Account-fields-Account.Id,Account.Name,Account.Owner.Id,Account.Owner.City',
        params: '?fields=Account.Id,Account.Name,Account.Owner.Id,Account.Owner.City',
    },
    {
        filename: 'record-Account-fields-Account.Id,Account.Name',
        params: '?fields=Account.Id,Account.Name',
    },
].forEach(async (entry) => {
    await helpers.requestGetAndSave(
        `/ui-api/records/${accountId}${entry.params}`,
        path.join(rootDir, `${entry.filename}.json`)
    );
});

// Opportunity record data
[
    {
        filename: 'record-Opportunity-fields-Opportunity.Account.Name',
        params: '?fields=Opportunity.Account.Name',
    },
    {
        filename:
            'record-Opportunity-fields-Opportunity.Id,Opportunity.Name,Opportunity.Owner.Id,Opportunity.Owner.City',
        params: '?fields=Opportunity.Id,Opportunity.Name,Opportunity.Owner.Id,Opportunity.Owner.City',
    },
    {
        filename:
            'record-Opportunity-fields-Opportunity.Id,Opportunity.Name,Opportunity.Account.Id,Opportunity.Account.Name,Opportunity.Owner.Id,Opportunity.Owner.City',
        params: '?fields=Opportunity.Id,Opportunity.Name,Opportunity.Account.Id,Opportunity.Account.Name,Opportunity.Owner.Id,Opportunity.Owner.City',
    },
    {
        filename:
            'record-Opportunity-fields-Opportunity.Id,Opportunity.Name,Opportunity.Account.Id,Opportunity.Account.Name,Opportunity.Account.Owner.Id,Account.Owner.City',
        params: '?fields=Opportunity.Id,Opportunity.Name,Opportunity.Account.Id,Opportunity.Account.Name,Opportunity.Account.Owner.Id,Opportunity.Account.Owner.City',
    },
].forEach(async (entry) => {
    await helpers.requestGetAndSave(
        `/ui-api/records/${opportunityId}${entry.params}`,
        path.join(rootDir, `${entry.filename}.json`)
    );
});
