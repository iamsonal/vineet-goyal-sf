const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);

const ACCOUNT_NAME_1 = 'Burlington Textiles Corp of America';
const ACCOUNT_NAME_2 = 'Edge Communications';

const accountId1 = await helpers.getAccountByName(ACCOUNT_NAME_1);
const accountId2 = await helpers.getAccountByName(ACCOUNT_NAME_2);

await helpers.requestGetAndSave(
    `/ui-api/records/batch/${accountId1},${accountId2}?fields=Account.Id,Account.Name`,
    path.join(rootDir, 'records-multiple-record-Accounts.json')
);
