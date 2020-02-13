const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);

const OPPORTUNITY_NAME = 'Burlington Textiles Weaving Plant Generator';
const id = await helpers.getOpportunityByName(OPPORTUNITY_NAME);

const entries = [
    {
        filename: 'record-Opportunity-fields-Opportunity.Name',
        params: '?fields=Opportunity.Name',
    },
    {
        filename: 'record-Opportunity-fields-Opportunity.Name,Opportunity.SystemModStamp',
        params: '?fields=Opportunity.Name,Opportunity.SystemModStamp',
    },
    {
        filename:
            'record-Opportunity-fields-Opportunity.Name,Opportunity.OwnerId-optionalFields-Opportunity.NoExist',
        params: '?fields=Opportunity.Name,Opportunity.OwnerId&optionalfields=Opportunity.NoExist',
    },
    {
        filename:
            'record-Opportunity-fields-Opportunity.Account.Name,Opportunity.Account.Owner.Name,Opportunity.Owner.City',
        params:
            '?fields=Opportunity.Account.Name,Opportunity.Account.Owner.Name,Opportunity.Owner.City',
    },
];

entries.forEach(async function(entry) {
    await helpers.requestGetAndSave(
        `/ui-api/records/${id}${entry.params}`,
        path.join(rootDir, `${entry.filename}.json`)
    );
});
