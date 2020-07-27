#!/usr/bin/env sfdx repl:script

const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);
const helpers = require(helpersPath);

try {
    await helpers.createSObject('TestEntity__c', 'Test Entity', 2);
    const [recordType1, recordType2] = (
        await $conn.describeSObject('TestEntity__c')
    ).recordTypeInfos
        .filter(rti => rti.name !== 'Master')
        .sort((rti1, rti2) => (rti1.name < rti2.name ? -1 : rti1.name > rti2.name ? 1 : 0))
        .map(rti => rti.recordTypeId);

    const entries = [
        {
            endpoint: 'record-defaults/create/Account',
            filename: 'record-defaults-create-Account',
        },
        {
            endpoint: 'record-defaults/create/Account?optionalFields=Account.YearStarted',
            filename: 'record-defaults-create-Account-optionalFields-Account.YearStarted',
        },
        {
            endpoint: 'record-defaults/create/Account?optionalFields=Account.Test',
            filename: 'record-defaults-create-Account-optionalFields-Account.Test',
        },
        {
            // UI API does not support many non-layoutable entities; Partner was selected by intersecting
            // the list of entities from https://developer.salesforce.com/docs/atlas.en-us.uiapi.meta/uiapi/ui_api_get_started_supported_objects.htm
            // with:
            //
            //    (await $conn.describeGlobal()).sobjects.filter(so => so.layoutable === false).map(so => so.name)
            endpoint: 'record-defaults/create/Partner',
            filename: 'record-defaults-Partner',
        },
        {
            endpoint: 'object-info/Account',
            filename: 'object-info-Account',
        },
        {
            endpoint: 'layout/Account?mode=Create',
            filename: 'layout-Account-Full-Create',
        },
        {
            endpoint: `record-defaults/create/TestEntity__c?recordTypeId=${recordType1}`,
            filename: 'record-defaults-create-TestEntity__c-recordTypeId-1',
        },
        {
            endpoint: `record-defaults/create/TestEntity__c?recordTypeId=${recordType2}`,
            filename: 'record-defaults-create-TestEntity__c-recordTypeId-2',
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
    throw e;
} finally {
    await helpers.cleanup();
}
