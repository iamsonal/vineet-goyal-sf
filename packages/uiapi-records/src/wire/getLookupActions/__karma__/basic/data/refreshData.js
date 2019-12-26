#!/usr/bin/env sfdx repl:script

const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);
const helpers = require(helpersPath);

const entries = [
    {
        endpoint: `actions/lookup/Lead,Opportunity`,
        filename: 'lookup-Lead-Opportunity',
    },
    {
        endpoint: `actions/lookup/Opportunity?actionTypes=StandardButton&formFactor=Medium&sections=Page`,
        filename: 'lookup-Opportunity-actionTypes-StandardButton-formFactor-Medium-sections-Page',
    },
    {
        endpoint: `actions/lookup/DoesNotExist`,
        filename: 'lookup-objectApiName-invalid',
    },
    {
        endpoint: `actions/lookup/Opportunity?formFactor=MediumTypo`,
        filename: 'lookup-Opportunity-formFactor-typo',
    },
];

entries.forEach(async function({ endpoint, filename }) {
    await helpers.requestGetAndSave(`/ui-api/${endpoint}`, path.join(rootDir, `${filename}.json`));
});
