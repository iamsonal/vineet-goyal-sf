#!/usr/bin/env sfdx repl:script

const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);

const OBJECT_API_NAME = 'Account';
const LIST_VIEW_API_NAME = 'AllAccounts';
const SEARCH_RESULT = '__SearchResult';

await helpers.requestGetAndSave(
    `/ui-api/list-info/${OBJECT_API_NAME}/${LIST_VIEW_API_NAME}`,
    path.join(rootDir, 'list-info-AllAccounts.json')
);

await helpers.requestGetAndSave(
    `/ui-api/list-info/${OBJECT_API_NAME}/${SEARCH_RESULT}`,
    path.join(rootDir, 'list-info-__SearchResult.json')
);
