#!/usr/bin/env sfdx repl:script

const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);

await helpers.requestGetAndSave(
    '/ui-api/layout/Account',
    path.join(rootDir, 'layout-Account.json')
);
