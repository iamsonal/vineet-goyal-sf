const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);

const OBJECT_API_NAME = 'Account';
const LIST_VIEW_API_NAME = 'AllAccounts';

[
    {
        endpoint: 'list-ui',
    },
    {
        endpoint: 'list-ui',
        pageSize: 3,
    },
    {
        endpoint: 'list-ui',
        pageSize: 6,
    },
    {
        endpoint: 'list-ui',
        pageToken: 3,
        pageSize: 3,
    },
    {
        endpoint: 'list-records',
        pageToken: 3,
        pageSize: 3,
    },

    // string/schema fields/optionalFields
    {
        endpoint: 'list-ui',
        pageSize: 1,
        params: ['fields=Rating,Website'],
    },
    {
        endpoint: 'list-ui',
        pageSize: 1,
        params: ['fields=Account.Rating,Account.Website'],
    },
    {
        endpoint: 'list-ui',
        pageSize: 1,
        params: ['optionalFields=Rating,Website'],
    },
    {
        endpoint: 'list-ui',
        pageSize: 1,
        params: ['optionalFields=Account.Rating,Account.Website'],
    },
].forEach(async function (entry) {
    let url = `/ui-api/${entry.endpoint}/${OBJECT_API_NAME}/${LIST_VIEW_API_NAME}`;
    let filename = `${entry.endpoint}-${OBJECT_API_NAME}-${LIST_VIEW_API_NAME}`;
    let parameters = [];

    if (entry.pageToken) {
        parameters.push(`pageToken=${entry.pageToken}`);
        filename += `-pageToken-${entry.pageToken}`;
    }

    if (entry.pageSize) {
        parameters.push(`pageSize=${entry.pageSize}`);
        filename += `-pageSize-${entry.pageSize}`;
    }

    if (entry.params) {
        parameters.push(...entry.params);
        filename += '-' + entry.params.map((p) => p.replace('=', '-')).join('-');
    }

    if (parameters.length) {
        url += `?${parameters.join('&')}`;
    }

    await helpers.requestGetAndSave(url, path.join(rootDir, `${filename}.json`));
});
