const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);

[
    {
        filename: 'global-actions',
        queryString: '',
    },
].forEach(async (entry) => {
    await helpers.requestGetAndSave(
        `/ui-api/actions/global/${entry.queryString}`,
        path.join(rootDir, `${entry.filename}.json`)
    );
});

const ACCOUNT_NAME = 'Burlington Textiles Corp of America';
const recordId = await helpers.getAccountByName(ACCOUNT_NAME);
const result = await helpers.requestGet(
    `/ui-api/record-ui/${recordId}?childRelationships=Account.Opportunities`
);
const relatedListRecordIds =
    result.records[recordId].childRelationships.Opportunities.records[0].id;
[
    {
        filename: 'record-edit-actions',
        route: '/record-edit',
    },
    {
        filename: 'record-actions',
        route: '',
    },
    {
        filename: 'related-list-record-actions',
        route: `/related-list-record/${relatedListRecordIds}`,
    },
].forEach(async (entry) => {
    await helpers.requestGetAndSave(
        `/ui-api/actions/record/${recordId}${entry.route}`,
        path.join(rootDir, `${entry.filename}.json`)
    );
});
