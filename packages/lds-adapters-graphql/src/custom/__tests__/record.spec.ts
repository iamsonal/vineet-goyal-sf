import { Environment, FulfilledSnapshot, Luvio, Store } from '@luvio/engine';
import { RecordRepresentation } from '@salesforce/lds-adapters-uiapi';
import { LuvioSelectionCustomFieldNode } from '@luvio/graphql-parser';
import { GqlRecord, createIngest, convertToRecordRepresentation, createRead } from '../record';

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

            const gqlRecord: GqlRecord = {
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
            };

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

            const result = convertToRecordRepresentation(ast, gqlRecord);
            expect(result).toEqual({
                recordRepresentation: recordRep,
                childRelationships: {},
                fieldsTrie: {
                    name: 'Account',
                    children: {
                        Name: {
                            name: 'Name',
                            children: {},
                        },
                    },
                },
            });
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

            const gqlRecord: GqlRecord = {
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
            };

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

            const result = convertToRecordRepresentation(ast, gqlRecord);
            expect(result).toEqual({
                childRelationships: {},
                recordRepresentation: recordRep,
                fieldsTrie: {
                    name: 'Account',
                    children: {
                        Name: {
                            name: 'Name',
                            children: {},
                        },
                        Owner: {
                            name: 'User',
                            children: {
                                Name: {
                                    name: 'Name',
                                    children: {},
                                },
                            },
                        },
                    },
                },
            });
        });

        it('should correctly convert to RecordRepresentation when contains null spanning record', () => {
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

            const gqlRecord: GqlRecord = {
                Id: '001RM000004uuhnYAA',
                WeakEtag: 1615493739000,
                Name: {
                    value: 'Account1',
                    displayValue: null,
                },
                Owner: null,
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
            };

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
                        value: null,
                        displayValue: null,
                    },
                },
                systemModstamp: '2021-03-11T20:15:39.000Z',
                lastModifiedById: '005RM000002492xYAA',
                lastModifiedDate: '2021-03-11T20:15:39.000Z',
                recordTypeId: '012RM000000E79WYAS',
                recordTypeInfo: null,
            };

            const result = convertToRecordRepresentation(ast, gqlRecord);
            expect(result).toEqual({
                childRelationships: {},
                recordRepresentation: recordRep,
                fieldsTrie: {
                    name: 'Account',
                    children: {
                        Name: {
                            name: 'Name',
                            children: {},
                        },
                        Owner: {
                            name: 'Owner',
                            children: {
                                Name: {
                                    name: 'Name',
                                    children: {},
                                },
                            },
                        },
                    },
                },
            });
        });

        it('should correctly convert to RecordRepresentation when contains null spanning record with multiple levels of children', () => {
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
                            {
                                kind: 'CustomFieldSelection',
                                name: 'Boss',
                                type: 'Record',
                                luvioSelections: [
                                    {
                                        kind: 'ObjectFieldSelection',
                                        name: 'BossName',
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

            const gqlRecord: GqlRecord = {
                Id: '001RM000004uuhnYAA',
                WeakEtag: 1615493739000,
                Name: {
                    value: 'Account1',
                    displayValue: null,
                },
                Owner: null,
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
            };

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
                        value: null,
                        displayValue: null,
                    },
                },
                systemModstamp: '2021-03-11T20:15:39.000Z',
                lastModifiedById: '005RM000002492xYAA',
                lastModifiedDate: '2021-03-11T20:15:39.000Z',
                recordTypeId: '012RM000000E79WYAS',
                recordTypeInfo: null,
            };

            const result = convertToRecordRepresentation(ast, gqlRecord);
            expect(result).toEqual({
                childRelationships: {},
                recordRepresentation: recordRep,
                fieldsTrie: {
                    name: 'Account',
                    children: {
                        Name: {
                            name: 'Name',
                            children: {},
                        },
                        Owner: {
                            name: 'Owner',
                            children: {
                                Name: {
                                    name: 'Name',
                                    children: {},
                                },
                                Boss: {
                                    name: 'Boss',
                                    children: {
                                        BossName: {
                                            name: 'BossName',
                                            children: {},
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });
        });

        it('should correctly convert to RecordRepresentation when containing aliases', () => {
            const ast: LuvioSelectionCustomFieldNode = {
                kind: 'CustomFieldSelection',
                name: 'node',
                type: 'Record',
                luvioSelections: [
                    {
                        kind: 'ObjectFieldSelection',
                        name: 'Name',
                        alias: 'MyName',
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
                        alias: 'MyOwner',
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

            const gqlRecord: GqlRecord = {
                Id: '001RM000004uuhnYAA',
                WeakEtag: 1615493739000,
                MyName: {
                    value: 'Account1',
                    displayValue: null,
                },
                MyOwner: {
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
            };

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

            const result = convertToRecordRepresentation(ast, gqlRecord);
            expect(result).toEqual({
                childRelationships: {},
                recordRepresentation: recordRep,
                fieldsTrie: {
                    name: 'Account',
                    children: {
                        Name: {
                            name: 'Name',
                            children: {},
                        },
                        Owner: {
                            name: 'User',
                            children: {
                                Name: {
                                    name: 'Name',
                                    children: {},
                                },
                            },
                        },
                    },
                },
            });
        });
    });

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
            };

            const store = new Store();
            const luvio = new Luvio(
                new Environment(store, () => {
                    throw new Error('Not used');
                })
            );

            createIngest(selection, {})(
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

            const gqlRecord: GqlRecord = {
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
            };

            const store = new Store();
            const luvio = new Luvio(
                new Environment(store, () => {
                    throw new Error('Not used');
                })
            );

            createIngest(selection, {})(
                gqlRecord,
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

        it('should ingest null spanning records correctly', () => {
            const ast: LuvioSelectionCustomFieldNode = {
                kind: 'CustomFieldSelection',
                name: 'node',
                type: 'Record',
                luvioSelections: [
                    {
                        kind: 'CustomFieldSelection',
                        name: 'Parent',
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

            const gqlRecord: GqlRecord = {
                Parent: null,
                __typename: 'Account',
                ApiName: 'Account',
                WeakEtag: 1619829082000,
                Id: '001RM000005BJPTYA4',
                DisplayValue: 'Add One More Account',
                SystemModstamp: {
                    value: '2021-05-01T00:31:22.000Z',
                },
                LastModifiedById: {
                    value: '005RM000002492xYAA',
                },
                LastModifiedDate: {
                    value: '2021-05-01T00:31:22.000Z',
                },
                RecordTypeId: {
                    value: '012RM000000E79WYAS',
                },
            };

            const store = new Store();
            const luvio = new Luvio(
                new Environment(store, () => {
                    throw new Error('Not used');
                })
            );

            createIngest(ast, {})(
                gqlRecord,
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
                'UiApi::RecordRepresentation:001RM000005BJPTYA4': {
                    eTag: '',
                    apiName: 'Account',
                    childRelationships: {},
                    weakEtag: 1619829082000,
                    id: '001RM000005BJPTYA4',
                    fields: {
                        Parent: {
                            __ref: 'UiApi::RecordRepresentation:001RM000005BJPTYA4__fields__Parent',
                            data: {
                                fields: ['Name'],
                            },
                        },
                    },
                    systemModstamp: '2021-05-01T00:31:22.000Z',
                    lastModifiedById: '005RM000002492xYAA',
                    lastModifiedDate: '2021-05-01T00:31:22.000Z',
                    recordTypeId: '012RM000000E79WYAS',
                    recordTypeInfo: null,
                },
                'UiApi::RecordRepresentation:001RM000005BJPTYA4__fields__Parent': {
                    displayValue: null,
                    value: null,
                },
            });
        });

        it('should correctly ingest child relationships', () => {
            const selection: LuvioSelectionCustomFieldNode = {
                kind: 'CustomFieldSelection',
                name: 'node',
                type: 'Record',
                luvioSelections: [
                    {
                        kind: 'CustomFieldSelection',
                        name: 'Child',
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
                                                kind: 'ScalarFieldSelection',
                                                name: 'Id',
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
                Id: '001RM000004uuhnYAA',
                WeakEtag: 1615493739000,
                Child: {
                    edges: [
                        {
                            node: {
                                ApiName: 'Partner',
                                __typename: 'Partner',
                                WeakEtag: 1610066170000,
                                Id: 'id',
                                DisplayValue: null,
                                SystemModstamp: {
                                    value: '2021-01-08T00:36:10.000Z',
                                },
                                LastModifiedById: {
                                    value: '005RM000002492xYAA',
                                },
                                LastModifiedDate: {
                                    value: '2021-01-08T00:36:10.000Z',
                                },
                                RecordTypeId: {
                                    value: null,
                                },
                            },
                        },
                    ],
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
            };

            const store = new Store();
            const luvio = new Luvio(
                new Environment(store, () => {
                    throw new Error('Not used');
                })
            );

            createIngest(selection, {})(
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
                    eTag: '',
                    lastModifiedById: '005RM000002492xYAA',
                    lastModifiedDate: '2021-03-11T20:15:39.000Z',
                    systemModstamp: '2021-03-11T20:15:39.000Z',
                    recordTypeId: '012RM000000E79WYAS',
                    recordTypeInfo: null,
                    childRelationships: {},
                    id: '001RM000004uuhnYAA',
                    weakEtag: 1615493739000,
                    fields: {},
                },
                'UiApi::RecordRepresentation:id': {
                    apiName: 'Partner',
                    eTag: '',
                    lastModifiedById: '005RM000002492xYAA',
                    lastModifiedDate: '2021-01-08T00:36:10.000Z',
                    systemModstamp: '2021-01-08T00:36:10.000Z',
                    recordTypeId: null,
                    recordTypeInfo: null,
                    childRelationships: {},
                    id: 'id',
                    weakEtag: 1610066170000,
                    fields: {},
                },
                'UiApi::RecordRepresentation:001RM000004uuhnYAA__childRelationships__Child__edges__0':
                    {
                        node: {
                            __ref: 'UiApi::RecordRepresentation:id',
                        },
                    },
                'UiApi::RecordRepresentation:001RM000004uuhnYAA__childRelationships__Child__edges':
                    [
                        {
                            __ref: 'UiApi::RecordRepresentation:001RM000004uuhnYAA__childRelationships__Child__edges__0',
                        },
                    ],
                'UiApi::RecordRepresentation:001RM000004uuhnYAA__childRelationships__Child': {
                    edges: {
                        __ref: 'UiApi::RecordRepresentation:001RM000004uuhnYAA__childRelationships__Child__edges',
                    },
                },
            });
        });
    });

    describe('read', () => {
        it('should denormalize RecordRepresentation correctly', () => {
            const store = new Store();
            store.records = {
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
            };
            const luvio = new Luvio(
                new Environment(store, () => {
                    throw new Error('Not used');
                })
            );

            const selection: LuvioSelectionCustomFieldNode = {
                kind: 'CustomFieldSelection',
                name: 'node',
                type: 'Record',
                luvioSelections: [
                    {
                        kind: 'ScalarFieldSelection',
                        name: 'Id',
                    },
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

            const expected = {
                Id: '001RM000004uuhnYAA',
                Name: {
                    value: 'Account1',
                    displayValue: null,
                },
            };

            const snap = luvio.storeLookup({
                recordId: 'UiApi::RecordRepresentation:001RM000004uuhnYAA',
                node: {
                    kind: 'Fragment',
                    synthetic: false,
                    reader: true,
                    read: createRead(selection, {}),
                },
                variables: {},
            });
            expect(snap.data).toEqual(expected);
        });

        it('should denormalize spanning RecordRepresentation correctly', () => {
            const selection: LuvioSelectionCustomFieldNode = {
                kind: 'CustomFieldSelection',
                name: 'node',
                type: 'Record',
                luvioSelections: [
                    {
                        kind: 'ScalarFieldSelection',
                        name: 'Id',
                    },
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
                                kind: 'ScalarFieldSelection',
                                name: 'Id',
                            },
                            {
                                kind: 'ScalarFieldSelection',
                                name: 'ApiName',
                            },
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

            const store = new Store();
            store.records = {
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
            };
            const luvio = new Luvio(
                new Environment(store, () => {
                    throw new Error('Not used');
                })
            );

            const expected = {
                Id: '001RM000004uuhnYAA',
                Name: {
                    value: 'Account1',
                    displayValue: null,
                },
                Owner: {
                    ApiName: 'User',
                    Id: '005RM000002492xYAA',
                    Name: {
                        value: 'Admin User',
                    },
                },
            };

            const snap = luvio.storeLookup({
                recordId: 'UiApi::RecordRepresentation:001RM000004uuhnYAA',
                node: {
                    kind: 'Fragment',
                    synthetic: false,
                    reader: true,
                    read: createRead(selection, {}),
                },
                variables: {},
            });
            expect(snap.data).toEqual(expected);
        });

        it('should denormalize DisplayValue from spanning RecordRepresentation correctly', () => {
            const selection: LuvioSelectionCustomFieldNode = {
                kind: 'CustomFieldSelection',
                name: 'node',
                type: 'Record',
                luvioSelections: [
                    {
                        kind: 'ScalarFieldSelection',
                        name: 'Id',
                    },
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
                                kind: 'ScalarFieldSelection',
                                name: 'Id',
                            },
                            {
                                kind: 'ScalarFieldSelection',
                                name: 'DisplayValue',
                            },
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

            const store = new Store();
            store.records = {
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
            };
            const luvio = new Luvio(
                new Environment(store, () => {
                    throw new Error('Not used');
                })
            );

            const expected = {
                Id: '001RM000004uuhnYAA',
                Name: {
                    value: 'Account1',
                    displayValue: null,
                },
                Owner: {
                    DisplayValue: 'Owner',
                    Id: '005RM000002492xYAA',
                    Name: {
                        value: 'Admin User',
                    },
                },
            };

            const snap = luvio.storeLookup({
                recordId: 'UiApi::RecordRepresentation:001RM000004uuhnYAA',
                node: {
                    kind: 'Fragment',
                    synthetic: false,
                    reader: true,
                    read: createRead(selection, {}),
                },
                variables: {},
            });
            expect(snap.data).toEqual(expected);
        });

        it('should denormalize RecordRepresentation correctly when containing aliases', () => {
            const selection: LuvioSelectionCustomFieldNode = {
                kind: 'CustomFieldSelection',
                name: 'node',
                type: 'Record',
                luvioSelections: [
                    {
                        kind: 'ScalarFieldSelection',
                        name: 'Id',
                        alias: 'MyId',
                    },
                    {
                        kind: 'ObjectFieldSelection',
                        name: 'Name',
                        alias: 'MyName',
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
                        alias: 'MyOwner',
                        luvioSelections: [
                            {
                                kind: 'ScalarFieldSelection',
                                name: 'Id',
                            },
                            {
                                kind: 'ScalarFieldSelection',
                                name: 'ApiName',
                            },
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

            const store = new Store();
            store.records = {
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
            };
            const luvio = new Luvio(
                new Environment(store, () => {
                    throw new Error('Not used');
                })
            );

            const expected = {
                MyId: '001RM000004uuhnYAA',
                MyName: {
                    value: 'Account1',
                    displayValue: null,
                },
                MyOwner: {
                    ApiName: 'User',
                    Id: '005RM000002492xYAA',
                    Name: {
                        value: 'Admin User',
                    },
                },
            };

            const snap = luvio.storeLookup({
                recordId: 'UiApi::RecordRepresentation:001RM000004uuhnYAA',
                node: {
                    kind: 'Fragment',
                    synthetic: false,
                    reader: true,
                    read: createRead(selection, {}),
                },
                variables: {},
            });
            expect(snap.data).toEqual(expected);
        });

        it('should denormalize null spanning fields correctly', () => {
            const selection: LuvioSelectionCustomFieldNode = {
                kind: 'CustomFieldSelection',
                name: 'node',
                type: 'Record',
                luvioSelections: [
                    {
                        kind: 'ScalarFieldSelection',
                        name: 'Id',
                    },
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
                                kind: 'ScalarFieldSelection',
                                name: 'Id',
                            },
                            {
                                kind: 'ScalarFieldSelection',
                                name: 'ApiName',
                            },
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

            const store = new Store();
            store.records = {
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
                    displayValue: null,
                    value: null,
                },
            };
            const luvio = new Luvio(
                new Environment(store, () => {
                    throw new Error('Not used');
                })
            );

            const expected = {
                Id: '001RM000004uuhnYAA',
                Name: {
                    value: 'Account1',
                    displayValue: null,
                },
                Owner: null,
            };

            const snap = luvio.storeLookup({
                recordId: 'UiApi::RecordRepresentation:001RM000004uuhnYAA',
                node: {
                    kind: 'Fragment',
                    synthetic: false,
                    reader: true,
                    read: createRead(selection, {}),
                },
                variables: {},
            });
            expect(snap.data).toEqual(expected);
        });

        it('should denormalize null spanning fields correctly when containing aliases', () => {
            const selection: LuvioSelectionCustomFieldNode = {
                kind: 'CustomFieldSelection',
                name: 'node',
                type: 'Record',
                luvioSelections: [
                    {
                        kind: 'CustomFieldSelection',
                        name: 'Owner',
                        type: 'Record',
                        alias: 'MyOwner',
                        luvioSelections: [
                            {
                                kind: 'ScalarFieldSelection',
                                name: 'Id',
                            },
                            {
                                kind: 'ScalarFieldSelection',
                                name: 'ApiName',
                            },
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

            const store = new Store();
            store.records = {
                'UiApi::RecordRepresentation:001RM000004uuhnYAA': {
                    childRelationships: {},
                    eTag: '',
                    weakEtag: 1615493739000,
                    fields: {
                        Owner: {
                            __ref: 'UiApi::RecordRepresentation:001RM000004uuhnYAA__fields__Owner',
                        },
                    },
                },
                'UiApi::RecordRepresentation:001RM000004uuhnYAA__fields__Owner': {
                    displayValue: null,
                    value: 'null',
                },
            };
            const luvio = new Luvio(
                new Environment(store, () => {
                    throw new Error('Not used');
                })
            );

            const expected = {
                MyOwner: null,
            };

            const snap = luvio.storeLookup({
                recordId: 'UiApi::RecordRepresentation:001RM000004uuhnYAA',
                node: {
                    kind: 'Fragment',
                    synthetic: false,
                    reader: true,
                    read: createRead(selection, {}),
                },
                variables: {},
            });
            expect(snap.data).toEqual(expected);
        });

        it('should denormalize non-object spanning fields correctly when containing aliases', () => {
            const selection: LuvioSelectionCustomFieldNode = {
                kind: 'CustomFieldSelection',
                name: 'node',
                type: 'Record',
                luvioSelections: [
                    {
                        kind: 'CustomFieldSelection',
                        name: 'Owner',
                        type: 'Record',
                        alias: 'MyOwner',
                        luvioSelections: [
                            {
                                kind: 'ScalarFieldSelection',
                                name: 'Id',
                            },
                            {
                                kind: 'ScalarFieldSelection',
                                name: 'ApiName',
                            },
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

            const store = new Store();
            store.records = {
                'UiApi::RecordRepresentation:001RM000004uuhnYAA': {
                    childRelationships: {},
                    eTag: '',
                    weakEtag: 1615493739000,
                    fields: {
                        Owner: {
                            __ref: 'UiApi::RecordRepresentation:001RM000004uuhnYAA__fields__Owner',
                        },
                    },
                },
                'UiApi::RecordRepresentation:001RM000004uuhnYAA__fields__Owner': {
                    displayValue: null,
                    value: 'Admin User',
                },
            };
            const luvio = new Luvio(
                new Environment(store, () => {
                    throw new Error('Not used');
                })
            );

            const expected = {
                MyOwner: null,
            };

            const snap = luvio.storeLookup({
                recordId: 'UiApi::RecordRepresentation:001RM000004uuhnYAA',
                node: {
                    kind: 'Fragment',
                    synthetic: false,
                    reader: true,
                    read: createRead(selection, {}),
                },
                variables: {},
            });
            expect(snap.data).toEqual(expected);
        });

        it('should mark all seen ids properly', () => {
            const store = new Store();
            store.records = {
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
            };
            const luvio = new Luvio(
                new Environment(store, () => {
                    throw new Error('Not used');
                })
            );

            const selection: LuvioSelectionCustomFieldNode = {
                kind: 'CustomFieldSelection',
                name: 'node',
                type: 'Record',
                luvioSelections: [
                    {
                        kind: 'ScalarFieldSelection',
                        name: 'Id',
                    },
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

            const snap = luvio.storeLookup({
                recordId: 'UiApi::RecordRepresentation:001RM000004uuhnYAA',
                node: {
                    kind: 'Fragment',
                    synthetic: false,
                    reader: true,
                    read: createRead(selection, {}),
                },
                variables: {},
            }) as FulfilledSnapshot<any, any>;
            expect(snap.seenRecords).toEqual({
                'UiApi::RecordRepresentation:001RM000004uuhnYAA__fields__Name': true,
            });
        });

        it('should denormalize ChildRelationships correctly', () => {
            const selection: LuvioSelectionCustomFieldNode = {
                kind: 'CustomFieldSelection',
                name: 'node',
                type: 'Record',
                luvioSelections: [
                    {
                        kind: 'CustomFieldSelection',
                        name: 'Child',
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
                                                kind: 'ScalarFieldSelection',
                                                name: 'Id',
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            };

            const store = new Store();
            store.records = {
                'UiApi::RecordRepresentation:001RM000004uuhnYAA': {
                    apiName: 'Account',
                    eTag: '',
                    lastModifiedById: '005RM000002492xYAA',
                    lastModifiedDate: '2021-03-11T20:15:39.000Z',
                    systemModstamp: '2021-03-11T20:15:39.000Z',
                    recordTypeId: '012RM000000E79WYAS',
                    recordTypeInfo: null,
                    childRelationships: {},
                    id: '001RM000004uuhnYAA',
                    weakEtag: 1615493739000,
                    fields: {},
                },
                'UiApi::RecordRepresentation:id': {
                    apiName: 'Partner',
                    eTag: '',
                    lastModifiedById: '005RM000002492xYAA',
                    lastModifiedDate: '2021-01-08T00:36:10.000Z',
                    systemModstamp: '2021-01-08T00:36:10.000Z',
                    recordTypeId: null,
                    recordTypeInfo: null,
                    childRelationships: {},
                    id: 'id',
                    weakEtag: 1610066170000,
                    fields: {},
                },
                'UiApi::RecordRepresentation:001RM000004uuhnYAA__childRelationships__Child__edges__0':
                    {
                        node: {
                            __ref: 'UiApi::RecordRepresentation:id',
                        },
                    },
                'UiApi::RecordRepresentation:001RM000004uuhnYAA__childRelationships__Child__edges':
                    [
                        {
                            __ref: 'UiApi::RecordRepresentation:001RM000004uuhnYAA__childRelationships__Child__edges__0',
                        },
                    ],
                'UiApi::RecordRepresentation:001RM000004uuhnYAA__childRelationships__Child': {
                    edges: {
                        __ref: 'UiApi::RecordRepresentation:001RM000004uuhnYAA__childRelationships__Child__edges',
                    },
                },
            };
            const luvio = new Luvio(
                new Environment(store, () => {
                    throw new Error('Not used');
                })
            );

            const snap = luvio.storeLookup({
                recordId: 'UiApi::RecordRepresentation:001RM000004uuhnYAA',
                node: {
                    kind: 'Fragment',
                    synthetic: false,
                    reader: true,
                    read: createRead(selection, {}),
                },
                variables: {},
            }) as FulfilledSnapshot<any, any>;
            expect(snap.state).toBe('Fulfilled');
            expect(snap.data).toEqual({
                Child: {
                    edges: [
                        {
                            node: {
                                Id: 'id',
                            },
                        },
                    ],
                },
            });
        });
    });

    describe('subscription', () => {
        it('should emit a new snapshot when underlying data has changed', () => {
            const store = new Store();
            store.records = {
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
            };
            const luvio = new Luvio(
                new Environment(store, () => {
                    throw new Error('Not used');
                })
            );

            const selection: LuvioSelectionCustomFieldNode = {
                kind: 'CustomFieldSelection',
                name: 'node',
                type: 'Record',
                luvioSelections: [
                    {
                        kind: 'ScalarFieldSelection',
                        name: 'Id',
                    },
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

            const snap = luvio.storeLookup({
                recordId: 'UiApi::RecordRepresentation:001RM000004uuhnYAA',
                node: {
                    kind: 'Fragment',
                    synthetic: false,
                    reader: true,
                    read: createRead(selection, {}),
                },
                variables: {},
            }) as FulfilledSnapshot<any, any>;
            const spy = jest.fn();
            luvio.storeSubscribe(snap, spy);

            luvio.storePublish('UiApi::RecordRepresentation:001RM000004uuhnYAA__fields__Name', {
                value: 'Updated!',
                displayValue: 'new',
            });
            luvio.storeBroadcast();
            expect(spy).toHaveBeenCalledTimes(1);
        });
    });

    describe('publishing records that have not changed', () => {
        it('should not ingest a RecordRepresentation that is unchanged', () => {
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

            luvio.storeBroadcast();
            jest.spyOn(store, 'publish');

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

            expect(store.publish).not.toHaveBeenCalled();
        });
    });
});
