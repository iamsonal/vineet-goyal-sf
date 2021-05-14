#!/usr/bin/env sfdx repl:script

const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);
[
    {
        filename: 'global-actions',
        queryString: '',
    },
    {
        filename: 'global-actions-apiNames',
        queryString: '?apiNames=Global.NewEvent,Global.NewContact',
    },
].forEach(async (entry) => {
    await helpers.requestGetAndSave(
        `/ui-api/actions/global/${entry.queryString}`,
        path.join(rootDir, `${entry.filename}.json`)
    );
});
