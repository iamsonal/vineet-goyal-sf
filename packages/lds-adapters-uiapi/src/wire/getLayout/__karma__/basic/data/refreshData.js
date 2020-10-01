#!/usr/bin/env sfdx repl:script
const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);

const entries = [
    {
        endpoint: 'layout/Opportunity?layoutType=Compact&mode=Edit',
        filename: 'layout-Opportunity-Compact-Edit',
    },
    {
        endpoint: 'layout/Opportunity?layoutType=Compact',
        filename: 'layout-Opportunity-Compact',
    },
    {
        endpoint: 'layout/Opportunity',
        filename: 'layout-Opportunity-Full',
    },
];

entries.forEach(async ({ endpoint, filename }) => {
    await helpers.requestGetAndSave(`/ui-api/${endpoint}`, path.join(rootDir, `${filename}.json`));
});
