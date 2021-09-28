const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);

const ACCOUNT_NAME = 'Burlington Textiles Corp of America';
const ACCOUNT_NAME_2 = 'Edge Communications';
const id = await helpers.getAccountByName(ACCOUNT_NAME);
const id_2 = await helpers.getAccountByName(ACCOUNT_NAME_2);

await helpers.requestGetAndSave(
    `/ui-api/record-ui/${id},${id_2}?layoutTypes=Full&modes=View`,
    path.join(rootDir, 'multiple-record-Account-layouttypes-Full-modes-View.json')
);
