const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);

const ACCOUNT_NAME = 'Burlington Textiles Corp of America';
const accountId = await helpers.getAccountByName(ACCOUNT_NAME);

const sysAdminUserId = await helpers.getSysAdminUserId();

// Account record data
await helpers.requestGetAndSave(
    `/ui-api/records/${accountId}?fields=Account.Id,Account.Name`,
    path.join(rootDir, 'record-Account-fields-Account.Id,Account.Name.json')
);

// User record data
await helpers.requestGetAndSave(
    `/ui-api/records/${sysAdminUserId}?fields=User.Id,User.Name`,
    path.join(rootDir, 'record-User-fields-User.Id,User.Name.json')
);
