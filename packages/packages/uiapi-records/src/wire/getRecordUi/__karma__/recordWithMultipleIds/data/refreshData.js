const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);

const OPPORTUNITY_NAME = 'Burlington Textiles Weaving Plant Generator';
const opportunityId = await helpers.getOpportunityByName(OPPORTUNITY_NAME);

await helpers.requestGetAndSave(
    `/ui-api/record-ui/${opportunityId}?layoutTypes=Full&modes=View`,
    path.join(rootDir, `records-Opportunity-layouttypes-Full-modes-View.json`)
);
