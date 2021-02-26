const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);

try {
    const entries = [
        {
            endpoint: `NewContact`,
            filename: 'quick_action_defaults',
        },
        {
            endpoint: `Create_Custom_Object_2?optionalFields=Make__c,Model__c`,
            filename: 'quick_action_defaults_fields',
        },
        {
            endpoint: `Create_Custom_Object_2?optionalFields=Number__c`,
            filename: 'quick_action_defaults_field_number',
        },
        {
            endpoint: `Create_Custom_Object_3`,
            filename: 'quick_action_defaults_error',
        },
        {
            endpoint: `Create_Custom_Object_2`,
            filename: 'quick_action_defaults_field_make',
        },
        {
            endpoint: `Create_Custom_Object_2`,
            filename: 'quick_action_defaults_field_model',
        },
    ];

    entries.forEach(async function({ endpoint, filename }) {
        await helpers.requestGetAndSave(
            `/ui-api/actions/record-defaults/${endpoint}`,
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
