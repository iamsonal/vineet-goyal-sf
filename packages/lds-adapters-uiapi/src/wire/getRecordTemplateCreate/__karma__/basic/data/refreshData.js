const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);

try {
    const customObjectApiName = 'Custom_Object__c';
    const customObjectLabel = 'Custom Object';
    await helpers.createSObject(customObjectApiName, customObjectLabel);

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

    const lookupFieldApiName = 'Account__c';
    const lookupFieldLabel = 'Account';
    await helpers.createCustomField(
        customObject2ApiName,
        lookupFieldApiName,
        'Lookup',
        lookupFieldLabel,
        { referenceTo: 'Account', relationshipName: 'Custom_Objects_2' }
    );

    const recordTypeLabel = `${customObject2Label} Type 1`;
    const recordTypeId = await helpers.getRecordTypeId(customObject2ApiName, recordTypeLabel);

    const entries = [
        // Generate mock for Custom_Object__c with no record types
        {
            endpoint: `record-defaults/template/create/${customObjectApiName}`,
            filename: 'record-template-create-Custom_Object__c',
        },

        // Generate mocks for Custom_Object_2__c with 1 record type
        {
            endpoint: `object-info/${customObject2ApiName}`,
            filename: 'object-info-Custom_Object_2__c',
        },
        {
            endpoint: `records/${recordTypeId}?optionalFields=RecordType.Id,RecordType.Name`,
            filename: 'record-RecordType',
        },
        {
            endpoint: `record-defaults/template/create/${customObject2ApiName}?recordTypeId=${recordTypeId}&optionalFields=${customObject2ApiName}.${numberFieldApiName}`,
            filename: 'record-template-create-Custom_Object_2__c-optionalField-Number',
        },
        {
            endpoint: `record-defaults/template/create/${customObject2ApiName}?recordTypeId=${recordTypeId}&optionalFields=${customObject2ApiName}.Owner.Id,${customObject2ApiName}.Owner.Name,${customObject2ApiName}.RecordType.Id,${customObject2ApiName}.RecordType.Name`,
            filename: 'record-template-create-Custom_Object_2__c-optionalField-RecordType-Owner',
        },
        {
            endpoint: `record-defaults/template/create/${customObject2ApiName}?recordTypeId=${recordTypeId}&optionalFields=${customObject2ApiName}.${lookupFieldApiName}.Id,${customObject2ApiName}.${lookupFieldApiName}.Name`,
            filename: 'record-template-create-Custom_Object_2__c-optionalField-Lookup',
        },
        {
            endpoint: `record-defaults/template/create/${customObject2ApiName}?recordTypeId=${recordTypeId}&optionalFields=${customObject2ApiName}.${lookupFieldApiName}.Id,${customObject2ApiName}.${lookupFieldApiName}.Name,${customObject2ApiName}.${numberFieldApiName}`,
            filename: 'record-template-create-Custom_Object_2__c-optionalField-Lookup-Number',
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
