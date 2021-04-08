import { Environment, Luvio, Store } from '@luvio/engine';
import { LuvioSelectionCustomFieldNode } from '@salesforce/lds-graphql-parser';
import { GqlRecord, createIngest } from '../record';

describe('GQL Record', () => {
    describe('ingest', () => {
        it('should ingest flat records correctly', () => {
            const selection: LuvioSelectionCustomFieldNode = {
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
            };

            const data = {
                id: '001RM000004uuhnYAA',
                WeakEtag: 1615493739000,
                Name: {
                    value: 'Account1',
                    displayValue: null,
                },
            } as GqlRecord;

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
                'gql::Record::001RM000004uuhnYAA': {
                    id: '001RM000004uuhnYAA',
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

        it('should ingest spanning records correctly', () => {
            const selection: LuvioSelectionCustomFieldNode = {
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
            };

            const data = {
                id: '001RM000004uuhnYAA',
                WeakEtag: 1615493739000,
                Name: {
                    value: 'Account1',
                    displayValue: null,
                },
                Owner: {
                    id: '005RM000002492xYAA',
                    WeakEtag: 1616602434000,
                    Name: {
                        value: 'Admin User',
                    },
                },
            } as GqlRecord;

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
                'gql::Record::001RM000004uuhnYAA': {
                    id: '001RM000004uuhnYAA',
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
                    id: '005RM000002492xYAA',
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
