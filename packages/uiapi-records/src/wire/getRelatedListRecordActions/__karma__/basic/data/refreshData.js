#!/usr/bin/env sfdx repl:script

const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);

const ACCOUNT_NAME = 'Burlington Textiles Corp of America';
const recordId = await helpers.getAccountByName(ACCOUNT_NAME);

const result = await helpers.requestGet(
    `/ui-api/record-ui/${recordId}?childRelationships=Account.Opportunities`
);

const relatedListRecordIds =
    result.records[recordId].childRelationships.Opportunities.records[0].id;

[
    {
        filename: 'related-list-record-actions',
        queryString: '',
    },
    {
        filename: 'related-list-record-actions-formFactor-Small',
        queryString: '?formFactor=Small',
    },
    {
        filename: 'related-list-record-actions-actionTypes-StandardButton',
        queryString: '?actionTypes=StandardButton',
    },
    {
        filename: 'related-list-record-actions-sections-Page',
        queryString: '?sections=Page',
    },
].forEach(async entry => {
    await helpers.requestGetAndSave(
        `/ui-api/actions/record/${recordId}/related-list-record/${relatedListRecordIds}${entry.queryString}`,
        path.join(rootDir, `${entry.filename}.json`)
    );
});
