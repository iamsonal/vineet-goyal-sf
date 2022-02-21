import { getMock as globalGetMock } from 'test-util';
import { mockGraphqlNetwork, parseQuery } from 'graphql-test-util';
import { graphQLImperative } from 'lds-adapters-graphql';

const MOCK_PREFIX = 'wire/graphql/__karma__/custom-metadata/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

// To regenerate the mock data see https://gus.lightning.force.com/lightning/r/0D5EE00000nA0ye0AC/view

describe('custom metadata graphql queries', () => {
    it('basic select query', async () => {
        const ast = parseQuery(/* GraphQL */ `
            query getSupportTiers {
                uiapi {
                    query {
                        Support_Tier__mdt(orderBy: { Label: { order: ASC } }) @connection {
                            edges {
                                node @resource(type: "Record") {
                                    Label {
                                        value
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `);

        const expectedQuery = /* GraphQL */ `
            query getSupportTiers {
                __typename
                uiapi {
                    __typename
                    query {
                        __typename
                        Support_Tier__mdt(orderBy: { Label: { order: ASC } }) {
                            __typename
                            edges {
                                __typename
                                node {
                                    Label {
                                        __typename
                                        value
                                        displayValue
                                    }
                                    ...defaultRecordFields
                                }
                                cursor
                            }
                            pageInfo {
                                hasNextPage
                                hasPreviousPage
                            }
                            totalCount
                        }
                    }
                }
            }
            fragment defaultRecordFields on Record {
                __typename
                ApiName
                WeakEtag
                Id
                DisplayValue
                SystemModstamp {
                    value
                }
                LastModifiedById {
                    value
                }
                LastModifiedDate {
                    value
                }
                RecordTypeId(fallback: true) {
                    value
                }
            }
        `;

        const mock = getMock('RecordQuery-SupportTiers-fields-Label');

        const expectedData = {
            data: {
                uiapi: {
                    query: {
                        Support_Tier__mdt: {
                            edges: [
                                {
                                    node: {
                                        Label: {
                                            value: 'Tier 0',
                                        },
                                    },
                                },
                                {
                                    node: {
                                        Label: {
                                            value: 'Tier 1',
                                        },
                                    },
                                },
                                {
                                    node: {
                                        Label: {
                                            value: 'Tier 2',
                                        },
                                    },
                                },
                            ],
                        },
                    },
                },
            },
            errors: [],
        };

        mockGraphqlNetwork(
            {
                query: expectedQuery,
                variables: {},
            },
            mock
        );

        const graphqlConfig = {
            query: ast,
            variables: {},
        };

        const snapshot = await graphQLImperative(graphqlConfig);
        expect(snapshot.data).toEqualSnapshotWithoutEtags(expectedData);
    });

    describe('custom metadata fields', () => {
        it('query with all custom field types and where condition', async () => {
            const ast = parseQuery(/* GraphQL */ `
                query getSupportTiers {
                    uiapi {
                        query {
                            Support_Tier__mdt(where: { Label: { in: ["Tier 0", "Tier 1"] } })
                                @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        Id
                                        Label {
                                            value
                                        }
                                        Is_Active__c {
                                            value
                                        }
                                        Activation_Date__c {
                                            value
                                        }
                                        LastModifiedDate {
                                            value
                                        }
                                        Default_Email__c {
                                            value
                                        }
                                        Agents_Count__c {
                                            value
                                        }
                                        Utilization_Rate__c {
                                            value
                                        }
                                        Default_Phone__c {
                                            value
                                        }
                                        Language {
                                            value
                                        }
                                        Additional_Details__c {
                                            value
                                        }
                                        Default_Support_URL__c {
                                            value
                                        }
                                        Service_Level_Agreement__c {
                                            value
                                        }
                                        Service_Level_Agreement__r @resource(type: "Record") {
                                            Id
                                            DisplayValue
                                            Label {
                                                value
                                            }
                                            Response_in_Hours__c {
                                                value
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            `);

            const expectedQuery = /* GraphQL */ `
                query getSupportTiers {
                    __typename
                    uiapi {
                        __typename
                        query {
                            __typename
                            Support_Tier__mdt(where: { Label: { in: ["Tier 0", "Tier 1"] } }) {
                                __typename
                                edges {
                                    __typename
                                    node {
                                        Id
                                        Label {
                                            __typename
                                            value
                                            displayValue
                                        }
                                        Is_Active__c {
                                            __typename
                                            value
                                            displayValue
                                        }
                                        Activation_Date__c {
                                            __typename
                                            value
                                            displayValue
                                        }
                                        LastModifiedDate {
                                            __typename
                                            value
                                            displayValue
                                        }
                                        Default_Email__c {
                                            __typename
                                            value
                                            displayValue
                                        }
                                        Agents_Count__c {
                                            __typename
                                            value
                                            displayValue
                                        }
                                        Utilization_Rate__c {
                                            __typename
                                            value
                                            displayValue
                                        }
                                        Default_Phone__c {
                                            __typename
                                            value
                                            displayValue
                                        }
                                        Language {
                                            __typename
                                            value
                                            displayValue
                                        }
                                        Additional_Details__c {
                                            __typename
                                            value
                                            displayValue
                                        }
                                        Default_Support_URL__c {
                                            __typename
                                            value
                                            displayValue
                                        }
                                        Service_Level_Agreement__c {
                                            __typename
                                            value
                                            displayValue
                                        }
                                        Service_Level_Agreement__r {
                                            Id
                                            DisplayValue
                                            Label {
                                                __typename
                                                value
                                                displayValue
                                            }
                                            Response_in_Hours__c {
                                                __typename
                                                value
                                                displayValue
                                            }
                                            ...defaultRecordFields
                                        }
                                        ...defaultRecordFields
                                    }
                                    cursor
                                }
                                pageInfo {
                                    hasNextPage
                                    hasPreviousPage
                                }
                                totalCount
                            }
                        }
                    }
                }
                fragment defaultRecordFields on Record {
                    __typename
                    ApiName
                    WeakEtag
                    Id
                    DisplayValue
                    SystemModstamp {
                        value
                    }
                    LastModifiedById {
                        value
                    }
                    LastModifiedDate {
                        value
                    }
                    RecordTypeId(fallback: true) {
                        value
                    }
                }
            `;

            const mock = getMock('RecordQuery-SupportTiers-custom-field-types');

            const expectedData = {
                data: {
                    uiapi: {
                        query: {
                            Support_Tier__mdt: {
                                edges: [
                                    {
                                        node: {
                                            Id: 'm00xx000000bqDVAAY',
                                            Label: {
                                                value: 'Tier 0',
                                            },
                                            Is_Active__c: {
                                                value: true,
                                            },
                                            Activation_Date__c: {
                                                value: '2022-02-11',
                                            },
                                            LastModifiedDate: {
                                                value: null,
                                            },
                                            Default_Email__c: {
                                                value: 'tier0@salesforce.com',
                                            },
                                            Agents_Count__c: {
                                                value: 5,
                                            },
                                            Utilization_Rate__c: {
                                                value: 90,
                                            },
                                            Default_Phone__c: {
                                                value: '111-222-3333',
                                            },
                                            Language: {
                                                value: 'en_US',
                                            },
                                            Additional_Details__c: {
                                                value: 'Tier 0 Details',
                                            },
                                            Default_Support_URL__c: {
                                                value: 'salesforce.com',
                                            },
                                            Service_Level_Agreement__c: {
                                                value: 'm01xx000003GccdAAC',
                                            },
                                            Service_Level_Agreement__r: {
                                                Id: 'm01xx000003GccdAAC',
                                                DisplayValue: 'Level_0',
                                                Label: {
                                                    value: 'Level 0',
                                                },
                                                Response_in_Hours__c: {
                                                    value: 4,
                                                },
                                            },
                                        },
                                    },
                                    {
                                        node: {
                                            Id: 'm00xx000000bqF7AAI',
                                            Label: {
                                                value: 'Tier 1',
                                            },
                                            Is_Active__c: {
                                                value: false,
                                            },
                                            Activation_Date__c: {
                                                value: '2021-01-11',
                                            },
                                            LastModifiedDate: {
                                                value: null,
                                            },
                                            Default_Email__c: {
                                                value: 'tier1@salesforce.com',
                                            },
                                            Agents_Count__c: {
                                                value: 10,
                                            },
                                            Utilization_Rate__c: {
                                                value: 75.89,
                                            },
                                            Default_Phone__c: {
                                                value: '(333) 444-5555',
                                            },
                                            Language: {
                                                value: 'en_US',
                                            },
                                            Additional_Details__c: {
                                                value: 'Tier 1 Details',
                                            },
                                            Default_Support_URL__c: {
                                                value: 'salesforce.com/tier1',
                                            },
                                            Service_Level_Agreement__c: {
                                                value: 'm01xx000003GceFAAS',
                                            },
                                            Service_Level_Agreement__r: {
                                                Id: 'm01xx000003GceFAAS',
                                                DisplayValue: 'Level_1',
                                                Label: {
                                                    value: 'Level 1',
                                                },
                                                Response_in_Hours__c: {
                                                    value: 8,
                                                },
                                            },
                                        },
                                    },
                                ],
                            },
                        },
                    },
                },
                errors: [],
            };

            mockGraphqlNetwork(
                {
                    query: expectedQuery,
                    variables: {},
                },
                mock
            );

            const graphqlConfig = {
                query: ast,
                variables: {},
            };

            const snapshot = await graphQLImperative(graphqlConfig);
            expect(snapshot.data).toEqualSnapshotWithoutEtags(expectedData);
        });

        it('query with custom metadata relationship field in where condition with variable', async () => {
            const ast = parseQuery(/* GraphQL */ `
                query getSupportTiers($levelLabel: String) {
                    uiapi {
                        query {
                            Support_Tier__mdt(
                                where: {
                                    Service_Level_Agreement__r: { Label: { eq: $levelLabel } }
                                }
                            ) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        Id
                                        Label {
                                            value
                                        }
                                        Service_Level_Agreement__c {
                                            value
                                        }
                                        Service_Level_Agreement__r @resource(type: "Record") {
                                            Id
                                            DisplayValue
                                            Label {
                                                value
                                            }
                                            Response_in_Hours__c {
                                                value
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            `);

            const expectedQuery = /* GraphQL */ `
                query getSupportTiers($levelLabel: String) {
                    __typename
                    uiapi {
                        __typename
                        query {
                            __typename
                            Support_Tier__mdt(
                                where: {
                                    Service_Level_Agreement__r: { Label: { eq: $levelLabel } }
                                }
                            ) {
                                __typename
                                edges {
                                    __typename
                                    node {
                                        Id
                                        Label {
                                            __typename
                                            value
                                            displayValue
                                        }
                                        Service_Level_Agreement__c {
                                            __typename
                                            value
                                            displayValue
                                        }
                                        Service_Level_Agreement__r {
                                            Id
                                            DisplayValue
                                            Label {
                                                __typename
                                                value
                                                displayValue
                                            }
                                            Response_in_Hours__c {
                                                __typename
                                                value
                                                displayValue
                                            }
                                            ...defaultRecordFields
                                        }
                                        ...defaultRecordFields
                                    }
                                    cursor
                                }
                                pageInfo {
                                    hasNextPage
                                    hasPreviousPage
                                }
                                totalCount
                            }
                        }
                    }
                }
                fragment defaultRecordFields on Record {
                    __typename
                    ApiName
                    WeakEtag
                    Id
                    DisplayValue
                    SystemModstamp {
                        value
                    }
                    LastModifiedById {
                        value
                    }
                    LastModifiedDate {
                        value
                    }
                    RecordTypeId(fallback: true) {
                        value
                    }
                }
            `;

            const mock = getMock('RecordQuery-SupportTiers-metadata-relationship-where');

            const expectedData = {
                data: {
                    uiapi: {
                        query: {
                            Support_Tier__mdt: {
                                edges: [
                                    {
                                        node: {
                                            Id: 'm00xx000000bqGjAAI',
                                            Label: {
                                                value: 'Tier 2',
                                            },
                                            Service_Level_Agreement__c: {
                                                value: 'm01xx000003GchTAAS',
                                            },
                                            Service_Level_Agreement__r: {
                                                Id: 'm01xx000003GchTAAS',
                                                DisplayValue: 'Level_3',
                                                Label: {
                                                    value: 'Level 3',
                                                },
                                                Response_in_Hours__c: {
                                                    value: 72,
                                                },
                                            },
                                        },
                                    },
                                ],
                            },
                        },
                    },
                },
                errors: [],
            };

            mockGraphqlNetwork(
                {
                    query: expectedQuery,
                    variables: {
                        levelLabel: 'Level 3',
                    },
                },
                mock
            );

            const graphqlConfig = {
                query: ast,
                variables: {
                    levelLabel: 'Level 3',
                },
            };

            const snapshot = await graphQLImperative(graphqlConfig);
            expect(snapshot.data).toEqualSnapshotWithoutEtags(expectedData);
        });

        it('query with custom metadata relationship field in orderby results in error', async () => {
            const ast = parseQuery(/* GraphQL */ `
                query getSupportTiers {
                    uiapi {
                        query {
                            Support_Tier__mdt(
                                orderBy: { Service_Level_Agreement__r: { order: DESC } }
                            ) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        Id
                                        Label {
                                            value
                                        }
                                        Service_Level_Agreement__c {
                                            value
                                        }
                                        Service_Level_Agreement__r @resource(type: "Record") {
                                            Id
                                            DisplayValue
                                            Label {
                                                value
                                            }
                                            Response_in_Hours__c {
                                                value
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            `);

            const expectedQuery = /* GraphQL */ `
                query getSupportTiers {
                    __typename
                    uiapi {
                        __typename
                        query {
                            __typename
                            Support_Tier__mdt(
                                orderBy: { Service_Level_Agreement__r: { order: DESC } }
                            ) {
                                __typename
                                edges {
                                    __typename
                                    node {
                                        Id
                                        Label {
                                            __typename
                                            value
                                            displayValue
                                        }
                                        Service_Level_Agreement__c {
                                            __typename
                                            value
                                            displayValue
                                        }
                                        Service_Level_Agreement__r {
                                            Id
                                            DisplayValue
                                            Label {
                                                __typename
                                                value
                                                displayValue
                                            }
                                            Response_in_Hours__c {
                                                __typename
                                                value
                                                displayValue
                                            }
                                            ...defaultRecordFields
                                        }
                                        ...defaultRecordFields
                                    }
                                    cursor
                                }
                                pageInfo {
                                    hasNextPage
                                    hasPreviousPage
                                }
                                totalCount
                            }
                        }
                    }
                }
                fragment defaultRecordFields on Record {
                    __typename
                    ApiName
                    WeakEtag
                    Id
                    DisplayValue
                    SystemModstamp {
                        value
                    }
                    LastModifiedById {
                        value
                    }
                    LastModifiedDate {
                        value
                    }
                    RecordTypeId(fallback: true) {
                        value
                    }
                }
            `;

            const mock = getMock('RecordQuery-SupportTiers-metadata-relationship-orderby');

            const expectedData = {
                data: {},
                errors: [
                    {
                        locations: [
                            {
                                column: 25,
                                line: 7,
                            },
                        ],
                        message:
                            "Validation error of type WrongType: argument 'orderBy.Service_Level_Agreement__r' with value 'ObjectValue{objectFields=[ObjectField{name='Service_Level_Agreement__r', value=ObjectValue{objectFields=[ObjectField{name='order', value=EnumValue{name='DESC'}}]}}]}' contains a field not in 'Service_Level_Agreement__mdt_OrderBy': 'order' @ 'uiapi/query/Support_Tier__mdt'",
                        paths: [],
                    },
                ],
            };

            mockGraphqlNetwork(
                {
                    query: expectedQuery,
                    variables: {
                        levelLabel: 'Level 3',
                    },
                },
                mock
            );

            const graphqlConfig = {
                query: ast,
                variables: {
                    levelLabel: 'Level 3',
                },
            };

            const snapshot = await graphQLImperative(graphqlConfig);
            expect(snapshot.data).toEqualSnapshotWithoutEtags(expectedData);
        });
    });

    describe('caching', () => {
        it('should not hit network when all data is in cache', async () => {
            const ast = parseQuery(/* GraphQL */ `
                query getSupportTiers {
                    uiapi {
                        query {
                            Support_Tier__mdt(orderBy: { Label: { order: ASC } }) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        Label {
                                            value
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            `);

            const expectedQuery = /* GraphQL */ `
                query getSupportTiers {
                    __typename
                    uiapi {
                        __typename
                        query {
                            __typename
                            Support_Tier__mdt(orderBy: { Label: { order: ASC } }) {
                                __typename
                                edges {
                                    __typename
                                    node {
                                        Label {
                                            __typename
                                            value
                                            displayValue
                                        }
                                        ...defaultRecordFields
                                    }
                                    cursor
                                }
                                pageInfo {
                                    hasNextPage
                                    hasPreviousPage
                                }
                                totalCount
                            }
                        }
                    }
                }
                fragment defaultRecordFields on Record {
                    __typename
                    ApiName
                    WeakEtag
                    Id
                    DisplayValue
                    SystemModstamp {
                        value
                    }
                    LastModifiedById {
                        value
                    }
                    LastModifiedDate {
                        value
                    }
                    RecordTypeId(fallback: true) {
                        value
                    }
                }
            `;

            const mock = getMock('RecordQuery-SupportTiers-fields-Label');

            const expectedData = {
                data: {
                    uiapi: {
                        query: {
                            Support_Tier__mdt: {
                                edges: [
                                    {
                                        node: {
                                            Label: {
                                                value: 'Tier 0',
                                            },
                                        },
                                    },
                                    {
                                        node: {
                                            Label: {
                                                value: 'Tier 1',
                                            },
                                        },
                                    },
                                    {
                                        node: {
                                            Label: {
                                                value: 'Tier 2',
                                            },
                                        },
                                    },
                                ],
                            },
                        },
                    },
                },
                errors: [],
            };

            mockGraphqlNetwork(
                {
                    query: expectedQuery,
                    variables: {},
                },
                mock
            );

            const graphqlConfig = {
                query: ast,
                variables: {},
            };

            const snapshot = await graphQLImperative(graphqlConfig);
            expect(snapshot.data).toEqualSnapshotWithoutEtags(expectedData);

            const ast2 = parseQuery(/* GraphQL */ `
                query getSupportTiers {
                    uiapi {
                        query {
                            Support_Tier__mdt(orderBy: { Label: { order: ASC } }) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        Id
                                        Label {
                                            value
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            `);

            const expectedData2 = {
                data: {
                    uiapi: {
                        query: {
                            Support_Tier__mdt: {
                                edges: [
                                    {
                                        node: {
                                            Id: 'm00xx000000bqDVAAY',
                                            Label: {
                                                value: 'Tier 0',
                                            },
                                        },
                                    },
                                    {
                                        node: {
                                            Id: 'm00xx000000bqF7AAI',
                                            Label: {
                                                value: 'Tier 1',
                                            },
                                        },
                                    },
                                    {
                                        node: {
                                            Id: 'm00xx000000bqGjAAI',
                                            Label: {
                                                value: 'Tier 2',
                                            },
                                        },
                                    },
                                ],
                            },
                        },
                    },
                },
                errors: [],
            };

            const graphqlConfig2 = {
                query: ast2,
                variables: {},
            };

            const secondSnapshot = await graphQLImperative(graphqlConfig2);
            expect(secondSnapshot.data).toEqualSnapshotWithoutEtags(expectedData2);
        });

        it('should not hit network when all data is in cache from multiple requests', async () => {
            const astLabel = parseQuery(/* GraphQL */ `
                query getSupportTiers {
                    uiapi {
                        query {
                            Support_Tier__mdt(orderBy: { Label: { order: ASC } }) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        Label {
                                            value
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            `);

            const expectedQueryLabel = /* GraphQL */ `
                query getSupportTiers {
                    __typename
                    uiapi {
                        __typename
                        query {
                            __typename
                            Support_Tier__mdt(orderBy: { Label: { order: ASC } }) {
                                __typename
                                edges {
                                    __typename
                                    node {
                                        Label {
                                            __typename
                                            value
                                            displayValue
                                        }
                                        ...defaultRecordFields
                                    }
                                    cursor
                                }
                                pageInfo {
                                    hasNextPage
                                    hasPreviousPage
                                }
                                totalCount
                            }
                        }
                    }
                }
                fragment defaultRecordFields on Record {
                    __typename
                    ApiName
                    WeakEtag
                    Id
                    DisplayValue
                    SystemModstamp {
                        value
                    }
                    LastModifiedById {
                        value
                    }
                    LastModifiedDate {
                        value
                    }
                    RecordTypeId(fallback: true) {
                        value
                    }
                }
            `;

            const mockLabel = getMock('RecordQuery-SupportTiers-fields-Label');

            const expectedDataLabel = {
                data: {
                    uiapi: {
                        query: {
                            Support_Tier__mdt: {
                                edges: [
                                    {
                                        node: {
                                            Label: {
                                                value: 'Tier 0',
                                            },
                                        },
                                    },
                                    {
                                        node: {
                                            Label: {
                                                value: 'Tier 1',
                                            },
                                        },
                                    },
                                    {
                                        node: {
                                            Label: {
                                                value: 'Tier 2',
                                            },
                                        },
                                    },
                                ],
                            },
                        },
                    },
                },
                errors: [],
            };

            mockGraphqlNetwork(
                {
                    query: expectedQueryLabel,
                    variables: {},
                },
                mockLabel
            );

            const graphqlConfigLabel = {
                query: astLabel,
                variables: {},
            };

            const snapshotLabel = await graphQLImperative(graphqlConfigLabel);
            expect(snapshotLabel.data).toEqualSnapshotWithoutEtags(expectedDataLabel);

            const astSLA = parseQuery(/* GraphQL */ `
                query getSupportTiers {
                    uiapi {
                        query {
                            Support_Tier__mdt(orderBy: { Label: { order: ASC } }) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        Service_Level_Agreement__r @resource(type: "Record") {
                                            Id
                                            Label {
                                                value
                                            }
                                            Response_in_Hours__c {
                                                value
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            `);

            const expectedQuerySLA = /* GraphQL */ `
                query getSupportTiers {
                    __typename
                    uiapi {
                        __typename
                        query {
                            __typename
                            Support_Tier__mdt(orderBy: { Label: { order: ASC } }) {
                                __typename
                                edges {
                                    __typename
                                    node {
                                        Service_Level_Agreement__r {
                                            Id
                                            Label {
                                                __typename
                                                value
                                                displayValue
                                            }
                                            Response_in_Hours__c {
                                                __typename
                                                value
                                                displayValue
                                            }
                                            ...defaultRecordFields
                                        }
                                        ...defaultRecordFields
                                    }
                                    cursor
                                }
                                pageInfo {
                                    hasNextPage
                                    hasPreviousPage
                                }
                                totalCount
                            }
                        }
                    }
                }
                fragment defaultRecordFields on Record {
                    __typename
                    ApiName
                    WeakEtag
                    Id
                    DisplayValue
                    SystemModstamp {
                        value
                    }
                    LastModifiedById {
                        value
                    }
                    LastModifiedDate {
                        value
                    }
                    RecordTypeId(fallback: true) {
                        value
                    }
                }
            `;

            const mockSLA = getMock('RecordQuery-SupportTiers-fields-Service-Level-Agreement');

            const expectedDataSLA = {
                data: {
                    uiapi: {
                        query: {
                            Support_Tier__mdt: {
                                edges: [
                                    {
                                        node: {
                                            Service_Level_Agreement__r: {
                                                Id: 'm01xx000003GccdAAC',
                                                Label: {
                                                    value: 'Level 0',
                                                },
                                                Response_in_Hours__c: {
                                                    value: 4,
                                                },
                                            },
                                        },
                                    },
                                    {
                                        node: {
                                            Service_Level_Agreement__r: {
                                                Id: 'm01xx000003GceFAAS',
                                                Label: {
                                                    value: 'Level 1',
                                                },
                                                Response_in_Hours__c: {
                                                    value: 8,
                                                },
                                            },
                                        },
                                    },
                                    {
                                        node: {
                                            Service_Level_Agreement__r: {
                                                Id: 'm01xx000003GchTAAS',
                                                Label: {
                                                    value: 'Level 3',
                                                },
                                                Response_in_Hours__c: {
                                                    value: 72,
                                                },
                                            },
                                        },
                                    },
                                ],
                            },
                        },
                    },
                },
                errors: [],
            };

            mockGraphqlNetwork(
                {
                    query: expectedQuerySLA,
                    variables: {},
                },
                mockSLA
            );

            const graphqlConfigSLA = {
                query: astSLA,
                variables: {},
            };

            const snapshotSLA = await graphQLImperative(graphqlConfigSLA);
            expect(snapshotSLA.data).toEqualSnapshotWithoutEtags(expectedDataSLA);

            const astCached = parseQuery(/* GraphQL */ `
                query getSupportTiers {
                    uiapi {
                        query {
                            Support_Tier__mdt(orderBy: { Label: { order: ASC } }) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        Id
                                        Label {
                                            value
                                        }
                                        Service_Level_Agreement__r @resource(type: "Record") {
                                            Id
                                            Label {
                                                value
                                            }
                                            Response_in_Hours__c {
                                                value
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            `);

            const expectedDataCached = {
                data: {
                    uiapi: {
                        query: {
                            Support_Tier__mdt: {
                                edges: [
                                    {
                                        node: {
                                            Id: 'm00xx000000bqDVAAY',
                                            Label: {
                                                value: 'Tier 0',
                                            },
                                            Service_Level_Agreement__r: {
                                                Id: 'm01xx000003GccdAAC',
                                                Label: {
                                                    value: 'Level 0',
                                                },
                                                Response_in_Hours__c: {
                                                    value: 4,
                                                },
                                            },
                                        },
                                    },
                                    {
                                        node: {
                                            Id: 'm00xx000000bqF7AAI',
                                            Label: {
                                                value: 'Tier 1',
                                            },
                                            Service_Level_Agreement__r: {
                                                Id: 'm01xx000003GceFAAS',
                                                Label: {
                                                    value: 'Level 1',
                                                },
                                                Response_in_Hours__c: {
                                                    value: 8,
                                                },
                                            },
                                        },
                                    },
                                    {
                                        node: {
                                            Id: 'm00xx000000bqGjAAI',
                                            Label: {
                                                value: 'Tier 2',
                                            },
                                            Service_Level_Agreement__r: {
                                                Id: 'm01xx000003GchTAAS',
                                                Label: {
                                                    value: 'Level 3',
                                                },
                                                Response_in_Hours__c: {
                                                    value: 72,
                                                },
                                            },
                                        },
                                    },
                                ],
                            },
                        },
                    },
                },
                errors: [],
            };

            const graphqlConfigCached = {
                query: astCached,
                variables: {},
            };

            const snapshotCached = await graphQLImperative(graphqlConfigCached);
            expect(snapshotCached.data).toEqualSnapshotWithoutEtags(expectedDataCached);
        });
    });
});
