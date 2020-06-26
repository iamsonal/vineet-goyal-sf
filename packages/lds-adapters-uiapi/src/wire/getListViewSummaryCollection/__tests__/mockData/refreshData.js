const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);

const OBJECT_API_NAME = 'Opportunity';

// "visit" every other list view so recentListsOnly will have some data; note that
// this might not have the desired effect if someone has logged in & looked at the
// list views manually
const listviews = (await $conn.sobject(OBJECT_API_NAME).listviews()).listviews;
const recentIds = listviews
    .filter((lv, i) => i % 2)
    .map(lv => `'${lv.id}'`)
    .join(',');
await $conn.query(`SELECT id FROM ListView WHERE id IN (${recentIds}) FOR VIEW`);

const entries = [
    {
        filename: 'list-ui-Opportunity',
        params: '',
    },
];

entries.forEach(async function(entry) {
    await helpers.requestGetAndSave(
        `/ui-api/list-ui/${OBJECT_API_NAME}${entry.params}`,
        path.join(rootDir, `${entry.filename}.json`)
    );
});
