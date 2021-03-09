const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);

const OPPORTUNITY_NAME = 'Burlington Textiles Weaving Plant Generator';
const id = await helpers.getOpportunityByName(OPPORTUNITY_NAME);

const entries = [
    {
        endpoint: `record-ui/${id}?layoutTypes=Full&modes=View`,
        filename: 'record-Opportunity-layouttypes-Full-modes-View',
    },
    {
        endpoint: `record-ui/${id}?layoutTypes=Full,Compact&modes=View`,
        filename: 'record-Opportunity-layouttypes-Full-Compact-modes-View',
    },
    {
        endpoint: `record-ui/${id}?layoutTypes=Full&modes=Edit&optionalFields=Opportunity.Id,Opportunity.SystemModstamp`,
        filename: `record-Opportunity-layouttypes-Full-modes-Edit-optionalFields`,
    },
    {
        endpoint: `records/${id}?fields=Opportunity.Name`,
        filename: 'record-Opportunity-fields-Opportunity.Name',
    },
    {
        endpoint: 'layout/Opportunity',
        filename: 'layout-Opportunity-layoutType-Full-modes-View',
    },
    {
        endpoint: 'layout/Opportunity?layoutType=Compact',
        filename: 'layout-Opportunity-layoutType-Compact-modes-View',
    },
    {
        endpoint: 'object-info/Opportunity',
        filename: 'object-info-Opportunity',
    },
];

entries.forEach(async ({ endpoint, filename }) => {
    await helpers.requestGetAndSave(`/ui-api/${endpoint}`, path.join(rootDir, `${filename}.json`));
});
