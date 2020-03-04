const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);

const opportunityId = await helpers.createTempRecord('Opportunity', {
    Amount: 23.3,
});

// Opportunity record data
[
    {
        filename: 'record-Opportunity-fields-Opportunity.Amount',
        params: '?fields=Opportunity.Amount',
    },
].forEach(async ({ params, filename }) => {
    await helpers.requestGetAndSave(
        `/ui-api/records/${opportunityId}${params}`,
        path.join(rootDir, `${filename}.json`)
    );
});
