#!/usr/bin/env sfdx repl:script

const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);

// W-6594688 PLEASE NOTE: For the time being, this refresh data script does not work against the standard mock-data-app
// When this comment is removed the file should be renamed back to refreshData.js

const PARENT_ENTITY_API_NAME = 'CObjParent__c';
const RELATED_LIST_ID = 'CObjChilds__r';

// Dummy parent
const COBJ_NAME = 'Dummy Parent';
const parentRecordId = await helpers.getRecordId(COBJ_NAME, PARENT_ENTITY_API_NAME);

// Empty parent
const EMPTY_NAME = 'Empty Parent';
const emptyParentRecordId = await helpers.getRecordId(EMPTY_NAME, PARENT_ENTITY_API_NAME);

// Save custom records
await helpers.requestGetAndSave(
    `/ui-api/related-list-records/${parentRecordId}/${RELATED_LIST_ID}?fields=Id,Name`,
    path.join(rootDir, 'related-list-records-Custom.json')
);

// Save empty records
await helpers.requestGetAndSave(
    `/ui-api/related-list-records/${emptyParentRecordId}/${RELATED_LIST_ID}?fields=Id`,
    path.join(rootDir, 'related-list-records-empty-Custom.json')
);
