#!/usr/bin/env sfdx repl:script

const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);

// Batch
await helpers.requestGetAndSave(
    `/ui-api/list-info/batch?names=Account.__SearchResult`,
    path.join(rootDir, 'lists-Account.json')
);

await helpers.requestGetAndSave(
    `/ui-api/list-info/batch?names=Account.__SearchResult,Contact.__SearchResult`,
    path.join(rootDir, 'lists-Account-Contact.json')
);

await helpers.requestGetAndSave(
    `/ui-api/list-info/batch?names=Account.__SearchResult,User.__SearchResult`,
    path.join(rootDir, 'lists-Account-User.json')
);

await helpers.requestGetAndSave(
    `/ui-api/list-info/batch?names=Contact.__SearchResult`,
    path.join(rootDir, 'lists-Contact.json')
);

// Single
await helpers.requestGetAndSave(
    `/ui-api/list-info/Account/__SearchResult`,
    path.join(rootDir, 'list-Account.json')
);

await helpers.requestGetAndSave(
    `/ui-api/list-info/Contact/__SearchResult`,
    path.join(rootDir, 'list-Contact.json')
);
