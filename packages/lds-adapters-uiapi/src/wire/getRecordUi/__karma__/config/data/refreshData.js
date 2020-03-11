const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);

const ACCOUNT_NAME = 'Burlington Textiles Corp of America';
const id = await helpers.getAccountByName(ACCOUNT_NAME);

[
    {
        filename: 'single-record-Account-layoutTypes-Full-modes-View',
        params: '?layoutTypes=Full&modes=View',
    },
    {
        filename: 'recordUi-layoutTypes-Invalid-modes-View',
        params: '?layoutTypes=Invalid&modes=View',
    },
    {
        filename: 'recordUi-layoutTypes-Full-modes-Invalid',
        params: '?layoutTypes=Full&modes=Invalid',
    },
].forEach(async ({ filename, params }) => {
    await helpers.requestGetAndSave(
        `/ui-api/record-ui/${id}${params}`,
        path.join(rootDir, `${filename}.json`)
    );
});

// invalid recordId with 18-char length
await helpers.requestGetAndSave(
    `/ui-api/record-ui/${'x'.repeat(18)}`,
    path.join(rootDir, 'recordUi-Invalid-recordIds.json')
);
