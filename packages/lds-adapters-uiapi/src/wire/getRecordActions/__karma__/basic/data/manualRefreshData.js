#!/usr/bin/env sfdx repl:script

const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);

const ACCOUNT_NAME = 'Burlington Textiles Corp of America';
const recordId = await helpers.getAccountByName(ACCOUNT_NAME);

// W-6993754: actions API is internal behind PlatformActionReserved1 org perm
// or the gate com.salesforce.flexipage.useRaptorActionContainerForCustomObjectDesktopRecordHome
// the refresh script cannot be run directly
[
    {
        filename: 'record-actions',
        queryString: '',
    },
    {
        filename: 'record-actions-apiNames-Follow,Global.NewTask',
        queryString: '?apiNames=Follow,Global.NewTask',
    },
    {
        filename: 'record-actions-retrievalMode-All',
        queryString: '?retrievalMode=All',
    },
    {
        filename: 'record-actions-actionTypes-StandardButton',
        queryString: '?actionTypes=StandardButton',
    },
    {
        filename: 'record-actions-apiNames-Follow,Global.NewTask-formFactor-Small',
        queryString: '?apiNames=Follow,Global.NewTask&formFactor=Small',
    },
    {
        filename: 'record-actions-sections-SingleActionLinks',
        queryString: '?sections=SingleActionLinks',
    },
].forEach(async (entry) => {
    await helpers.requestGetAndSave(
        `/ui-api/actions/record/${recordId}${entry.queryString}`,
        path.join(rootDir, `${entry.filename}.json`)
    );
});
