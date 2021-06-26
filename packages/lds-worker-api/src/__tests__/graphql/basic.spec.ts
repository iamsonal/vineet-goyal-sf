import { adapterName as gqlAdapterName } from '@salesforce/lds-adapters-graphql';
import { invokeAdapter, OnSnapshot } from '../../executeAdapter';
import { addMockNetworkResponse } from '../mocks/mockNimbusNetwork';

import recordQuery_account1 from './mockData/RecordQuery-Account-fields-Name.json';

const query = `query { uiapi { query { Account(where:  { Name:  { like: "Account1" } }) @connection { edges { node { Id, WeakEtag, Name { value, displayValue  } } } } } } }`;

describe(`executeAdapter("${gqlAdapterName}")`, () => {
    it('takes in gql query string and calls the GQL adapter', (done) => {
        // setup mock response
        addMockNetworkResponse('POST', '/services/data/v53.0/graphql', {
            headers: {},
            status: 200,
            body: JSON.stringify(recordQuery_account1),
        });

        const onSnapshot: OnSnapshot = (value) => {
            const { data, error } = value;

            expect(data).toEqual(recordQuery_account1);
            expect(error).toBeUndefined();
            done();
        };

        invokeAdapter('graphQL', JSON.stringify({ query, variables: {} }), onSnapshot);
    });
});
