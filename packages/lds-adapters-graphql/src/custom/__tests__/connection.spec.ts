import { Environment, Luvio, Store } from '@luvio/engine';
import { LuvioSelectionCustomFieldNode } from '@salesforce/lds-graphql-parser';
import { createIngest } from '../connection';

describe('GQL Connection', () => {
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

            createIngest(selection)(
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
                'gql::Connection::Account(where:{Name:{like:"Account1"}})': {
                    edges: {
                        __ref: 'gql::Connection::Account(where:{Name:{like:"Account1"}})__edges',
                    },
                },
                'gql::Connection::Account(where:{Name:{like:"Account1"}})__edges': [
                    {
                        __ref: 'gql::Connection::Account(where:{Name:{like:"Account1"}})__edges__0',
                    },
                ],
                'gql::Connection::Account(where:{Name:{like:"Account1"}})__edges__0': {
                    node: {
                        __ref: 'gql::Record::001RM000004uuhnYAA',
                    },
                },
                'gql::Record::001RM000004uuhnYAA': {
                    Id: '001RM000004uuhnYAA',
                    WeakEtag: 1615493739000,
                    Name: {
                        __ref: 'gql::Record::001RM000004uuhnYAA__Name',
                    },
                },
                'gql::Record::001RM000004uuhnYAA__Name': {
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

            createIngest(selection)(
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
                'gql::Connection::Account()': {
                    edges: {
                        __ref: 'gql::Connection::Account()__edges',
                    },
                },
                'gql::Connection::Account()__edges': [
                    {
                        __ref: 'gql::Connection::Account()__edges__0',
                    },
                ],
                'gql::Connection::Account()__edges__0': {
                    node: {
                        __ref: 'gql::Record::001RM000004uuhnYAA',
                    },
                },
                'gql::Record::001RM000004uuhnYAA': {
                    Id: '001RM000004uuhnYAA',
                    WeakEtag: 1615493739000,
                    Name: {
                        __ref: 'gql::Record::001RM000004uuhnYAA__Name',
                    },
                },
                'gql::Record::001RM000004uuhnYAA__Name': {
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

            createIngest(selection)(
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
                'gql::Connection::Account(where:{Name:{like:"Account1"}})': {
                    edges: {
                        __ref: 'gql::Connection::Account(where:{Name:{like:"Account1"}})__edges',
                    },
                },
                'gql::Connection::Account(where:{Name:{like:"Account1"}})__edges': [],
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
                                Id: '005RM000002492xYAA',
                                WeakEtag: 1616602434000,
                                Name: {
                                    value: 'Admin User',
                                },
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

            createIngest(selection)(
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
                'gql::Connection::Account(where:{Name:{like:"Account1"}})': {
                    edges: {
                        __ref: 'gql::Connection::Account(where:{Name:{like:"Account1"}})__edges',
                    },
                },
                'gql::Connection::Account(where:{Name:{like:"Account1"}})__edges': [
                    {
                        __ref: 'gql::Connection::Account(where:{Name:{like:"Account1"}})__edges__0',
                    },
                ],
                'gql::Connection::Account(where:{Name:{like:"Account1"}})__edges__0': {
                    node: {
                        __ref: 'gql::Record::001RM000004uuhnYAA',
                    },
                },
                'gql::Record::001RM000004uuhnYAA': {
                    Id: '001RM000004uuhnYAA',
                    WeakEtag: 1615493739000,
                    Name: {
                        __ref: 'gql::Record::001RM000004uuhnYAA__Name',
                    },
                    Owner: {
                        __ref: 'gql::Record::005RM000002492xYAA',
                    },
                },
                'gql::Record::001RM000004uuhnYAA__Name': {
                    value: 'Account1',
                    displayValue: null,
                },
                'gql::Record::005RM000002492xYAA': {
                    Id: '005RM000002492xYAA',
                    WeakEtag: 1616602434000,
                    Name: {
                        __ref: 'gql::Record::005RM000002492xYAA__Name',
                    },
                },
                'gql::Record::005RM000002492xYAA__Name': {
                    value: 'Admin User',
                },
            });
        });
    });
});
