import { adapterName as gqlAdapterName } from '@salesforce/lds-adapters-graphql';
import { executeAdapter, invokeAdapter, OnSnapshot } from '../../executeAdapter';
import { addMockNetworkResponse } from '../mocks/mockNimbusNetwork';
import { mockInstrumentation } from 'o11y/client';

import recordQuery_account1 from './mockData/RecordQuery-Account-fields-Name.json';

const query = `query { uiapi { query { Account(where:  { Name:  { like: "Account1" } }) @connection { edges { node { Id, WeakEtag, Name { value, displayValue  } } } } } } }`;

describe(`invokeAdapter("${gqlAdapterName}")`, () => {
    beforeEach(() => {
        mockInstrumentation.error.mockReset();
    });
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

    it('returns malformed query error in error callback', (done) => {
        const onSnapshot: OnSnapshot = (value) => {
            const { data, error } = value;

            expect(data).not.toBeDefined();
            expect(error).toEqual(
                expect.objectContaining(Error('Syntax Error: Expected Name, found <EOF>.'))
            );
            done();
        };

        invokeAdapter('graphQL', JSON.stringify({ query: `query {`, variables: {} }), onSnapshot);
    });

    it('logs error when recieves malformed query error', (done) => {
        const onSnapshot: OnSnapshot = () => {
            expect(mockInstrumentation.error).toHaveBeenCalledTimes(1);
            expect(mockInstrumentation.error).toHaveBeenCalledWith(
                Error('Syntax Error: Expected Name, found <EOF>.'),
                'gql-parse-error'
            );
            done();
        };

        invokeAdapter('graphQL', JSON.stringify({ query: `query {`, variables: {} }), onSnapshot);
    });
});

describe(`executeAdapter("${gqlAdapterName}")`, () => {
    beforeEach(() => {
        mockInstrumentation.error.mockReset();
    });

    it('returns malformed query error in error callback', (done) => {
        const onSnapshot: OnSnapshot = (value) => {
            const { data, error } = value;

            expect(data).not.toBeDefined();
            expect(error).toEqual(
                expect.objectContaining(Error('Syntax Error: Expected Name, found <EOF>.'))
            );
            done();
        };

        executeAdapter('graphQL', JSON.stringify({ query: `query {`, variables: {} }), onSnapshot);
    });

    it('logs error when recieves malformed query error', (done) => {
        const onSnapshot: OnSnapshot = () => {
            expect(mockInstrumentation.error).toHaveBeenCalledTimes(1);
            expect(mockInstrumentation.error).toHaveBeenCalledWith(
                Error('Syntax Error: Expected Name, found <EOF>.'),
                'gql-parse-error'
            );
            done();
        };

        executeAdapter('graphQL', JSON.stringify({ query: `query {`, variables: {} }), onSnapshot);
    });
});
