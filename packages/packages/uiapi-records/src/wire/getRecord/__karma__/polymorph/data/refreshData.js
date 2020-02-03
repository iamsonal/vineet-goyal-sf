const fs = require('fs');
const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);

const CASE_NUMBER = '00001002';
const id = await helpers.getCaseByNumber(CASE_NUMBER);
const caseResult = await helpers.requestGet(
    `/ui-api/records/${id}?fields=Case.Id,Case.Owner.Id,Case.Owner.Type`
);

const filename = path.join(
    rootDir,
    'record-Case-fields-Case.Id-Case.Owner.Id-Case.Owner.Type.json'
);
fs.writeFileSync(filename, JSON.stringify(caseResult, null, 4));

const ownerId = caseResult.fields.OwnerId.value;
await helpers.requestGetAndSave(
    `/ui-api/records/${ownerId}?fields=User.Name`,
    path.join(rootDir, 'record-User-fields-User.Name.json')
);
