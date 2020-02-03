const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);

const LIST_VIEW_NAME = 'All Opportunities';
const OPPORTUNITY_NAME = 'Burlington Textiles Weaving Plant Generator';

let listViewId = await helpers.getListViewByName(LIST_VIEW_NAME);
const opportunityId = await helpers.getOpportunityByName(OPPORTUNITY_NAME);

await helpers.requestGetAndSave(
    `/ui-api/list-ui/${listViewId}`,
    path.join(rootDir, `list-ui-All-Opportunities.json`)
);

await helpers.requestGetAndSave(
    `/ui-api/records/${opportunityId}?fields=Opportunity.Owner.City,Opportunity.Owner.Name`,
    path.join(
        rootDir,
        `record-Opportunity-fields-Opportunity.Owner.City.Opportunity.Owner.Name.json`
    )
);

listViewId = await helpers.getListViewByName('All Open Leads');

await helpers.requestGetAndSave(
    `/ui-api/list-ui/${listViewId}?pageSize=1`,
    path.join(rootDir, `list-ui-All-Open-Leads-pageSize-1.json`)
);
