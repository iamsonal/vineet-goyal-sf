import { Environment, FulfilledSnapshot, Luvio, Store, UnfulfilledSnapshot } from '@luvio/engine';
import { LuvioDocumentNode } from '@salesforce/lds-graphql-parser';
import { createIngest, createRead } from '../Document';

describe('Document', () => {
    describe('read', () => {
        it('should read document correctly', () => {
            const ast: LuvioDocumentNode = {
                kind: 'Document',
                definitions: [
                    {
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
                fullpath__uiapi__query: {
                    'Account(where:{Name:{like:"Account1"}})': {
                        __ref: 'gql::Connection::Account(where:{Name:{like:"Account1"}})',
                    },
                },
                fullpath__uiapi: {
                    query: {
                        __ref: 'fullpath__uiapi__query',
                    },
                },
                fullpath: {
                    uiapi: {
                        __ref: 'fullpath__uiapi',
                    },
                },
            };
            const luvio = new Luvio(
                new Environment(store, () => {
                    throw new Error('Not used');
                })
            );

            const snap = luvio.storeLookup({
                recordId: 'fullpath',
                node: {
                    kind: 'Fragment',
                    synthetic: false,
                    reader: true,
                    read: createRead(ast),
                },
                variables: {},
            });

            expect(snap.data).toEqual({
                data,
                errors: [],
            });
        });
        it('should return same data if arguments are different order', () => {
            const ast1 = {
                kind: 'Document',
                definitions: [
                    {
                        kind: 'OperationDefinition',
                        operation: 'query',
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
                                                                                name: 'LastModifiedBy',
                                                                                type: 'Record',
                                                                                luvioSelections: [
                                                                                    {
                                                                                        kind: 'ScalarFieldSelection',
                                                                                        name: 'Id',
                                                                                    },
                                                                                    {
                                                                                        kind: 'ObjectFieldSelection',
                                                                                        name: 'Name',
                                                                                        luvioSelections:
                                                                                            [
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
                                                                Owner: {
                                                                    kind: 'ObjectValue',
                                                                    fields: {
                                                                        Name: {
                                                                            kind: 'ObjectValue',
                                                                            fields: {
                                                                                like: {
                                                                                    kind: 'StringValue',
                                                                                    value: 'Admin User',
                                                                                },
                                                                            },
                                                                        },
                                                                        LastModifiedBy: {
                                                                            kind: 'ObjectValue',
                                                                            fields: {
                                                                                Name: {
                                                                                    kind: 'ObjectValue',
                                                                                    fields: {
                                                                                        like: {
                                                                                            kind: 'StringValue',
                                                                                            value: 'Admin User',
                                                                                        },
                                                                                    },
                                                                                },
                                                                                CreatedBy: {
                                                                                    kind: 'ObjectValue',
                                                                                    fields: {
                                                                                        Name: {
                                                                                            kind: 'ObjectValue',
                                                                                            fields: {
                                                                                                like: {
                                                                                                    kind: 'StringValue',
                                                                                                    value: 'Admin User',
                                                                                                },
                                                                                            },
                                                                                        },
                                                                                    },
                                                                                },
                                                                            },
                                                                        },
                                                                    },
                                                                },
                                                                Name: {
                                                                    kind: 'ObjectValue',
                                                                    fields: {
                                                                        like: {
                                                                            kind: 'StringValue',
                                                                            value: 'Account%',
                                                                        },
                                                                    },
                                                                },
                                                            },
                                                        },
                                                    },
                                                    {
                                                        kind: 'Argument',
                                                        name: 'orderBy',
                                                        value: {
                                                            kind: 'ObjectValue',
                                                            fields: {
                                                                Name: {
                                                                    kind: 'ObjectValue',
                                                                    fields: {
                                                                        order: {
                                                                            kind: 'EnumValue',
                                                                            value: 'ASC',
                                                                        },
                                                                    },
                                                                },
                                                                CreatedDate: {
                                                                    kind: 'ObjectValue',
                                                                    fields: {
                                                                        order: {
                                                                            kind: 'EnumValue',
                                                                            value: 'DESC',
                                                                        },
                                                                    },
                                                                },
                                                            },
                                                        },
                                                    },
                                                    {
                                                        kind: 'Argument',
                                                        name: 'first',
                                                        value: {
                                                            kind: 'IntValue',
                                                            value: '1',
                                                        },
                                                    },
                                                    {
                                                        kind: 'Argument',
                                                        name: 'scope',
                                                        value: {
                                                            kind: 'EnumValue',
                                                            value: 'EVERYTHING',
                                                        },
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
            };

            const ast2 = {
                kind: 'Document',
                definitions: [
                    {
                        kind: 'OperationDefinition',
                        operation: 'query',
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
                                                                                name: 'LastModifiedBy',
                                                                                type: 'Record',
                                                                                luvioSelections: [
                                                                                    {
                                                                                        kind: 'ScalarFieldSelection',
                                                                                        name: 'Id',
                                                                                    },
                                                                                    {
                                                                                        kind: 'ObjectFieldSelection',
                                                                                        name: 'Name',
                                                                                        luvioSelections:
                                                                                            [
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
                                                            },
                                                        ],
                                                    },
                                                ],
                                                arguments: [
                                                    {
                                                        kind: 'Argument',
                                                        name: 'orderBy',
                                                        value: {
                                                            kind: 'ObjectValue',
                                                            fields: {
                                                                CreatedDate: {
                                                                    kind: 'ObjectValue',
                                                                    fields: {
                                                                        order: {
                                                                            kind: 'EnumValue',
                                                                            value: 'DESC',
                                                                        },
                                                                    },
                                                                },
                                                                Name: {
                                                                    kind: 'ObjectValue',
                                                                    fields: {
                                                                        order: {
                                                                            kind: 'EnumValue',
                                                                            value: 'ASC',
                                                                        },
                                                                    },
                                                                },
                                                            },
                                                        },
                                                    },
                                                    {
                                                        kind: 'Argument',
                                                        name: 'first',
                                                        value: {
                                                            kind: 'IntValue',
                                                            value: '1',
                                                        },
                                                    },
                                                    {
                                                        kind: 'Argument',
                                                        name: 'scope',
                                                        value: {
                                                            kind: 'EnumValue',
                                                            value: 'EVERYTHING',
                                                        },
                                                    },
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
                                                                            value: 'Account%',
                                                                        },
                                                                    },
                                                                },
                                                                Owner: {
                                                                    kind: 'ObjectValue',
                                                                    fields: {
                                                                        Name: {
                                                                            kind: 'ObjectValue',
                                                                            fields: {
                                                                                like: {
                                                                                    kind: 'StringValue',
                                                                                    value: 'Admin User',
                                                                                },
                                                                            },
                                                                        },
                                                                        LastModifiedBy: {
                                                                            kind: 'ObjectValue',
                                                                            fields: {
                                                                                Name: {
                                                                                    kind: 'ObjectValue',
                                                                                    fields: {
                                                                                        like: {
                                                                                            kind: 'StringValue',
                                                                                            value: 'Admin User',
                                                                                        },
                                                                                    },
                                                                                },
                                                                                CreatedBy: {
                                                                                    kind: 'ObjectValue',
                                                                                    fields: {
                                                                                        Name: {
                                                                                            kind: 'ObjectValue',
                                                                                            fields: {
                                                                                                like: {
                                                                                                    kind: 'StringValue',
                                                                                                    value: 'Admin User',
                                                                                                },
                                                                                            },
                                                                                        },
                                                                                    },
                                                                                },
                                                                            },
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
                                        Id: '001RM000005BJPYYA4',
                                        Name: { value: 'Account0-Test', displayValue: null },
                                        Owner: {
                                            Name: { value: 'Admin User', displayValue: null },
                                            LastModifiedBy: {
                                                Id: '005RM000002492xYAA',
                                                Name: { value: 'Admin User', displayValue: null },
                                            },
                                        },
                                    },
                                },
                            ],
                        },
                    },
                },
            };

            const store = new Store();
            store.records = {
                'UiApi::RecordRepresentation:001RM000005BJPYYA4__fields__Name': {
                    value: 'Account0-Test',
                    displayValue: null,
                },
                'UiApi::RecordRepresentation:005RM000002492xYAA__fields__Name': {
                    value: 'Admin User',
                    displayValue: null,
                },
                'UiApi::RecordRepresentation:005RM000002492xYAA': {
                    apiName: 'User',
                    eTag: '',
                    lastModifiedById: '005RM000002492xYAA',
                    lastModifiedDate: '2021-02-20T06:31:45.000Z',
                    systemModstamp: '2021-05-19T14:29:47.000Z',
                    recordTypeId: null,
                    recordTypeInfo: null,
                    childRelationships: {},
                    id: '005RM000002492xYAA',
                    weakEtag: 1621434587000,
                    fields: {
                        Name: {
                            __ref: 'UiApi::RecordRepresentation:005RM000002492xYAA__fields__Name',
                        },
                        LastModifiedBy: {
                            __ref: 'UiApi::RecordRepresentation:005RM000002492xYAA__fields__LastModifiedBy',
                        },
                    },
                },
                'UiApi::RecordRepresentation:005RM000002492xYAA__fields__LastModifiedBy': {
                    displayValue: 'Admin User',
                    value: { __ref: 'UiApi::RecordRepresentation:005RM000002492xYAA' },
                },
                'UiApi::RecordRepresentation:001RM000005BJPYYA4__fields__Owner': {
                    displayValue: 'Admin User',
                    value: { __ref: 'UiApi::RecordRepresentation:005RM000002492xYAA' },
                },
                'UiApi::RecordRepresentation:001RM000005BJPYYA4': {
                    apiName: 'Account',
                    eTag: '',
                    lastModifiedById: '005RM000002492xYAA',
                    lastModifiedDate: '2021-05-01T00:35:22.000Z',
                    systemModstamp: '2021-05-01T00:35:23.000Z',
                    recordTypeId: '012RM000000E79WYAS',
                    recordTypeInfo: null,
                    childRelationships: {},
                    id: '001RM000005BJPYYA4',
                    weakEtag: 1619829323000,
                    fields: {
                        Name: {
                            __ref: 'UiApi::RecordRepresentation:001RM000005BJPYYA4__fields__Name',
                        },
                        Owner: {
                            __ref: 'UiApi::RecordRepresentation:001RM000005BJPYYA4__fields__Owner',
                        },
                    },
                },
                'gql::Connection::Account(first:1,orderBy:{CreatedDate:{order:DESC},Name:{order:ASC}},scope:EVERYTHING,where:{Name:{like:"Account%"},Owner:{LastModifiedBy:{CreatedBy:{Name:{like:"Admin User"}},Name:{like:"Admin User"}},Name:{like:"Admin User"}}})__edges__0':
                    {
                        node: { __ref: 'UiApi::RecordRepresentation:001RM000005BJPYYA4' },
                    },
                'gql::Connection::Account(first:1,orderBy:{CreatedDate:{order:DESC},Name:{order:ASC}},scope:EVERYTHING,where:{Name:{like:"Account%"},Owner:{LastModifiedBy:{CreatedBy:{Name:{like:"Admin User"}},Name:{like:"Admin User"}},Name:{like:"Admin User"}}})__edges':
                    [
                        {
                            __ref: 'gql::Connection::Account(first:1,orderBy:{CreatedDate:{order:DESC},Name:{order:ASC}},scope:EVERYTHING,where:{Name:{like:"Account%"},Owner:{LastModifiedBy:{CreatedBy:{Name:{like:"Admin User"}},Name:{like:"Admin User"}},Name:{like:"Admin User"}}})__edges__0',
                        },
                    ],
                'gql::Connection::Account(first:1,orderBy:{CreatedDate:{order:DESC},Name:{order:ASC}},scope:EVERYTHING,where:{Name:{like:"Account%"},Owner:{LastModifiedBy:{CreatedBy:{Name:{like:"Admin User"}},Name:{like:"Admin User"}},Name:{like:"Admin User"}}})':
                    {
                        edges: {
                            __ref: 'gql::Connection::Account(first:1,orderBy:{CreatedDate:{order:DESC},Name:{order:ASC}},scope:EVERYTHING,where:{Name:{like:"Account%"},Owner:{LastModifiedBy:{CreatedBy:{Name:{like:"Admin User"}},Name:{like:"Admin User"}},Name:{like:"Admin User"}}})__edges',
                        },
                    },
                fullpath__uiapi__query: {
                    'Account(first:1,orderBy:{CreatedDate:{order:DESC},Name:{order:ASC}},scope:EVERYTHING,where:{Name:{like:"Account%"},Owner:{LastModifiedBy:{CreatedBy:{Name:{like:"Admin User"}},Name:{like:"Admin User"}},Name:{like:"Admin User"}}})':
                        {
                            __ref: 'gql::Connection::Account(first:1,orderBy:{CreatedDate:{order:DESC},Name:{order:ASC}},scope:EVERYTHING,where:{Name:{like:"Account%"},Owner:{LastModifiedBy:{CreatedBy:{Name:{like:"Admin User"}},Name:{like:"Admin User"}},Name:{like:"Admin User"}}})',
                        },
                },
                fullpath__uiapi: { query: { __ref: 'fullpath__uiapi__query' } },
                fullpath: { uiapi: { __ref: 'fullpath__uiapi' } },
            };

            const luvio = new Luvio(
                new Environment(store, () => {
                    throw new Error('Not used');
                })
            );

            const snap1 = luvio.storeLookup({
                recordId: 'fullpath',
                node: {
                    kind: 'Fragment',
                    synthetic: false,
                    reader: true,
                    read: createRead(ast1),
                },
                variables: {},
            });
            const snap2 = luvio.storeLookup({
                recordId: 'fullpath',
                node: {
                    kind: 'Fragment',
                    synthetic: false,
                    reader: true,
                    read: createRead(ast2),
                },
                variables: {},
            });

            expect(snap1.data).toEqual({
                data,
                errors: [],
            });
            expect(snap1.data).toEqual(snap2.data);
        });

        it('should return correct seenIds', () => {
            const ast: LuvioDocumentNode = {
                kind: 'Document',
                definitions: [
                    {
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
                fullpath__uiapi__query: {
                    'Account(where:{Name:{like:"Account1"}})': {
                        __ref: 'gql::Connection::Account(where:{Name:{like:"Account1"}})',
                    },
                },
                fullpath__uiapi: {
                    query: {
                        __ref: 'fullpath__uiapi__query',
                    },
                },
                fullpath: {
                    uiapi: {
                        __ref: 'fullpath__uiapi',
                    },
                },
            };
            const luvio = new Luvio(
                new Environment(store, () => {
                    throw new Error('Not used');
                })
            );

            const snap = luvio.storeLookup({
                recordId: 'fullpath',
                node: {
                    kind: 'Fragment',
                    synthetic: false,
                    reader: true,
                    read: createRead(ast),
                },
                variables: {},
            }) as FulfilledSnapshot<any, any>;

            expect(snap.seenRecords).toEqual({
                fullpath__uiapi: true,
                fullpath__uiapi__query: true,
                'gql::Connection::Account(where:{Name:{like:"Account1"}})': true,
                'gql::Connection::Account(where:{Name:{like:"Account1"}})__edges': true,
                'gql::Connection::Account(where:{Name:{like:"Account1"}})__edges__0': true,
                'UiApi::RecordRepresentation:001RM000004uuhnYAA': true,
                'UiApi::RecordRepresentation:001RM000004uuhnYAA__fields__Name': true,
            });
        });

        it('should return correct seenIds when ids are aliased', () => {
            const ast: LuvioDocumentNode = {
                kind: 'Document',
                definitions: [
                    {
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
                                    },
                                ],
                            },
                        ],
                    },
                ],
            };

            const store = new Store();
            store.redirectKeys = {
                redirect: 'UiApi::RecordRepresentation:001RM000004uuhnYAA',
            };
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
                'gql::Connection::Account(where:{Name:{like:"Account1"}})__edges__0': {
                    node: {
                        __ref: 'redirect',
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
                fullpath__uiapi__query: {
                    'Account(where:{Name:{like:"Account1"}})': {
                        __ref: 'gql::Connection::Account(where:{Name:{like:"Account1"}})',
                    },
                },
                fullpath__uiapi: {
                    query: {
                        __ref: 'fullpath__uiapi__query',
                    },
                },
                fullpath: {
                    uiapi: {
                        __ref: 'fullpath__uiapi',
                    },
                },
            };
            const luvio = new Luvio(
                new Environment(store, () => {
                    throw new Error('Not used');
                })
            );

            const snap = luvio.storeLookup({
                recordId: 'fullpath',
                node: {
                    kind: 'Fragment',
                    synthetic: false,
                    reader: true,
                    read: createRead(ast),
                },
                variables: {},
            }) as FulfilledSnapshot<any, any>;

            expect(snap.seenRecords).toEqual({
                fullpath__uiapi: true,
                fullpath__uiapi__query: true,
                'gql::Connection::Account(where:{Name:{like:"Account1"}})': true,
                'gql::Connection::Account(where:{Name:{like:"Account1"}})__edges': true,
                'gql::Connection::Account(where:{Name:{like:"Account1"}})__edges__0': true,
                'UiApi::RecordRepresentation:001RM000004uuhnYAA': true,
                'UiApi::RecordRepresentation:001RM000004uuhnYAA__fields__Name': true,
                redirect: true,
            });
        });

        it('should return unfulfilled when data is missing', () => {
            const ast: LuvioDocumentNode = {
                kind: 'Document',
                definitions: [
                    {
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
                                    },
                                ],
                            },
                        ],
                    },
                ],
            };

            const store = new Store();
            store.records = {
                'gql::Connection::Account(where:{Name:{like:"Account1"}})__edges__0': {
                    node: {
                        __ref: 'missingRef',
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
                fullpath__uiapi__query: {
                    'Account(where:{Name:{like:"Account1"}})': {
                        __ref: 'gql::Connection::Account(where:{Name:{like:"Account1"}})',
                    },
                },
                fullpath__uiapi: {
                    query: {
                        __ref: 'fullpath__uiapi__query',
                    },
                },
                fullpath: {
                    uiapi: {
                        __ref: 'fullpath__uiapi',
                    },
                },
            };
            const luvio = new Luvio(
                new Environment(store, () => {
                    throw new Error('Not used');
                })
            );

            const snap = luvio.storeLookup({
                recordId: 'fullpath',
                node: {
                    kind: 'Fragment',
                    synthetic: false,
                    reader: true,
                    read: createRead(ast),
                },
                variables: {},
            }) as UnfulfilledSnapshot<any, any>;

            expect(snap.state).toBe('Unfulfilled');
            expect(snap.missingPaths).toEqual({
                'uiapi.query.Account.edges.0.node': true,
            });
            expect(snap.missingLinks).toEqual({
                missingRef: true,
            });
        });

        it('should return unfulfilled when top level is missing', () => {
            const ast: LuvioDocumentNode = {
                kind: 'Document',
                definitions: [
                    {
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
                                    },
                                ],
                            },
                        ],
                    },
                ],
            };

            const store = new Store();
            store.records = {
                fullpath: {
                    uiapi: {
                        __ref: 'fullpath__uiapi',
                    },
                },
            };
            const luvio = new Luvio(
                new Environment(store, () => {
                    throw new Error('Not used');
                })
            );

            const snap = luvio.storeLookup({
                recordId: 'fullpath',
                node: {
                    kind: 'Fragment',
                    synthetic: false,
                    reader: true,
                    read: createRead(ast),
                },
                variables: {},
            }) as UnfulfilledSnapshot<any, any>;

            expect(snap.state).toBe('Unfulfilled');
            expect(snap.missingPaths).toEqual({
                uiapi: true,
            });
            expect(snap.missingLinks).toEqual({
                fullpath__uiapi: true,
            });
        });
    });

    describe('ingest', () => {
        it('should ingest document correctly', () => {
            const ast: LuvioDocumentNode = {
                kind: 'Document',
                definitions: [
                    {
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
                    fullPath: 'fullpath',
                    parent: null,
                    propertyName: null,
                    state: undefined,
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
                fullpath__uiapi__query: {
                    'Account(where:{Name:{like:"Account1"}})': {
                        __ref: 'gql::Connection::Account(where:{Name:{like:"Account1"}})',
                    },
                },
                fullpath__uiapi: {
                    query: {
                        __ref: 'fullpath__uiapi__query',
                    },
                },
                fullpath: {
                    uiapi: {
                        __ref: 'fullpath__uiapi',
                    },
                },
            });
        });

        it('should correctly ingest document with aliases', () => {
            const ast: LuvioDocumentNode = {
                kind: 'Document',
                definitions: [
                    {
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
                                            {
                                                kind: 'CustomFieldSelection',
                                                name: 'Account',
                                                type: 'Connection',
                                                alias: 'foo',
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
                                                                        eq: {
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
                        foo: {
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
                    fullPath: 'fullpath',
                    parent: null,
                    propertyName: null,
                    state: undefined,
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
                fullpath__uiapi__query: {
                    'Account(where:{Name:{like:"Account1"}})': {
                        __ref: 'gql::Connection::Account(where:{Name:{like:"Account1"}})',
                    },
                    'Account(where:{Name:{eq:"Account1"}})': {
                        __ref: 'gql::Connection::Account(where:{Name:{eq:"Account1"}})',
                    },
                },
                'gql::Connection::Account(where:{Name:{eq:"Account1"}})': {
                    edges: {
                        __ref: 'gql::Connection::Account(where:{Name:{eq:"Account1"}})__edges',
                    },
                },
                'gql::Connection::Account(where:{Name:{eq:"Account1"}})__edges': [
                    {
                        __ref: 'gql::Connection::Account(where:{Name:{eq:"Account1"}})__edges__0',
                    },
                ],
                'gql::Connection::Account(where:{Name:{eq:"Account1"}})__edges__0': {
                    node: {
                        __ref: 'UiApi::RecordRepresentation:001RM000004uuhnYAA',
                    },
                },
                fullpath__uiapi: {
                    query: {
                        __ref: 'fullpath__uiapi__query',
                    },
                },
                fullpath: {
                    uiapi: {
                        __ref: 'fullpath__uiapi',
                    },
                },
            });
        });
    });
});
