#!/usr/bin/env sfdx repl:script

const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);

await helpers.requestGetAndSave(
    `/ui-api/object-info/batch/Account,Opportunity`,
    path.join(rootDir, 'object-Account-Opportunity.json')
);

await helpers.requestGetAndSave(
    `/ui-api/object-info/batch/Opportunity,Account`,
    path.join(rootDir, 'object-Opportunity-Account.json')
);

await helpers.requestGetAndSave(
    `/ui-api/object-info/batch/Account,Opportunity,BadOpportunity`,
    path.join(rootDir, 'object-Account-Opportunity-BadOpportunity.json')
);

await helpers.requestGetAndSave(
    `/ui-api/object-info/batch/BadAccount,BadOpportunity`,
    path.join(rootDir, 'object-BadAccount-BadOpportunity.json')
);

await helpers.requestGetAndSave(
    `/ui-api/object-info/Account`,
    path.join(rootDir, 'object-Account.json')
);

await helpers.requestGetAndSave(
    `/ui-api/object-info/Opportunity`,
    path.join(rootDir, 'object-Opportunity.json')
);

await helpers.requestGetAndSave(
    `/ui-api/object-info/noexist`,
    path.join(rootDir, 'object-error.json')
);
