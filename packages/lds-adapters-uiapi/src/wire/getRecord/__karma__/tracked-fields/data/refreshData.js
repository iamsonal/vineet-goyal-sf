const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);

const ACCOUNT_NAME = 'Burlington Textiles Corp of America';
const accountId = await helpers.getAccountByName(ACCOUNT_NAME);

const OPPORTUNITY_NAME = 'Burlington Textiles Weaving Plant Generator';
const opportunityId = await helpers.getOpportunityByName(OPPORTUNITY_NAME);

const LIST_VIEW_NAME = 'All Opportunities';
const listViewId = await helpers.getListViewByName(LIST_VIEW_NAME);

// Opportunity record data
[
    {
        filename: 'record-Opportunity-fields-Opportunity.Id',
        params: '?fields=Opportunity.Id',
    },
    {
        filename: 'record-Opportunity-fields-Opportunity.Name',
        params: '?fields=Opportunity.Name',
    },
    {
        filename: 'record-Opportunity-fields-Opportunity.Name,Opportunity.Id',
        params: '?fields=Opportunity.Name,Opportunity.Id',
    },
    {
        filename:
            'record-Opportunity-fields-Opportunity.FiscalYear,Opportunity.Id,Opportunity.CreatedBy.Id,Opportunity.CreatedBy.Name,Opportunity.CreatedBy.CreatedBy.Id',
        params: '?fields=Opportunity.FiscalYear,Opportunity.Id,Opportunity.CreatedBy.Id,Opportunity.CreatedBy.Name,Opportunity.CreatedBy.CreatedBy.Id',
    },
    {
        filename: 'record-list-tracked-fields-new',
        params: '?fields=Opportunity.Account.Id,Opportunity.AccountId,Opportunity.Amount,Opportunity.CloseDate,Opportunity.CreatedBy.Id,Opportunity.CreatedById,Opportunity.CreatedDate,Opportunity.FiscalYear,Opportunity.Id,Opportunity.LastModifiedById,Opportunity.LastModifiedDate,Opportunity.Name,Opportunity.Owner.Id,Opportunity.OwnerId,Opportunity.StageName,Opportunity.SystemModstamp',
    },
].forEach(async ({ params, filename }) => {
    await helpers.requestGetAndSave(
        `/ui-api/records/${opportunityId}${params}`,
        path.join(rootDir, `${filename}.json`)
    );
});

// // Account record data
[
    {
        filename:
            'record-Account-fields-Account.Fax-optionalFields-Account.DisambiguationField,Account.FirstName,Account.LastName,Account.Name,Account.NameLocal',
        params: '?fields=Account.Fax&optionalFields=Account.DisambiguationField,Account.FirstName,Account.LastName,Account.Name,Account.NameLocal',
    },
].forEach(async ({ params, filename }) => {
    await helpers.requestGetAndSave(
        `/ui-api/records/${accountId}${params}`,
        path.join(rootDir, `${filename}.json`)
    );
});

// // Opportunity lookup data
[
    {
        filename: 'lookup-records-Opportunity-Opportunity.AccountId-Account',
        objectApiName: 'Opportunity',
        fieldApiName: 'AccountId',
        targetApiName: 'Account',
    },
].forEach(async ({ objectApiName, fieldApiName, targetApiName, filename }) => {
    await helpers.requestGetAndSave(
        `/ui-api/lookups/${objectApiName}/${fieldApiName}/${targetApiName}`,
        path.join(rootDir, `${filename}.json`)
    );
});

// List UI
[
    {
        filename: 'list-ui-All-Opportunities-pageToken-0-pageSize-1',
        endpoint: 'list-ui',
        params: 'pageToken=0&pageSize=1',
    },
].forEach(async ({ filename, endpoint, params }) => {
    await helpers.requestGetAndSave(
        `/ui-api/${endpoint}/${listViewId}?${params}`,
        path.join(rootDir, `${filename}.json`)
    );
});
