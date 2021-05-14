const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);

try {
    const customObject2ApiName = 'Custom_Object_2__c';
    const customObject2Label = 'Custom Object 2';
    await helpers.createSObject(customObject2ApiName, customObject2Label, 1);

    const numberFieldApiName = 'Number__c';
    const numberFieldLabel = 'Number';
    await helpers.createCustomField(
        customObject2ApiName,
        numberFieldApiName,
        'Number',
        numberFieldLabel,
        { defaultValue: 5, precision: 3, scale: 0 }
    );

    const recordTypeLabel = `${customObject2Label} Type 1`;
    const recordTypeId = await helpers.getRecordTypeId(customObject2ApiName, recordTypeLabel);

    const entries = [
        // Generate mock for Custom_Object_2__c with 1 record type
        {
            endpoint: `record-defaults/template/create/${customObject2ApiName}`,
            filename: 'record-template-create-Custom_Object_2__c',
        },
        {
            endpoint: `record-defaults/template/create/${customObject2ApiName}?recordTypeId=${recordTypeId}&optionalFields=${customObject2ApiName}.${numberFieldApiName}`,
            filename: 'record-template-create-Custom_Object_2__c-optionalField-Number',
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
} finally {
    await helpers.cleanup();
}
