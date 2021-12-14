import { Environment, Luvio, Store, UnfulfilledSnapshot } from '@luvio/engine';
import { LuvioSelectionCustomFieldNode } from '@luvio/graphql-parser';
import { createIngest, createRead, keyBuilder, serialize } from '../connection';

describe('GQL Connection', () => {
    describe('read', () => {
        it('should mark missing path in edges array correctly', () => {
            const selection: LuvioSelectionCustomFieldNode = {
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
            };

            const store = new Store();
            store.records = {
                'GraphQL::Connection:Account(where:{Name:{like:"Account1"}})': {
                    edges: {
                        __ref: 'GraphQL::Connection:Account(where:{Name:{like:"Account1"}})__edges',
                    },
                },
                'GraphQL::Connection:Account(where:{Name:{like:"Account1"}})__edges': [
                    {
                        __ref: 'GraphQL::Connection:Account(where:{Name:{like:"Account1"}})__edges__0',
                    },
                ],
            };
            const luvio = new Luvio(
                new Environment(store, () => {
                    throw new Error('Not used');
                })
            );

            const snap = luvio.storeLookup({
                recordId: 'GraphQL::Connection:Account(where:{Name:{like:"Account1"}})',
                node: {
                    kind: 'Fragment',
                    synthetic: false,
                    reader: true,
                    read: createRead(selection, {}),
                },
                variables: {},
            }) as UnfulfilledSnapshot<any, any>;

            expect(snap.missingPaths).toEqual({
                'edges.0': true,
            });
        });

        it('should mark missing path in nodes in edges array', () => {
            const selection: LuvioSelectionCustomFieldNode = {
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
            };

            const store = new Store();
            store.records = {
                'GraphQL::Connection:Account(where:{Name:{like:"Account1"}})': {
                    edges: {
                        __ref: 'GraphQL::Connection:Account(where:{Name:{like:"Account1"}})__edges',
                    },
                },
                'GraphQL::Connection:Account(where:{Name:{like:"Account1"}})__edges': [
                    {
                        __ref: 'GraphQL::Connection:Account(where:{Name:{like:"Account1"}})__edges__0',
                    },
                ],
                'GraphQL::Connection:Account(where:{Name:{like:"Account1"}})__edges__0': {
                    node: {
                        __ref: 'missingRef',
                    },
                },
            };
            const luvio = new Luvio(
                new Environment(store, () => {
                    throw new Error('Not used');
                })
            );

            const snap = luvio.storeLookup({
                recordId: 'GraphQL::Connection:Account(where:{Name:{like:"Account1"}})',
                node: {
                    kind: 'Fragment',
                    synthetic: false,
                    reader: true,
                    read: createRead(selection, {}),
                },
                variables: {},
            }) as UnfulfilledSnapshot<any, any>;

            expect(snap.missingPaths).toEqual({
                'edges.0.node': true,
            });
        });

        it('should read scalars correctly', () => {
            const ast: LuvioSelectionCustomFieldNode = {
                kind: 'CustomFieldSelection',
                name: 'Opportunity',
                type: 'Connection',
                luvioSelections: [
                    {
                        kind: 'ScalarFieldSelection',
                        name: '__typename',
                    },
                    {
                        kind: 'ObjectFieldSelection',
                        name: 'edges',
                        luvioSelections: [
                            {
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
                                            value: 'Opp1',
                                        },
                                    },
                                },
                            },
                        },
                    },
                ],
            };

            const data = {
                __typename: 'OpportunityConnection',
                edges: [
                    {
                        node: {
                            Name: {
                                value: 'Opp1',
                                displayValue: null,
                            },
                        },
                    },
                ],
            };

            const store = new Store();
            store.records = {
                'GraphQL::Connection::Opportunity(where:{Name:{like:"Opp1"}})__edges__0__0__Name': {
                    value: 'Opp1',
                    displayValue: null,
                },
                'GraphQL::Connection::Opportunity(where:{Name:{like:"Opp1"}})__edges__0__0': {
                    Name: {
                        __ref: 'GraphQL::Connection::Opportunity(where:{Name:{like:"Opp1"}})__edges__0__0__Name',
                    },
                },
                'GraphQL::Connection::Opportunity(where:{Name:{like:"Opp1"}})__edges__0': {
                    node: {
                        __ref: 'GraphQL::Connection::Opportunity(where:{Name:{like:"Opp1"}})__edges__0__0',
                    },
                },
                'GraphQL::Connection::Opportunity(where:{Name:{like:"Opp1"}})__edges': [
                    {
                        __ref: 'GraphQL::Connection::Opportunity(where:{Name:{like:"Opp1"}})__edges__0',
                    },
                ],
                'GraphQL::Connection::Opportunity(where:{Name:{like:"Opp1"}})': {
                    __typename: 'OpportunityConnection',
                    edges: {
                        __ref: 'GraphQL::Connection::Opportunity(where:{Name:{like:"Opp1"}})__edges',
                    },
                },
            };

            const luvio = new Luvio(
                new Environment(store, () => {
                    throw new Error('Not used');
                })
            );

            const snap = luvio.storeLookup({
                recordId: 'GraphQL::Connection::Opportunity(where:{Name:{like:"Opp1"}})',
                node: {
                    kind: 'Fragment',
                    synthetic: false,
                    reader: true,
                    read: createRead(ast, {}),
                },
                variables: {},
            });
            expect(snap.data).toEqual(data);
        });
    });
    describe('ingest', () => {
        it('should ingest connection correctly', () => {
            const selection: LuvioSelectionCustomFieldNode = {
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
            };

            const data = {
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
            };

            const store = new Store();
            const luvio = new Luvio(
                new Environment(store, () => {
                    throw new Error('Not used');
                })
            );

            createIngest(selection, keyBuilder(selection, {}), {})(
                data,
                {
                    parent: null,
                    propertyName: null,
                    fullPath: '',
                },
                luvio,
                store,
                0
            );

            expect(store.records).toEqual({
                'GraphQL::Connection:Account(where:{Name:{like:"Account1"}})': {
                    edges: {
                        __ref: 'GraphQL::Connection:Account(where:{Name:{like:"Account1"}})__edges',
                    },
                },
                'GraphQL::Connection:Account(where:{Name:{like:"Account1"}})__edges': [
                    {
                        __ref: 'GraphQL::Connection:Account(where:{Name:{like:"Account1"}})__edges__0',
                    },
                ],
                'GraphQL::Connection:Account(where:{Name:{like:"Account1"}})__edges__0': {
                    node: {
                        __ref: 'UiApi::RecordRepresentation:001RM000004uuhnYAA',
                    },
                },
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
            });
        });

        it('should ingest connection correctly when there are no arguments', () => {
            const selection: LuvioSelectionCustomFieldNode = {
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
                arguments: [],
            };

            const data = {
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
            };

            const store = new Store();
            const luvio = new Luvio(
                new Environment(store, () => {
                    throw new Error('Not used');
                })
            );

            createIngest(selection, keyBuilder(selection, {}), {})(
                data,
                {
                    parent: null,
                    propertyName: null,
                    fullPath: '',
                },
                luvio,
                store,
                0
            );

            expect(store.records).toEqual({
                'GraphQL::Connection:Account()': {
                    edges: {
                        __ref: 'GraphQL::Connection:Account()__edges',
                    },
                },
                'GraphQL::Connection:Account()__edges': [
                    {
                        __ref: 'GraphQL::Connection:Account()__edges__0',
                    },
                ],
                'GraphQL::Connection:Account()__edges__0': {
                    node: {
                        __ref: 'UiApi::RecordRepresentation:001RM000004uuhnYAA',
                    },
                },
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
            });
        });

        it('should ingest empty connection correctly', () => {
            const selection: LuvioSelectionCustomFieldNode = {
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
            };

            const data = {
                edges: [],
            };

            const store = new Store();
            const luvio = new Luvio(
                new Environment(store, () => {
                    throw new Error('Not used');
                })
            );

            createIngest(selection, keyBuilder(selection, {}), {})(
                data,
                {
                    parent: null,
                    propertyName: null,
                    fullPath: '',
                },
                luvio,
                store,
                0
            );

            expect(store.records).toEqual({
                'GraphQL::Connection:Account(where:{Name:{like:"Account1"}})': {
                    edges: {
                        __ref: 'GraphQL::Connection:Account(where:{Name:{like:"Account1"}})__edges',
                    },
                },
                'GraphQL::Connection:Account(where:{Name:{like:"Account1"}})__edges': [],
            });
        });

        it('should ingest connections with nested records correctly', () => {
            const selection: LuvioSelectionCustomFieldNode = {
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
                                    {
                                        kind: 'CustomFieldSelection',
                                        name: 'Owner',
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
                                                ],
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
            };

            const data = {
                edges: [
                    {
                        node: {
                            Id: '001RM000004uuhnYAA',
                            WeakEtag: 1615493739000,
                            Name: {
                                value: 'Account1',
                                displayValue: null,
                            },
                            Owner: {
                                ApiName: 'User',
                                Id: '005RM000002492xYAA',
                                WeakEtag: 1616602434000,
                                DisplayValue: 'Owner',
                                Name: {
                                    value: 'Admin User',
                                    displayValue: 'display value',
                                },
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
            };

            const store = new Store();
            const luvio = new Luvio(
                new Environment(store, () => {
                    throw new Error('Not used');
                })
            );

            createIngest(selection, keyBuilder(selection, {}), {})(
                data,
                {
                    parent: null,
                    propertyName: null,
                    fullPath: '',
                },
                luvio,
                store,
                0
            );

            expect(store.records).toEqual({
                'GraphQL::Connection:Account(where:{Name:{like:"Account1"}})': {
                    edges: {
                        __ref: 'GraphQL::Connection:Account(where:{Name:{like:"Account1"}})__edges',
                    },
                },
                'GraphQL::Connection:Account(where:{Name:{like:"Account1"}})__edges': [
                    {
                        __ref: 'GraphQL::Connection:Account(where:{Name:{like:"Account1"}})__edges__0',
                    },
                ],
                'GraphQL::Connection:Account(where:{Name:{like:"Account1"}})__edges__0': {
                    node: {
                        __ref: 'UiApi::RecordRepresentation:001RM000004uuhnYAA',
                    },
                },
                'UiApi::RecordRepresentation:001RM000004uuhnYAA': {
                    apiName: 'Account',
                    id: '001RM000004uuhnYAA',
                    childRelationships: {},
                    eTag: '',
                    weakEtag: 1615493739000,
                    fields: {
                        Name: {
                            __ref: 'UiApi::RecordRepresentation:001RM000004uuhnYAA__fields__Name',
                        },
                        Owner: {
                            __ref: 'UiApi::RecordRepresentation:001RM000004uuhnYAA__fields__Owner',
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
                'UiApi::RecordRepresentation:001RM000004uuhnYAA__fields__Owner': {
                    displayValue: 'Owner',
                    value: {
                        __ref: 'UiApi::RecordRepresentation:005RM000002492xYAA',
                    },
                },
                'UiApi::RecordRepresentation:005RM000002492xYAA': {
                    apiName: 'User',
                    id: '005RM000002492xYAA',
                    weakEtag: 1616602434000,
                    eTag: '',
                    childRelationships: {},
                    fields: {
                        Name: {
                            __ref: 'UiApi::RecordRepresentation:005RM000002492xYAA__fields__Name',
                        },
                    },
                    systemModstamp: '2021-03-11T20:15:39.000Z',
                    lastModifiedById: '005RM000002492xYAA',
                    lastModifiedDate: '2021-03-11T20:15:39.000Z',
                    recordTypeId: '012RM000000E79WYAS',
                    recordTypeInfo: null,
                },
                'UiApi::RecordRepresentation:005RM000002492xYAA__fields__Name': {
                    value: 'Admin User',
                    displayValue: 'display value',
                },
            });
        });

        it('should ingest connection with scalars correctly', () => {
            const ast: LuvioSelectionCustomFieldNode = {
                kind: 'CustomFieldSelection',
                name: 'Opportunity',
                type: 'Connection',
                luvioSelections: [
                    {
                        kind: 'ScalarFieldSelection',
                        name: '__typename',
                    },
                    {
                        kind: 'ObjectFieldSelection',
                        name: 'edges',
                        luvioSelections: [
                            {
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
                                            value: 'Opp1',
                                        },
                                    },
                                },
                            },
                        },
                    },
                ],
            };

            const data = {
                __typename: 'OpportunityConnection',
                edges: [
                    {
                        node: {
                            Name: {
                                value: 'Opp1',
                                displayValue: null,
                            },
                        },
                    },
                ],
            };

            const store = new Store();
            const luvio = new Luvio(
                new Environment(store, () => {
                    throw new Error('Not used');
                })
            );

            createIngest(ast, 'GraphQL::Connection::Opportunity(where:{Name:{like:"Opp1"}})', {})(
                data,
                {
                    parent: null,
                    propertyName: null,
                    fullPath: '',
                },
                luvio,
                store,
                0
            );

            expect(store.records).toEqual({
                'GraphQL::Connection::Opportunity(where:{Name:{like:"Opp1"}})__edges__0__node__Name':
                    {
                        value: 'Opp1',
                        displayValue: null,
                    },
                'GraphQL::Connection::Opportunity(where:{Name:{like:"Opp1"}})__edges__0__node': {
                    Name: {
                        __ref: 'GraphQL::Connection::Opportunity(where:{Name:{like:"Opp1"}})__edges__0__node__Name',
                    },
                },
                'GraphQL::Connection::Opportunity(where:{Name:{like:"Opp1"}})__edges__0': {
                    node: {
                        __ref: 'GraphQL::Connection::Opportunity(where:{Name:{like:"Opp1"}})__edges__0__node',
                    },
                },
                'GraphQL::Connection::Opportunity(where:{Name:{like:"Opp1"}})__edges': [
                    {
                        __ref: 'GraphQL::Connection::Opportunity(where:{Name:{like:"Opp1"}})__edges__0',
                    },
                ],
                'GraphQL::Connection::Opportunity(where:{Name:{like:"Opp1"}})': {
                    __typename: 'OpportunityConnection',
                    edges: {
                        __ref: 'GraphQL::Connection::Opportunity(where:{Name:{like:"Opp1"}})__edges',
                    },
                },
            });
        });

        it('should not ingest connection data with no changes', () => {
            const selection: LuvioSelectionCustomFieldNode = {
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
            };

            const data = {
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
            };

            const store = new Store();
            const luvio = new Luvio(
                new Environment(store, () => {
                    throw new Error('Not used');
                })
            );

            createIngest(selection, keyBuilder(selection, {}), {})(
                JSON.parse(JSON.stringify(data)),
                {
                    parent: null,
                    propertyName: null,
                    fullPath: '',
                },
                luvio,
                store,
                0
            );

            luvio.storeBroadcast();
            jest.spyOn(luvio, 'storePublish');

            createIngest(selection, keyBuilder(selection, {}), {})(
                data,
                {
                    parent: null,
                    propertyName: null,
                    fullPath: '',
                },
                luvio,
                store,
                0
            );

            expect(luvio.storePublish).not.toHaveBeenCalled();
        });
    });
    describe('serialize', () => {
        // Fields = {edges.cursor, totalCount, pageInfo.hasNextPage, pageInfo.hasPreviousPage}
        it('should insert the fields when not specified in the input query', () => {
            const ast: LuvioSelectionCustomFieldNode = {
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
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            };

            const state = {
                fragments: {},
            };

            const result = serialize(ast, state);
            expect(result).toEqual(
                'Account { __typename edges { __typename node { Name { __typename value, displayValue,  } ...defaultRecordFields } cursor } pageInfo { hasNextPage hasPreviousPage } totalCount }'
            );
        });

        it('should not insert the fields when specified in the input query', () => {
            const ast: LuvioSelectionCustomFieldNode = {
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
                                        ],
                                    },
                                ],
                            },
                            {
                                kind: 'ScalarFieldSelection',
                                name: 'cursor',
                            },
                        ],
                    },
                    {
                        kind: 'ScalarFieldSelection',
                        name: 'totalCount',
                    },
                    {
                        kind: 'ObjectFieldSelection',
                        name: 'pageInfo',
                        luvioSelections: [
                            {
                                kind: 'ScalarFieldSelection',
                                name: 'hasNextPage',
                            },
                            {
                                kind: 'ScalarFieldSelection',
                                name: 'hasPreviousPage',
                            },
                        ],
                    },
                ],
            };

            const state = {
                fragments: {},
            };

            const result = serialize(ast, state);
            expect(result).toEqual(
                'Account { __typename edges { __typename node { Name { __typename value, displayValue,  } ...defaultRecordFields } cursor,  } totalCount,  pageInfo { hasNextPage,  hasPreviousPage,  } }'
            );
        });

        it('should add hasNextPage and hasPreviousPage in pageInfo when not specified', () => {
            const ast: LuvioSelectionCustomFieldNode = {
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
                                        ],
                                    },
                                ],
                            },
                            {
                                kind: 'ScalarFieldSelection',
                                name: 'cursor',
                            },
                        ],
                    },
                    {
                        kind: 'ScalarFieldSelection',
                        name: 'totalCount',
                    },
                    {
                        kind: 'ObjectFieldSelection',
                        name: 'pageInfo',
                        luvioSelections: [
                            {
                                kind: 'ScalarFieldSelection',
                                name: 'startCursor',
                            },
                        ],
                    },
                ],
            };

            const state = {
                fragments: {},
            };

            const result = serialize(ast, state);
            expect(result).toEqual(
                'Account { __typename edges { __typename node { Name { __typename value, displayValue,  } ...defaultRecordFields } cursor,  } totalCount,  pageInfo { startCursor,  hasNextPage hasPreviousPage } }'
            );
        });
    });
});
