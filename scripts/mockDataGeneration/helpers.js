const fs = require('fs');

const API_VERSION = 'v49.0';
const URL_BASE = `/services/data/${API_VERSION}`;

const toDelete = [];

async function cleanup() {
    while (toDelete.length) {
        // delete in the order items were created since there may be dependencies
        // between records
        const entry = toDelete.shift();
        // eslint-disable-next-line no-console
        console.log(`Deleting ${entry.type} with id ${entry.id}`);
        // eslint-disable-next-line no-undef
        await $conn.sobject(entry.type).destroy(entry.id);
    }
}

async function createContactWithOwner(ownerId, firstName = 'SFDX', lastName = 'User') {
    // eslint-disable-next-line no-console
    console.log(`Creating Contact with Owner ${ownerId}`);
    let results = await $conn.create('Contact', {
        LastName: lastName,
        FirstName: firstName,
        OwnerId: ownerId,
    });
    if (results.success) {
        toDelete.push({ type: 'Contact', id: results.id });
        return results.id;
    } else {
        throw new Error(`Error creating account with Owner ${ownerId}: ${results.errors}`);
    }
}

async function createAccountWithOwner(ownerId, accountName = 'SFDX Account') {
    // eslint-disable-next-line no-undef
    console.log(`Creating Account with Owner ${ownerId}`);
    let results = await $conn.create('Account', {
        Name: accountName,
        OwnerId: ownerId,
    });
    if (results.success) {
        toDelete.push({ type: 'Account', id: results.id });
        return results.id;
    } else {
        throw new Error(`Error creating account with Owner ${ownerId}: ${results.errors}`);
    }
}

async function createOpportunityWithAccount(accountId) {
    // eslint-disable-next-line no-console
    console.log(`Creating Opportunity with Account ${accountId}`);
    // eslint-disable-next-line no-undef
    let results = await $conn.create('Opportunity', {
        Name: 'SFDX Opportunity',
        AccountId: accountId,
        StageName: 'Needs Analysis',
        CloseDate: '2007-02-08',
    });
    if (results.success) {
        toDelete.push({ type: 'Opportunity', id: results.id });
        return results.id;
    } else {
        throw new Error(`Error creating Opportunity with Account ${accountId}: ${results.errors}`);
    }
}

async function getAccountByName(name) {
    return getIdFromSoql(`SELECT Id FROM Account WHERE Name = '${name}' LIMIT 1`);
}

async function getCaseByNumber(number) {
    return getIdFromSoql(`SELECT Id FROM Case WHERE CaseNumber = '${number}' LIMIT 1`);
}

async function getIdFromSoql(soql) {
    return new Promise(function(resolve, reject) {
        // eslint-disable-next-line no-undef
        $conn.query(soql, function(err, res) {
            if (err) {
                // eslint-disable-next-line no-console
                console.error(err);
                return reject(err);
            }
            const id = res.records && res.records[0] && res.records[0].Id;
            if (!id) {
                // eslint-disable-next-line no-console
                console.error(`Could not get Id for SOQL query <${soql}>`);
                return reject();
            }
            resolve(id);
        });
    });
}

async function getListViewByName(name) {
    return getIdFromSoql(`SELECT Id FROM ListView WHERE Name = '${name}' LIMIT 1`);
}

async function getOpportunityByName(name) {
    return getIdFromSoql(`SELECT Id FROM Opportunity WHERE Name = '${name}' LIMIT 1`);
}

async function getSysAdminUserId() {
    // to get the System Admin user we first need to get the ProfileId
    const sysAdminProfileId = await getIdFromSoql(
        "SELECT Id,Name FROM Profile WHERE Name = 'System Administrator' LIMIT 1"
    );
    return getIdFromSoql(`SELECT Id FROM User WHERE ProfileId = '${sysAdminProfileId}' LIMIT 1`);
}

async function requestPost(url, body) {
    const fullUrl = URL_BASE + url;
    // eslint-disable-next-line no-console
    console.log(`Making POST request to ${fullUrl}`);

    let result;

    try {
        // eslint-disable-next-line no-undef
        result = await $conn.requestPost(fullUrl, body);
    } catch (e) {
        // some requests are expecting an error response
        result = [
            {
                errorCode: e.errorCode,
                message: e.message,
            },
        ];
    }

    return result;
}

async function requestDelete(url) {
    const fullUrl = URL_BASE + url;
    // eslint-disable-next-line no-console
    console.log(`Making DELETE request to ${fullUrl}`);

    let result;

    try {
        // eslint-disable-next-line no-undef
        result = await $conn.requestDelete(fullUrl);
    } catch (e) {
        // some requests are expecting an error response
        result = [
            {
                errorCode: e.errorCode,
                message: e.message,
            },
        ];
    }

    return result;
}

async function requestGet(url) {
    const fullUrl = URL_BASE + url;
    // eslint-disable-next-line no-console
    console.log(`Making GET request to ${fullUrl}`);

    let result;
    const request = {
        method: 'get',
        url: fullUrl,
    };

    try {
        // eslint-disable-next-line no-undef
        result = await $conn.request(request);
    } catch (e) {
        // some requests are expecting an error response
        result = [
            {
                errorCode: e.errorCode,
                message: e.message,
            },
        ];
    }

    return result;
}

async function requestGetAndSave(url, filename) {
    const result = await requestGet(url);
    return fs.writeFileSync(filename, JSON.stringify(result, null, 4));
}

async function getRecordId(recordName, entityName) {
    return getIdFromSoql(`SELECT Id FROM ${entityName} WHERE Name = '${recordName}' LIMIT 1`);
}

module.exports = {
    cleanup,
    createAccountWithOwner,
    createOpportunityWithAccount,
    getAccountByName,
    getCaseByNumber,
    getListViewByName,
    getOpportunityByName,
    getRecordId,
    getSysAdminUserId,
    requestDelete,
    requestGet,
    requestGetAndSave,
    createContactWithOwner,
    requestPost,
};
