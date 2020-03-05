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
        filename: 'single-record-invalid-layouttype-modes-View',
        params: '?layoutTypes=InvalidLayoutType&modes=View',
    },
].forEach(async ({ filename, params }) => {
    await helpers.requestGetAndSave(
        `/ui-api/record-ui/${id}${params}`,
        path.join(rootDir, `${filename}.json`)
    );
});
