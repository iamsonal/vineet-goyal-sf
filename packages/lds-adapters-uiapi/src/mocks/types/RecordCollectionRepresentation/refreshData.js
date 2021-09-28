#!/usr/bin/env sfdx repl:script

const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);
const helpers = require(helpersPath);

await helpers.requestGetAndSave(
    `/ui-api/lookups/Case/ContactId/Contact?q=jak&searchType=TypeAhead&page=1&pageSize=10`,
    path.join(rootDir, 'lookup-records-Case-ContactId-Contact.json')
);
