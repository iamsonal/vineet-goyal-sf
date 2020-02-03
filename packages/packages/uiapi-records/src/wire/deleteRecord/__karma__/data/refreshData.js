const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);

const OPPORTUNITY_NAME = 'Burlington Textiles Weaving Plant Generator';
const opportunityId = await helpers.getOpportunityByName(OPPORTUNITY_NAME);

// Opportunity record data
[
    {
        filename: 'record-Opportunity-fields-Opportunity.FiscalYear',
        params: '?fields=Opportunity.FiscalYear',
    },
].forEach(async ({ params, filename }) => {
    await helpers.requestGetAndSave(
        `/ui-api/records/${opportunityId}${params}`,
        path.join(rootDir, `${filename}.json`)
    );
});
