#!/usr/bin/env sfdx repl:script
const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);

// max URI length is around 16,087 characters
// current limits that returns an API error with batch call
const RECORD_LIMIT = 834;
// limit for custom object
const OBJECT_LIMIT = 833;

const accountApiName = 'Account';
const customObjectApiName = 'myCustomObject__c';

const accountIds = [];
const testObjectIds = [];

for (let i = 0; i < RECORD_LIMIT; i++) {
    accountIds.push(await helpers.createTempRecord(accountApiName, { Name: `Account ${i}` }));
}

await helpers.requestGetAndSave(
    `/ui-api/records/batch/${accountIds.join()}?fields=${accountApiName}.Id,${accountApiName}.Name`,
    path.join(rootDir, 'accounts-limit.json')
);

await helpers.createSObject(customObjectApiName, 'Custom Object');

for (let i = 0; i < OBJECT_LIMIT; i++) {
    testObjectIds.push(
        await helpers.createTempRecord(customObjectApiName, { Name: `Custom Object ${i}` })
    );
}

await helpers.requestGetAndSave(
    `/ui-api/records/batch/${testObjectIds.join()}?fields=${customObjectApiName}.Id,${customObjectApiName}.Name`,
    path.join(rootDir, 'customObject-limit.json')
);

helpers.cleanup();
