const fs = require('fs');
const path = require('path');

const helpersPath = process.argv[process.argv.length - 1];
const rootDir = path.dirname(process.argv[3]);

const helpers = require(helpersPath);

/** Setup */
const createdRecordIds = [];

const accountResult = await helpers.requestPost('/ui-api/records/', {
    apiName: 'Account',
    fields: {
        Name: 'Account1',
        Phone: '1234567',
    },
});
const accountId = accountResult.id;
createdRecordIds.push(accountId);

// create two Opportunities associated with the Account
for (let i = 1; i <= 2; i++) {
    const opportunityResult = await helpers.requestPost('/ui-api/records/', {
        apiName: 'Opportunity',
        fields: {
            Name: `Opp${i}`,
            StageName: 'Qualification',
            CloseDate: `2022-12-0${i}`,
            AccountId: accountId,
        },
    });
    createdRecordIds.push(opportunityResult.id);
}

/** Generate Mock Data */
const queryNames = fs
    .readdirSync(rootDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

const queryPromises = queryNames.map((queryName) => {
    const query = require(path.join(rootDir, queryName, 'query'));

    return helpers.requestPost('/graphql', {
        query: query.query,
        variables: query.variables,
    });
});
const dataList = await Promise.all(queryPromises);

dataList.forEach((data, index) => {
    fs.writeFileSync(
        path.join(rootDir, queryNames[index], 'mockData.json'),
        JSON.stringify(data, null, 2)
    );
});

/** Cleanup */
createdRecordIds.forEach((result) => {
    helpers.requestDelete(`/ui-api/records/${result.id}`);
});
