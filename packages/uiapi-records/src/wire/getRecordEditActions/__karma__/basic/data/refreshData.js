#!/usr/bin/env sfdx repl:script

const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);

const ACCOUNT_NAME = 'Burlington Textiles Corp of America';
const recordId = await helpers.getAccountByName(ACCOUNT_NAME);

await helpers.requestGetAndSave(
    `/ui-api/actions/record/${recordId}/record-edit`,
    path.join(rootDir, 'record-edit-actions.json')
);
