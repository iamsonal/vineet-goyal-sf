import { Environment, Luvio, Store } from '@luvio/engine';
import { LuvioOperationDefinitionNode } from '@salesforce/lds-graphql-parser';
import { createIngest, createRead } from '../Operation';

describe('Operation', () => {
    describe('read', () => {
        it('should read child objects correctly', () => {
            const ast: LuvioOperationDefinitionNode = {
                kind: 'OperationDefinition',
                operation: 'query',
                variableDefinitions: [],
                name: 'operationName',
                luvioSelections: [
                    {
                        kind: 'ObjectFieldSelection',
                        name: 'Name',
                        luvioSelections: [
                            {
                                kind: 'ScalarFieldSelection',
                                name: 'value',
                            },
                            {
                                kind: 'ScalarFieldSelection',
                                name: 'displayValue',
                            },
                        ],
                    },
                ],
            };

            const data = {
                Name: {
                    value: 'Account1',
                    displayValue: null,
                },
            };

            const store = new Store();
            store.records = {
                'gql::Record::001RM000004uuhnYAA__Name': {
                    value: 'Account1',
                    displayValue: null,
                },
                toplevel__uiapi__query: {
                    Id: '001RM000004uuhnYAA',
                    WeakEtag: 1615493739000,
                    Name: {
                        __ref: 'gql::Record::001RM000004uuhnYAA__Name',
                    },
                },
            };

            const luvio = new Luvio(
                new Environment(store, () => {
                    throw new Error('Not used');
                })
            );

            const snap = luvio.storeLookup({
                recordId: 'toplevel__uiapi__query',
                node: {
                    kind: 'Fragment',
                    synthetic: false,
                    reader: true,
                    read: createRead(ast),
                },
                variables: {},
            });

            expect(snap.data).toEqual(data);
        });
    });

    describe('ingest', () => {
        it('should ingest data correctly', () => {
            const ast: LuvioOperationDefinitionNode = {
                kind: 'OperationDefinition',
                operation: 'query',
                variableDefinitions: [],
                name: 'operationName',
                luvioSelections: [
                    {
                        kind: 'ObjectFieldSelection',
                        name: 'uiapi',
                        luvioSelections: [
                            {
                                kind: 'ObjectFieldSelection',
                                name: 'query',
                                luvioSelections: [
                                    {
                                        kind: 'CustomFieldSelection',
                                        name: 'Account',
                                        type: 'Connection',
                                        luvioSelections: [
                                            {
                                                kind: 'ObjectFieldSelection',
                                                name: 'edges',
                                                luvioSelections: [
                                                    {
                                                        kind: 'CustomFieldSelection',
                                                        name: 'node',
                                                        type: 'Record',
                                                        luvioSelections: [
                                                            {
                                                                kind: 'ObjectFieldSelection',
                                                                name: 'Name',
                                                                luvioSelections: [
                                                                    {
                                                                        kind:
                                                                            'ScalarFieldSelection',
                                                                        name: 'value',
                                                                    },
                                                                    {
                                                                        kind:
                                                                            'ScalarFieldSelection',
                                                                        name: 'displayValue',
                                                                    },
                                                                ],
                                                            },
                                                        ],
                                                    },
                                                ],
                                            },
                                        ],
                                        arguments: [
                                            {
                                                kind: 'Argument',
                                                name: 'where',
                                                value: {
                                                    kind: 'ObjectValue',
                                                    fields: {
                                                        Name: {
                                                            kind: 'ObjectValue',
                                                            fields: {
                                                                like: {
                                                                    kind: 'StringValue',
                                                                    value: 'Account1',
                                                                },
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            };

            const data = {
                uiapi: {
                    query: {
                        Account: {
                            edges: [
                                {
                                    node: {
                                        Id: '001RM000004uuhnYAA',
                                        WeakEtag: 1615493739000,
                                        Name: {
                                            value: 'Account1',
                                            displayValue: null,
                                        },
                                    },
                                },
                            ],
                        },
                    },
                },
            };

            const store = new Store();
            const luvio = new Luvio(
                new Environment(store, () => {
                    throw new Error('Not used');
                })
            );

            createIngest(ast)(
                data,
                {
                    parent: null,
                    fullPath: 'toplevel',
                    propertyName: null,
                },
                luvio,
                store,
                0
            );

            expect(store.records).toEqual({
                'gql::Record::001RM000004uuhnYAA__Name': {
                    value: 'Account1',
                    displayValue: null,
                },
                'gql::Record::001RM000004uuhnYAA': {
                    Id: '001RM000004uuhnYAA',
                    WeakEtag: 1615493739000,
                    Name: {
                        __ref: 'gql::Record::001RM000004uuhnYAA__Name',
                    },
                },
                'gql::Connection::Account(where:{Name:{like:"Account1"}})__edges__0': {
                    node: {
                        __ref: 'gql::Record::001RM000004uuhnYAA',
                    },
                },
                'gql::Connection::Account(where:{Name:{like:"Account1"}})__edges': [
                    {
                        __ref: 'gql::Connection::Account(where:{Name:{like:"Account1"}})__edges__0',
                    },
                ],
                'gql::Connection::Account(where:{Name:{like:"Account1"}})': {
                    edges: {
                        __ref: 'gql::Connection::Account(where:{Name:{like:"Account1"}})__edges',
                    },
                },
                toplevel__uiapi__query: {
                    Account: {
                        __ref: 'gql::Connection::Account(where:{Name:{like:"Account1"}})',
                    },
                },
                toplevel__uiapi: {
                    query: {
                        __ref: 'toplevel__uiapi__query',
                    },
                },
                toplevel: {
                    uiapi: {
                        __ref: 'toplevel__uiapi',
                    },
                },
            });
        });

        describe('merge ingest', () => {
            const fooAst: LuvioOperationDefinitionNode = {
                kind: 'OperationDefinition',
                operation: 'query',
                variableDefinitions: [],
                luvioSelections: [
                    {
                        kind: 'ObjectFieldSelection',
                        name: 'foo',
                        luvioSelections: [
                            {
                                kind: 'ScalarFieldSelection',
                                name: 'field1',
                            },
                        ],
                    },
                ],
            };

            const barAst: LuvioOperationDefinitionNode = {
                kind: 'OperationDefinition',
                operation: 'query',
                variableDefinitions: [],
                luvioSelections: [
                    {
                        kind: 'ObjectFieldSelection',
                        name: 'bar',
                        luvioSelections: [
                            {
                                kind: 'ScalarFieldSelection',
                                name: 'field1',
                            },
                        ],
                    },
                ],
            };

            it('should merge ingest data correctly', () => {
                const fooData = {
                    foo: {
                        field1: 'Field1 - 1',
                    },
                };

                const barData = {
                    bar: {
                        field1: 'Field1 - 2',
                    },
                };

                const store = new Store();
                const luvio = new Luvio(
                    new Environment(store, () => {
                        throw new Error('Not used');
                    })
                );

                createIngest(fooAst)(
                    fooData,
                    {
                        parent: null,
                        fullPath: 'toplevel',
                        propertyName: null,
                    },
                    luvio,
                    store,
                    0
                );

                createIngest(barAst)(
                    barData,
                    {
                        parent: null,
                        fullPath: 'toplevel',
                        propertyName: null,
                    },
                    luvio,
                    store,
                    0
                );

                expect(store.records).toEqual({
                    toplevel__foo: {
                        field1: 'Field1 - 1',
                    },
                    toplevel__bar: {
                        field1: 'Field1 - 2',
                    },
                    toplevel: {
                        foo: {
                            __ref: 'toplevel__foo',
                        },
                        bar: {
                            __ref: 'toplevel__bar',
                        },
                    },
                });
            });
        });
    });
});
