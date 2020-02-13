#!/usr/bin/env sfdx repl:script

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
        filename: 'record-Opportunity-fields-NoExistEntity',
        params: '?fields=NoExistEntity',
    },
    {
        filename: 'record-Opportunity-MissingColumn',
        params: '?fields=Opportunity.Foo',
    },
];

entries.forEach(async function(entry) {
    await helpers.requestGetAndSave(
        `/ui-api/records/${id}${entry.params}`,
        path.join(rootDir, `${entry.filename}.json`)
    );
});
