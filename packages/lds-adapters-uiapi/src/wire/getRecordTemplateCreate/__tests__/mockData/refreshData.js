const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);

try {
    const customObjectApiName = 'Custom_Object__c';
    const customObjectLabel = 'Custom Object';
    await helpers.createSObject(customObjectApiName, customObjectLabel);

    const entries = [
        // Generate mock for Custom_Object__c with no record types
        {
            endpoint: `record-defaults/template/create/${customObjectApiName}`,
            filename: 'record-template-create-Custom_Object__c',
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
    throw e;
} finally {
    await helpers.cleanup();
}
