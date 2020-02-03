const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);

const ACCOUNT_NAME = 'Burlington Textiles Corp of America';
const id = await helpers.getAccountByName(ACCOUNT_NAME);

await helpers.requestGetAndSave(
    `/ui-api/record-ui/${id}?layoutTypes=InvalidLayoutType&modes=View`,
    path.join(rootDir, 'single-record-invalid-layouttype-modes-View.json')
);
