const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);

try {
    const entries = [
        {
            endpoint: 'record-defaults/template/create/Foo',
            filename: 'record-template-create-objectApiNameInvalid',
        },
        {
            endpoint: 'record-defaults/template/create/Account?recordTypeId=001RM000004PkciYAC',
            filename: 'record-template-create-recordTypeIdInvalid',
        },
    ];

    entries.forEach(async function({ endpoint, filename }) {
        await helpers.requestGetAndSave(
            `/ui-api/${endpoint}`,
            path.join(rootDir, `${filename}.json`)
        );
    });
} catch (e) {
    // eslint-disable-next-line no-console
    console.error('Error during script: ', e);
}
