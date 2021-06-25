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

            const selector: Selector<any> = {
                recordId: 'gql::Record::001RM000004uuhnYAA',
                node: {
                    kind: 'Fragment',
                    reader: true,
                    synthetic: false,
                    read: createRead(ast, {}),
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

            const selector: Selector<any> = {
                recordId: 'gql::Record::001RM000004uuhnYAA__Name',
                node: {
                    kind: 'Fragment',
                    reader: true,
                    synthetic: false,
                    read: createRead(ast, {}),
                },
                variables: {},
            };

            const snap = luvio.storeLookup(selector);
            expect(snap.data).toEqual(data);
        });

        it('should return unfulfilled snapshot if scalar field is missing', () => {
            const ast: LuvioSelectionObjectFieldNode = {
                kind: 'ObjectFieldSelection',
                name: 'root',
                luvioSelections: [
                    {
                        kind: 'ObjectFieldSelection',
                        name: 'parent',
                        luvioSelections: [
                            {
                                kind: 'ScalarFieldSelection',
                                name: 'nonexisted',
                            },
                        ],
                    },
                ],
            };

            const store = new Store();
            store.records = {
                'gql::root': {
                    parent: {
                        __ref: 'gql::root__parent',
                    },
                },
                'gql::root__parent': {
                    leaf: 'I am a scalar',
                },
            };
            const luvio = new Luvio(
                new Environment(store, () => {
                    throw new Error('Not used');
                })
            );

            const selector: Selector<any> = {
                recordId: 'gql::root',
                node: {
                    kind: 'Fragment',
                    reader: true,
                    synthetic: false,
                    read: createRead(ast, {}),
                },
                variables: {},
            };

            const snap = luvio.storeLookup(selector);
            expect(snap.state).toEqual('Unfulfilled');
        });
    });

    describe('Ingest', () => {
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
                                Id: '001RM000004uuhnYAA',
                                WeakEtag: 1615493739000,
                                Name: {
                                    value: 'Account1',
                                    displayValue: null,
                                },
                                __typename: 'Account',
                                ApiName: 'Account',
                                DisplayValue: 'Account1',
                                SystemModstamp: {
                                    value: '2021-03-11T20:15:39.000Z',
                                },
                                LastModifiedById: {
                                    value: '005RM000002492xYAA',
                                },
                                LastModifiedDate: {
                                    value: '2021-03-11T20:15:39.000Z',
                                },
                                RecordTypeId: {
                                    value: '012RM000000E79WYAS',
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

            createIngest(ast, {})(
                data,
                {
                    parent: null,
                    fullPath: 'toplevel',
                    propertyName: null,
                    state: { result: { type: 'success' } },
                },
                luvio,
                store,
                0
            );

            expect(store.records).toEqual({
                'UiApi::RecordRepresentation:001RM000004uuhnYAA': {
                    id: '001RM000004uuhnYAA',
                    childRelationships: {},
                    eTag: '',
                    apiName: 'Account',
                    weakEtag: 1615493739000,
                    fields: {
                        Name: {
                            __ref: 'UiApi::RecordRepresentation:001RM000004uuhnYAA__fields__Name',
                        },
                    },
                    systemModstamp: '2021-03-11T20:15:39.000Z',
                    lastModifiedById: '005RM000002492xYAA',
                    lastModifiedDate: '2021-03-11T20:15:39.000Z',
                    recordTypeId: '012RM000000E79WYAS',
                    recordTypeInfo: null,
                },
                'UiApi::RecordRepresentation:001RM000004uuhnYAA__fields__Name': {
                    value: 'Account1',
                    displayValue: null,
                },
                'gql::Connection::Account(where:{Name:{like:"Account1"}})__edges__0': {
                    node: {
                        __ref: 'UiApi::RecordRepresentation:001RM000004uuhnYAA',
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
                    'Account(where:{Name:{like:"Account1"}})': {
                        __ref: 'gql::Connection::Account(where:{Name:{like:"Account1"}})',
                    },
                },
            });
        });

        it('should ingest null value for ObjectFieldSelection', () => {
            const ast: LuvioSelectionObjectFieldNode = {
                kind: 'ObjectFieldSelection',
                name: 'root',
                luvioSelections: [
                    {
                        kind: 'ObjectFieldSelection',
                        name: 'parent',
                        luvioSelections: [
                            {
                                kind: 'ScalarFieldSelection',
                                name: 'leaf',
                            },
                        ],
                    },
                ],
            };

            const data = {
                parent: null,
            };

            const store = new Store();
            const luvio = new Luvio(
                new Environment(store, () => {
                    throw new Error('Not used');
                })
            );

            createIngest(ast, {})(
                data,
                {
                    parent: null,
                    fullPath: 'toplevel',
                    propertyName: null,
                    state: { result: { type: 'success' } },
                },
                luvio,
                store,
                0
            );

            expect(store.records).toEqual({
                toplevel: {
                    parent: {
                        __ref: 'toplevel__parent',
                    },
                },
                toplevel__parent: null,
            });
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

            createIngest(fooAst, {})(
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

            createIngest(barAst, {})(
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

            createIngest(fooAst, {})(
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

            createIngest(fooAst, {})(
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

        it('should merge ingest ObjectFieldSelection query with aliases correctly', () => {
            const aliasedFooAst: LuvioSelectionObjectFieldNode = {
                kind: 'ObjectFieldSelection',
                name: 'query',
                luvioSelections: [
                    {
                        kind: 'ObjectFieldSelection',
                        name: 'foo',
                        alias: 'foo2',
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

            const firstData = {
                foo: {
                    field1: 'Field1 - 1',
                    field2: 'Field2 - 1',
                },
            };

            const secondData = {
                foo2: {
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

            createIngest(fooAst, {})(
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

            createIngest(aliasedFooAst, {})(
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

    describe('Aliasing Tests', () => {
        it('should ingest ObjectFieldSelection query with aliases correctly', () => {
            const ast: LuvioSelectionObjectFieldNode = {
                kind: 'ObjectFieldSelection',
                name: 'node',
                luvioSelections: [
                    {
                        kind: 'ObjectFieldSelection',
                        name: 'Name',
                        alias: 'MyAccountName',
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
                MyAccountName: {
                    value: 'Account1',
                    displayValue: null,
                },
            };

            const store = new Store();
            const luvio = new Luvio(
                new Environment(store, () => {
                    throw new Error('Not used');
                })
            );

            createIngest(ast, {})(
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
                toplevel__Name: {
                    value: 'Account1',
                    displayValue: null,
                },
                toplevel: {
                    Name: {
                        __ref: 'toplevel__Name',
                    },
                },
            });
        });

        it('should read aliased ObjectFieldSelection properly', () => {
            const ast: LuvioSelectionObjectFieldNode = {
                kind: 'ObjectFieldSelection',
                name: 'node',
                luvioSelections: [
                    {
                        kind: 'ObjectFieldSelection',
                        name: 'Name',
                        alias: 'MyAccountName',
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
                MyAccountName: {
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

            const selector: Selector<any> = {
                recordId: 'gql::Record::001RM000004uuhnYAA',
                node: {
                    kind: 'Fragment',
                    reader: true,
                    synthetic: false,
                    read: createRead(ast, {}),
                },
                variables: {},
            };

            const snap = luvio.storeLookup(selector);
            expect(snap.data).toEqual(data);
        });
    });

    describe('Error Scenarios', () => {
        it('should return unfulfilled when object field in query, scalar value in cache', () => {
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

            const store = new Store();
            store.records = {
                'gql::Record::001RM000004uuhnYAA': {
                    Id: '001RM000004uuhnYAA',
                    WeakEtag: 1615493739000,
                    Name: 'Account1',
                },
            };
            const luvio = new Luvio(
                new Environment(store, () => {
                    throw new Error('Not used');
                })
            );

            const data = {
                Name: undefined,
            };

            const selector: Selector<any> = {
                recordId: 'gql::Record::001RM000004uuhnYAA',
                node: {
                    kind: 'Fragment',
                    reader: true,
                    synthetic: false,
                    read: createRead(ast, {}),
                },
                variables: {},
            };

            const snap = luvio.storeLookup(selector);
            expect(snap.state).toEqual('Unfulfilled');
            expect(snap.data).toEqual(data);
        });

        it('should throw error when scalar field in query, object value in cache', () => {
            const ast: LuvioSelectionObjectFieldNode = {
                kind: 'ObjectFieldSelection',
                name: 'node',
                luvioSelections: [
                    {
                        kind: 'ScalarFieldSelection',
                        name: 'Name',
                    },
                ],
            };

            const expectedErrorMessage =
                'Scalar requested at "Name" but is instead an object at "gql::Record::001RM000004uuhnYAA__Name"';

            const store = new Store();
            store.records = {
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
                    read: createRead(ast, {}),
                },
                variables: {},
            };

            expect(() => {
                luvio.storeLookup(selector);
            }).toThrow(expectedErrorMessage);
        });

        it('should throw error when object field in query, null scalar value in cache', () => {
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

            const store = new Store();
            store.records = {
                'gql::Record::001RM000004uuhnYAA': {
                    Id: '001RM000004uuhnYAA',
                    WeakEtag: 1615493739000,
                    Name: null,
                },
            };
            const luvio = new Luvio(
                new Environment(store, () => {
                    throw new Error('Not used');
                })
            );

            const expectedErrorMessage = 'TODO: Invalid Link State. Link on "Name"';

            const selector: Selector<any> = {
                recordId: 'gql::Record::001RM000004uuhnYAA',
                node: {
                    kind: 'Fragment',
                    reader: true,
                    synthetic: false,
                    read: createRead(ast, {}),
                },
                variables: {},
            };

            expect(() => {
                luvio.storeLookup(selector);
            }).toThrow(expectedErrorMessage);
        });

        it('should throw error when scalar field in query, object null value in cache', () => {
            const ast: LuvioSelectionObjectFieldNode = {
                kind: 'ObjectFieldSelection',
                name: 'node',
                luvioSelections: [
                    {
                        kind: 'ScalarFieldSelection',
                        name: 'Name',
                    },
                ],
            };

            const expectedErrorMessage =
                'Scalar requested at "Name" but is instead an object at "gql::Record::001RM000004uuhnYAA__Name"';

            const store = new Store();
            store.records = {
                'gql::Record::001RM000004uuhnYAA__Name': null,
                'gql::Record::001RM000004uuhnYAA': {
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

            const selector: Selector<any> = {
                recordId: 'gql::Record::001RM000004uuhnYAA',
                node: {
                    kind: 'Fragment',
                    reader: true,
                    synthetic: false,
                    read: createRead(ast, {}),
                },
                variables: {},
            };

            expect(() => {
                luvio.storeLookup(selector);
            }).toThrow(expectedErrorMessage);
        });
    });
});
