import networkAdapter from '@salesforce/lds-network-aura';

function createResourceRequest() {
    return {
        baseUri: '/services/data/v52.0',
        basePath: '/ui-api/object-info/Account',
        method: 'get',
        body: null,
        urlParams: { objectApiName: 'Account' },
        queryParams: {},
        headers: {},
    };
}

describe('network adapter', () => {
    benchmark('network adpater with rate limiting', () => {
        let config;
        before(() => {
            config = createResourceRequest();
        });

        run(() => {
            networkAdapter(config);
        });
    });
});
