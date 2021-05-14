const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);

const ACCOUNT_NAME = 'Burlington Textiles Corp of America';
const accountRecordId = await helpers.getAccountByName(ACCOUNT_NAME);

try {
    const entries = [
        {
            endpoint: `record-defaults/template/clone/${accountRecordId}`,
            filename: 'record-template-clone-Account',
        },
        {
            endpoint: 'record-defaults/template/clone/001RM000004PkciYAC',
            filename: 'record-template-clone-recordIdInvalid',
        },
        {
            endpoint: `record-defaults/template/clone/${accountRecordId}?recordTypeId=001RM000004PkciYAC`,
            filename: 'record-template-clone-recordTypeIdInvalid',
        },
    ];

    entries.forEach(async function ({ endpoint, filename }) {
        await helpers.requestGetAndSave(
            `/ui-api/${endpoint}`,
            path.join(rootDir, `${filename}.json`)
        );
    });
} catch (e) {
    // eslint-disable-next-line no-console
    console.error('Error during script: ', e);
}
