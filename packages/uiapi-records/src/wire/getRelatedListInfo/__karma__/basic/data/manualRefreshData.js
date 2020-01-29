#!/usr/bin/env sfdx repl:script

const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);

// W-6594688 PLEASE NOTE: For the time being, this refresh data script does not work against the standard mock-data-app
// When this comment is removed the file should be renamed back to refreshData.js

const PARENT_ENTITY_API_NAME = 'CObjParent__c';
const RELATED_LIST_NAME = 'CObjChilds__r';

await helpers.requestGetAndSave(
    `/ui-api/related-list-info/${PARENT_ENTITY_API_NAME}/${RELATED_LIST_NAME}`,
    path.join(rootDir, 'related-list-info-Custom.json')
);
