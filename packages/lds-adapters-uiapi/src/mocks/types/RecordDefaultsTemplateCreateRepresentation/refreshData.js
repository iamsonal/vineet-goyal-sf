const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);

try {
    const customObjectApiName = 'Custom_Object__c';
    const customObjectLabel = 'Custom Object';
    await helpers.createSObject(customObjectApiName, customObjectLabel);

    await helpers.requestGetAndSave(
        `/ui-api/record-defaults/template/create/${customObjectApiName}`,
        path.join(rootDir, 'record-template-create-Custom_Object__c.json')
    );
} catch (e) {
    // eslint-disable-next-line no-console
    console.error('Error during script: ', e);
    throw e;
} finally {
    await helpers.cleanup();
}
