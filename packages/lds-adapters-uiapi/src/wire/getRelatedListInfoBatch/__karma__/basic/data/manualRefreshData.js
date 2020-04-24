#!/usr/bin/env sfdx repl:script

const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);

// W-6594688 PLEASE NOTE: For the time being, this refresh data script does not work against the standard mock-data-app
// When this comment is removed the file should be renamed back to refreshData.js

const PARENT_OBJECT_API_NAME = 'CwcCustom00__c';
const RELATED_LIST_NAMES_1 = 'CwcCustom01s__r';
const RELATED_LIST_NAMES_2 = 'CwcCustom02s__r';
const RELATED_LIST_NAMES_BOTH = RELATED_LIST_NAMES_1 + ',' + RELATED_LIST_NAMES_2;
const RELATED_LIST_ERROR = 'relatedListThatDoesntExist';
const RELATED_LIST_MIXED = RELATED_LIST_NAMES_1 + ',' + RELATED_LIST_ERROR;

await helpers.requestGetAndSave(
    `/ui-api/related-list-info/batch/${PARENT_OBJECT_API_NAME}/${RELATED_LIST_NAMES_1}`,
    path.join(rootDir, 'related-lists-info-batch-Custom.json')
);

await helpers.requestGetAndSave(
    `/ui-api/related-list-info/batch/${PARENT_OBJECT_API_NAME}/${RELATED_LIST_NAMES_2}`,
    path.join(rootDir, 'related-lists-info-batch-Custom02.json')
);

await helpers.requestGetAndSave(
    `/ui-api/related-list-info/batch/${PARENT_OBJECT_API_NAME}/${RELATED_LIST_NAMES_BOTH}`,
    path.join(rootDir, 'related-lists-info-batch-Custom-Both.json')
);

await helpers.requestGetAndSave(
    `/ui-api/related-list-info/batch/${PARENT_OBJECT_API_NAME}/${RELATED_LIST_ERROR}`,
    path.join(rootDir, 'related-lists-info-batch-Error.json')
);

await helpers.requestGetAndSave(
    `/ui-api/related-list-info/batch/${PARENT_OBJECT_API_NAME}/${RELATED_LIST_MIXED}`,
    path.join(rootDir, 'related-lists-info-batch-Mixed-Error.json')
);
