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
        filename: 'single-record-Opportunity-layouttypes-Full-modes-View',
        queryString: '?layoutTypes=Full&modes=View',
    },
    {
        filename: 'single-record-Opportunity-layouttypes-Full-modes-Edit',
        queryString: '?layoutTypes=Full&modes=Edit',
    },
    {
        filename:
            'single-record-Opportunity-layouttypes-Compact-modes-View-optionalFields-IsDeleted',
        queryString: '?layoutTypes=Compact&modes=View&optionalFields=Opportunity.IsDeleted',
    },
    {
        filename:
            'single-record-Opportunity-layouttypes-Full-modes-View-optionalFields-CloneSourceId',
        queryString: '?layoutTypes=Full&modes=View&optionalFields=Opportunity.CloneSourceId',
    },
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
].forEach(async function (entry) {
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
    {
        filename: 'single-record-Account-layouttypes-Full-modes-Edit',
        queryString: '?layoutTypes=Full&modes=Edit',
    },
    {
        filename: 'single-record-Account-layouttypes-Full-modes-Edit-optionalFields-IsDeleted',
        queryString: '?layoutTypes=Full&modes=Edit&optionalFields=Account.IsDeleted',
    },
    {
        filename: 'single-record-Account-layouttypes-Full-modes-Create',
        queryString: '?layoutTypes=Full&modes=Create',
    },
    {
        filename: 'single-record-Account-layouttypes-Full-modes-Create,View',
        queryString: '?layoutTypes=Full&modes=Create,View',
    },
    {
        filename: 'single-record-Account-layouttypes-Full-modes-Create,Edit,View',
        queryString: '?layoutTypes=Full&modes=Create,Edit,View',
    },
    {
        filename: 'single-record-Account-layouttypes-Compact-modes-Create,Edit,View',
        queryString: '?layoutTypes=Compact&modes=Create,Edit,View',
    },
    {
        filename: 'single-record-Account-layouttypes-Full-Compact-modes-Create,Edit,View',
        queryString: '?layoutTypes=Full,Compact&modes=Create,Edit,View',
    },
].forEach(async function (entry) {
    await helpers.requestGetAndSave(
        `/ui-api/record-ui/${accountId}${entry.queryString}`,
        path.join(rootDir, `${entry.filename}.json`)
    );
});

// Opportunity record data
await helpers.requestGetAndSave(
    `/ui-api/records/${opportunityId}?fields=Opportunity.CloneSourceId`,
    path.join(rootDir, 'record-Opportunity-fields-Opportunity.CloneSourceId.json')
);

// Opportunity + Account record-ui data
await helpers.requestGetAndSave(
    `/ui-api/record-ui/${opportunityId},${accountId}?layoutTypes=Full&modes=View`,
    path.join(rootDir, 'record-ui-Opportunity-Account-layouttypes-Full-modes-View.json')
);
