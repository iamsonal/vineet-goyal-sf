const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);

const OPPORTUNITY_NAME = 'Burlington Textiles Weaving Plant Generator';
const id = await helpers.getOpportunityByName(OPPORTUNITY_NAME);

[
    {
        filename: 'record-Opportunity-fields-Opportunity.Name',
        params: '?fields=Opportunity.Name',
    },
    {
        filename: 'record-Opportunity-fields-Opportunity.Id,Opportunity.Name',
        params: '?fields=Opportunity.Id,Opportunity.Name',
    },
].forEach(async ({ filename, params }) => {
    await helpers.requestGetAndSave(
        `/ui-api/records/${id}${params}`,
        path.join(rootDir, `${filename}.json`)
    );
});

[
    {
        filename: 'recordUi-layoutTypes-Full-modes-View',
        params: '?layoutTypes=Full&modes=View',
    },
    {
        filename: 'recordUi-layoutTypes-Invalid-modes-View',
        params: '?layoutTypes=Invalid&modes=View',
    },
    {
        filename: 'recordUi-layoutTypes-Full-modes-Invalid',
        params: '?layoutTypes=Full&modes=Invalid',
    },
].forEach(async ({ filename, params }) => {
    await helpers.requestGetAndSave(
        `/ui-api/record-ui/${id}${params}`,
        path.join(rootDir, `${filename}.json`)
    );
});
