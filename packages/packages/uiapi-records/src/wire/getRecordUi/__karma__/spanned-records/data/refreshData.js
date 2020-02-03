const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);

const ACCOUNT_NAME = 'Burlington Textiles Corp of America';
const accountId = await helpers.getAccountByName(ACCOUNT_NAME);

const OPPORTUNITY_NAME = 'Burlington Textiles Weaving Plant Generator';
const opportunityId = await helpers.getOpportunityByName(OPPORTUNITY_NAME);

// Opportunity record-ui data
[
    {
        filename: 'single-record-Opportunity-layouttypes-Full-modes-View-optionalFields-IsDeleted',
        queryString: '?layoutTypes=Full&modes=View&optionalFields=Opportunity.IsDeleted',
    },
    {
        filename:
            'single-record-Opportunity-layouttypes-Full-modes-View-optionalFields-IsDeleted-OrderNumber__c',
        queryString:
            '?layoutTypes=Full&modes=View&optionalFields=Opportunity.IsDeleted,Opportunity.OrderNumber__c',
    },
].forEach(async function(entry) {
    await helpers.requestGetAndSave(
        `/ui-api/record-ui/${opportunityId}${entry.queryString}`,
        path.join(rootDir, `${entry.filename}.json`)
    );
});

// Account record-ui data
[
    {
        filename: 'single-record-Account-layouttypes-Full-modes-View',
        queryString: '?layoutTypes=Full&modes=View',
    },
].forEach(async function(entry) {
    await helpers.requestGetAndSave(
        `/ui-api/record-ui/${accountId}${entry.queryString}`,
        path.join(rootDir, `${entry.filename}.json`)
    );
});

// Account record data
[
    {
        filename: 'record-Account-fields-Account.Phone,Account.Id,Account.Name',
        queryString: '?fields=Account.Phone,Account.Id,Account.Name',
    },
].forEach(async function(entry) {
    await helpers.requestGetAndSave(
        `/ui-api/records/${accountId}${entry.queryString}`,
        path.join(rootDir, `${entry.filename}.json`)
    );
});
