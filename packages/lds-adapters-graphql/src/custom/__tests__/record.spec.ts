import { Environment, Luvio, Store } from '@luvio/engine';
import { RecordRepresentation } from '@salesforce/lds-adapters-uiapi';
import { LuvioSelectionCustomFieldNode } from '@salesforce/lds-graphql-parser';
import { GqlRecord, createIngest, convertToRecordRepresentation } from '../record';

describe('GQL Record', () => {
    describe('convertToRecordRepresentation', () => {
        it('should correctly convert to RecordRepresentation', () => {
            const ast: LuvioSelectionCustomFieldNode = {
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

            const gql = {
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
            } as GqlRecord;

            const recordRep: RecordRepresentation = {
                apiName: 'Account',
                childRelationships: {},
                eTag: '',
                id: '001RM000004uuhnYAA',
                weakEtag: 1615493739000,
                fields: {
                    Name: {
                        value: 'Account1',
                        displayValue: null,
                    },
                },
                systemModstamp: '2021-03-11T20:15:39.000Z',
                lastModifiedById: '005RM000002492xYAA',
                lastModifiedDate: '2021-03-11T20:15:39.000Z',
                recordTypeId: '012RM000000E79WYAS',
                recordTypeInfo: null,
            };

            expect(convertToRecordRepresentation(ast, gql)).toEqual(recordRep);
        });

        it('should correctly convert to RecordRepresentation when contains spanning record', () => {
            const ast: LuvioSelectionCustomFieldNode = {
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

            const gql: GqlRecord = {
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
            } as GqlRecord;

            const recordRep: RecordRepresentation = {
                apiName: 'Account',
                childRelationships: {},
                eTag: '',
                id: '001RM000004uuhnYAA',
                weakEtag: 1615493739000,
                fields: {
                    Name: {
                        value: 'Account1',
                        displayValue: null,
                    },
                    Owner: {
                        displayValue: 'Owner',
                        value: {
                            apiName: 'User',
                            childRelationships: {},
                            eTag: '',
                            id: '005RM000002492xYAA',
                            weakEtag: 1616602434000,
                            fields: {
                                Name: {
                                    value: 'Admin User',
                                    displayValue: 'display value',
                                },
                            },
                            systemModstamp: '2021-03-11T20:15:39.000Z',
                            lastModifiedById: '005RM000002492xYAA',
                            lastModifiedDate: '2021-03-11T20:15:39.000Z',
                            recordTypeId: '012RM000000E79WYAS',
                            recordTypeInfo: null,
                        },
                    },
                },
                systemModstamp: '2021-03-11T20:15:39.000Z',
                lastModifiedById: '005RM000002492xYAA',
                lastModifiedDate: '2021-03-11T20:15:39.000Z',
                recordTypeId: '012RM000000E79WYAS',
                recordTypeInfo: null,
            };

            expect(convertToRecordRepresentation(ast, gql)).toEqual(recordRep);
        });
    });

    describe.skip('ingest', () => {
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

            const data: GqlRecord = {
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
    });
});
