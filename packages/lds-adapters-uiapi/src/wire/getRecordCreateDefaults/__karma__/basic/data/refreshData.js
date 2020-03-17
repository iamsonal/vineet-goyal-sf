#!/usr/bin/env sfdx repl:script

const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);
const helpers = require(helpersPath);

const entries = [
    {
        endpoint: 'record-defaults/create/Account',
        filename: 'record-defaults-create-Account',
    },
    {
        endpoint: 'record-defaults/create/Account?optionalFields=Account.YearStarted',
        filename: 'record-defaults-create-Account-optionalFields-Account.YearStarted',
    },
    {
        endpoint: 'record-defaults/create/Account?optionalFields=Account.Test',
        filename: 'record-defaults-create-Account-optionalFields-Account.Test',
    },
    {
        endpoint: 'object-info/Account',
        filename: 'object-info-Account',
    },
    {
        endpoint: 'layout/Account?mode=Create',
        filename: 'layout-Account-Full-Create',
    },
];

entries.forEach(async function({ endpoint, filename }) {
    await helpers.requestGetAndSave(`/ui-api/${endpoint}`, path.join(rootDir, `${filename}.json`));
});
