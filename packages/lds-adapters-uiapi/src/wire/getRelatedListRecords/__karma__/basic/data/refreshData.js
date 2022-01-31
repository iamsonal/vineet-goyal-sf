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
        Name: 'RelatedListTestAccount',
        Phone: '1234567',
    },
});
const accountId = accountResult.id;
createdRecordIds.push(accountId);

// create 5 Opportunities associated with the Account
for (let i = 1; i <= 5; i++) {
    const opportunityResult = await helpers.requestPost('/ui-api/records/', {
        apiName: 'Opportunity',
        fields: {
            Name: `RelatedListTestOpp${i}`,
            StageName: 'Qualification',
            CloseDate: `2022-12-0${i}`,
            AccountId: accountId,
        },
    });
    createdRecordIds.push(opportunityResult.id);
}

// create 3 pages data
for (let i = 0; i < 3; i++) {
    const pageSize = 2;
    const pageToken = String(i * pageSize);
    const page = await helpers.requestPost(
        `/ui-api/related-list-records/${accountId}/Opportunities`,
        {
            pageToken,
            pageSize,
            fields: ['Opportunity.Name'],
        }
    );

    fs.writeFileSync(
        path.join(rootDir, `mockData-token-${pageToken}-pageSize-${pageSize}.json`),
        JSON.stringify(page, null, 2)
    );
}

// single page - page size 6
const token0PageSize6 = await helpers.requestPost(
    `/ui-api/related-list-records/${accountId}/Opportunities`,
    {
        pageSize: 6,
        fields: ['Opportunity.Name'],
    }
);

fs.writeFileSync(
    path.join(rootDir, `mockData-token-0-pageSize-6.json`),
    JSON.stringify(token0PageSize6, null, 2)
);

/** Cleanup */
createdRecordIds.forEach((id) => {
    helpers.requestDelete(`/ui-api/records/${id}`);
});
