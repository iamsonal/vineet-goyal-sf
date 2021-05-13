import { Environment, Luvio, Selector, Store } from '@luvio/engine';
import { LuvioSelectionObjectFieldNode } from '@salesforce/lds-graphql-parser';
import { createIngest, createRead } from '../ObjectField';

describe('ObjectField', () => {
    describe('Cache Reading', () => {
        it('should follow nested objects properly', () => {
            const ast: LuvioSelectionObjectFieldNode = {
                kind: 'ObjectFieldSelection',
                name: 'node',
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
                'gql::Record::001RM000004uuhnYAA': {
                    id: '001RM000004uuhnYAA',
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

            const selector: Selector<any> = {
                recordId: 'gql::Record::001RM000004uuhnYAA',
                node: {
                    kind: 'Fragment',
                    reader: true,
                    synthetic: false,
                    read: createRead(ast),
                },
                variables: {},
            };

            const snap = luvio.storeLookup(selector);
            expect(snap.data).toEqual(data);
        });

        it('should select scalar fields properly', () => {
            const ast: LuvioSelectionObjectFieldNode = {
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
            };

            const data = {
                value: 'Account1',
                displayValue: null,
            };

            const store = new Store();
            store.records = {
                'gql::Record::001RM000004uuhnYAA__Name': {
                    value: 'Account1',
                    displayValue: null,
                },
                'gql::Record::001RM000004uuhnYAA': {
                    id: '001RM000004uuhnYAA',
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

            const selector: Selector<any> = {
                recordId: 'gql::Record::001RM000004uuhnYAA__Name',
                node: {
                    kind: 'Fragment',
                    reader: true,
                    synthetic: false,
                    read: createRead(ast),
                },
                variables: {},
            };

            const snap = luvio.storeLookup(selector);
            expect(snap.data).toEqual(data);
        });
    });

    it('should ingest ObjectFieldSelection query correctly', () => {
        const ast: LuvioSelectionObjectFieldNode = {
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
        };

        const data = {
            Account: {
                edges: [
                    {
                        node: {
                            id: '001RM000004uuhnYAA',
                            WeakEtag: 1615493739000,
                            Name: {
                                value: 'Account1',
                                displayValue: null,
                            },
                        },
                    },
                ],
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
                id: '001RM000004uuhnYAA',
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
            toplevel: {
                Account: {
                    __ref: 'gql::Connection::Account(where:{Name:{like:"Account1"}})',
                },
            },
        });
    });

    describe('Merge Tests', () => {
        const fooAst: LuvioSelectionObjectFieldNode = {
            kind: 'ObjectFieldSelection',
            name: 'query',
            luvioSelections: [
                {
                    kind: 'ObjectFieldSelection',
                    name: 'foo',
                    luvioSelections: [
                        {
                            kind: 'ScalarFieldSelection',
                            name: 'field1',
                        },
                        {
                            kind: 'ScalarFieldSelection',
                            name: 'field2',
                        },
                    ],
                },
            ],
        };

        const barAst: LuvioSelectionObjectFieldNode = {
            kind: 'ObjectFieldSelection',
            name: 'query',
            luvioSelections: [
                {
                    kind: 'ObjectFieldSelection',
                    name: 'bar',
                    luvioSelections: [
                        {
                            kind: 'ScalarFieldSelection',
                            name: 'field1',
                        },
                        {
                            kind: 'ScalarFieldSelection',
                            name: 'field2',
                        },
                    ],
                },
            ],
        };

        it('should merge ingest ObjectFieldSelection query correctly', () => {
            const firstData = {
                foo: {
                    field1: 'Field1 - 1',
                    field2: 'Field2 - 1',
                },
            };

            const secondData = {
                bar: {
                    field1: 'Field1 - 2',
                    field2: 'Field2 - 2',
                },
            };

            const store = new Store();
            const luvio = new Luvio(
                new Environment(store, () => {
                    throw new Error('Not used');
                })
            );

            createIngest(fooAst)(
                firstData,
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
                secondData,
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
                toplevel: {
                    foo: {
                        __ref: 'toplevel__foo',
                    },
                    bar: {
                        __ref: 'toplevel__bar',
                    },
                },
                toplevel__foo: {
                    field1: 'Field1 - 1',
                    field2: 'Field2 - 1',
                },
                toplevel__bar: {
                    field1: 'Field1 - 2',
                    field2: 'Field2 - 2',
                },
            });
        });

        it('should overwrite existing ObjectFieldSelection query correctly', () => {
            const firstData = {
                foo: {
                    field1: 'Field1 - 1',
                    field2: 'Field2 - 1',
                },
            };

            const secondData = {
                foo: {
                    field1: 'Field1 - 2',
                    field2: null,
                },
            };

            const store = new Store();
            const luvio = new Luvio(
                new Environment(store, () => {
                    throw new Error('Not used');
                })
            );

            createIngest(fooAst)(
                firstData,
                {
                    parent: null,
                    fullPath: 'toplevel',
                    propertyName: null,
                },
                luvio,
                store,
                0
            );

            createIngest(fooAst)(
                secondData,
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
                toplevel: {
                    foo: {
                        __ref: 'toplevel__foo',
                    },
                },
                toplevel__foo: {
                    field1: 'Field1 - 2',
                    field2: null,
                },
            });
        });
    });
});
