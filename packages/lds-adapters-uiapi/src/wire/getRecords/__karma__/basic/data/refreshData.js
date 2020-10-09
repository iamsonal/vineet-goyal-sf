#!/usr/bin/env sfdx repl:script

const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);

const ACCOUNT_NAME_1 = 'Burlington Textiles Corp of America';
const ACCOUNT_NAME_2 = 'Edge Communications';
const CASE_NUMBER = '00001000';

const accountId1 = await helpers.getAccountByName(ACCOUNT_NAME_1);
const accountId2 = await helpers.getAccountByName(ACCOUNT_NAME_2);
const caseId = await helpers.getCaseByNumber(CASE_NUMBER);

await helpers.requestGetAndSave(
    `/ui-api/records/${accountId1}?fields=Account.Id,Account.Name`,
    path.join(rootDir, 'record-single-record-Account.json')
);

await helpers.requestGetAndSave(
    `/ui-api/records/${accountId2}?fields=Account.Id,Account.Name`,
    path.join(rootDir, 'record-single-record-Account2.json')
);

await helpers.requestGetAndSave(
    `/ui-api/records/batch/${accountId1},${accountId2}?fields=Account.Id,Account.Name`,
    path.join(rootDir, 'records-multiple-record-Accounts.json')
);

await helpers.requestGetAndSave(
    `/ui-api/records/batch/${accountId1}?fields=Account.Id,Account.Name`,
    path.join(rootDir, 'records-single-record-Account.json')
);

await helpers.requestGetAndSave(
    `/ui-api/records/batch/${accountId1},${caseId}?fields=Account.Id,Account.Name,Case.Id,Case.Status`,
    path.join(rootDir, 'records-multiple-record-Account_Case.json')
);
