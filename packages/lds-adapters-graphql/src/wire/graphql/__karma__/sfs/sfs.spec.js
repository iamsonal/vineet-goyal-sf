import { getMock as globalGetMock } from 'test-util';
import { mockGraphqlNetwork, parseQuery } from 'graphql-test-util';
import { graphQLImperative } from 'lds-adapters-graphql';

const MOCK_PREFIX = 'wire/graphql/__karma__/sfs/data/';

function getMock(filename) {
    return globalGetMock(MOCK_PREFIX + filename);
}

/**
 * Note: for graphql adapter, karma tests don't have strict assertion on
 * the query format in the resource request. To verify query serialization,
 * using jest tests instead.
 */

describe('sfs gql queries', () => {
    it('should resolve generated query correctly', async () => {
        const ast = parseQuery(/* GraphQL */ `
            query serviceAppointmentsAssignedToMe {
                uiapi {
                    query {
                        ServiceAppointment(
                            orderBy: {
                                AppointmentNumber: { order: ASC, nulls: FIRST }
                                Id: { order: ASC, nulls: FIRST }
                            }
                            first: 1000
                            where: {
                                SchedStartTime: { gte: { range: { last_n_months: 4 } } }
                                and: { SchedEndTime: { lte: { range: { next_n_months: 4 } } } }
                            }
                        ) @connection {
                            edges {
                                node @resource(type: "Record") {
                                    Id
                                    ParentRecordId {
                                        value
                                        displayValue
                                    }
                                    ParentRecordStatusCategory {
                                        value
                                        displayValue
                                    }
                                    Street {
                                        value
                                        displayValue
                                    }
                                    City {
                                        value
                                        displayValue
                                    }
                                    State {
                                        value
                                        displayValue
                                    }
                                    Country {
                                        value
                                        displayValue
                                    }
                                    PostalCode {
                                        value
                                        displayValue
                                    }
                                    ParentRecordId {
                                        value
                                        displayValue
                                    }
                                    Latitude {
                                        value
                                        displayValue
                                    }
                                    Longitude {
                                        value
                                        displayValue
                                    }
                                    Contact @resource(type: "Record") {
                                        Id
                                        Name {
                                            value
                                            displayValue
                                        }
                                        Title {
                                            value
                                            displayValue
                                        }
                                        PhotoUrl {
                                            value
                                            displayValue
                                        }
                                        Title {
                                            value
                                            displayValue
                                        }
                                        Phone {
                                            value
                                            displayValue
                                        }
                                        Email {
                                            value
                                            displayValue
                                        }
                                        MobilePhone {
                                            value
                                            displayValue
                                        }
                                    }
                                    AppointmentNumber {
                                        value
                                        displayValue
                                    }
                                    Subject {
                                        value
                                        displayValue
                                    }
                                    Description {
                                        value
                                        displayValue
                                    }
                                    Status {
                                        value
                                        displayValue
                                    }
                                    SchedStartTime {
                                        value
                                        displayValue
                                    }
                                    SchedEndTime {
                                        value
                                        displayValue
                                    }
                                    CreatedDate {
                                        value
                                        displayValue
                                    }
                                    LastModifiedDate {
                                        value
                                        displayValue
                                    }
                                    SystemModstamp {
                                        value
                                        displayValue
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `);

        const expectedQuery = /* GraphQL */ `
            query serviceAppointmentsAssignedToMe {
                __typename
                uiapi {
                    __typename
                    query {
                        __typename
                        ServiceAppointment(
                            orderBy: {
                                AppointmentNumber: { order: ASC, nulls: FIRST }
                                Id: { order: ASC, nulls: FIRST }
                            }
                            first: 1000
                            where: {
                                SchedStartTime: { gte: { range: { last_n_months: 4 } } }
                                and: { SchedEndTime: { lte: { range: { next_n_months: 4 } } } }
                            }
                        ) {
                            __typename
                            edges {
                                __typename
                                node {
                                    Id
                                    ParentRecordId {
                                        __typename
                                        value
                                        displayValue
                                    }
                                    ParentRecordStatusCategory {
                                        __typename
                                        value
                                        displayValue
                                    }
                                    Street {
                                        __typename
                                        value
                                        displayValue
                                    }
                                    City {
                                        __typename
                                        value
                                        displayValue
                                    }
                                    State {
                                        __typename
                                        value
                                        displayValue
                                    }
                                    Country {
                                        __typename
                                        value
                                        displayValue
                                    }
                                    PostalCode {
                                        __typename
                                        value
                                        displayValue
                                    }
                                    ParentRecordId {
                                        __typename
                                        value
                                        displayValue
                                    }
                                    Latitude {
                                        __typename
                                        value
                                        displayValue
                                    }
                                    Longitude {
                                        __typename
                                        value
                                        displayValue
                                    }
                                    Contact {
                                        Id
                                        Name {
                                            __typename
                                            value
                                            displayValue
                                        }
                                        Title {
                                            __typename
                                            value
                                            displayValue
                                        }
                                        PhotoUrl {
                                            __typename
                                            value
                                            displayValue
                                        }
                                        Title {
                                            __typename
                                            value
                                            displayValue
                                        }
                                        Phone {
                                            __typename
                                            value
                                            displayValue
                                        }
                                        Email {
                                            __typename
                                            value
                                            displayValue
                                        }
                                        MobilePhone {
                                            __typename
                                            value
                                            displayValue
                                        }
                                        ...defaultRecordFields
                                    }
                                    AppointmentNumber {
                                        __typename
                                        value
                                        displayValue
                                    }
                                    Subject {
                                        __typename
                                        value
                                        displayValue
                                    }
                                    Description {
                                        __typename
                                        value
                                        displayValue
                                    }
                                    Status {
                                        __typename
                                        value
                                        displayValue
                                    }
                                    SchedStartTime {
                                        __typename
                                        value
                                        displayValue
                                    }
                                    SchedEndTime {
                                        __typename
                                        value
                                        displayValue
                                    }
                                    CreatedDate {
                                        __typename
                                        value
                                        displayValue
                                    }
                                    LastModifiedDate {
                                        __typename
                                        value
                                        displayValue
                                    }
                                    SystemModstamp {
                                        __typename
                                        value
                                        displayValue
                                    }
                                    ...defaultRecordFields
                                }
                            }
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

        const mock = getMock('RecordQuery-ServiceAppointment-generated');

        const expectedData = {
            data: {
                uiapi: {
                    query: {
                        ServiceAppointment: {
                            edges: [
                                {
                                    node: {
                                        Id: '08pRM0000004sJLYAY',
                                        ParentRecordId: {
                                            value: '001RM000004uuhnYAA',
                                            displayValue: null,
                                        },
                                        ParentRecordStatusCategory: {
                                            value: null,
                                            displayValue: null,
                                        },
                                        Street: {
                                            value: null,
                                            displayValue: null,
                                        },
                                        City: {
                                            value: null,
                                            displayValue: null,
                                        },
                                        State: {
                                            value: null,
                                            displayValue: null,
                                        },
                                        Country: {
                                            value: null,
                                            displayValue: null,
                                        },
                                        PostalCode: {
                                            value: null,
                                            displayValue: null,
                                        },
                                        Latitude: {
                                            value: null,
                                            displayValue: null,
                                        },
                                        Longitude: {
                                            value: null,
                                            displayValue: null,
                                        },
                                        Contact: null,
                                        AppointmentNumber: {
                                            value: 'SA-0002',
                                            displayValue: null,
                                        },
                                        Subject: {
                                            value: null,
                                            displayValue: null,
                                        },
                                        Description: {
                                            value: 'Test Service Appointment',
                                            displayValue: null,
                                        },
                                        Status: {
                                            value: 'Scheduled',
                                            displayValue: 'Scheduled',
                                        },
                                        SchedStartTime: {
                                            value: '2021-06-14T19:00:00.000Z',
                                            displayValue: '6/14/2021, 12:00 PM',
                                        },
                                        SchedEndTime: {
                                            value: '2021-06-16T19:00:00.000Z',
                                            displayValue: '6/16/2021, 12:00 PM',
                                        },
                                        CreatedDate: {
                                            value: '2021-06-11T17:00:12.000Z',
                                            displayValue: '6/11/2021, 10:00 AM',
                                        },
                                        LastModifiedDate: {
                                            value: '2021-06-11T17:00:12.000Z',
                                            displayValue: '6/11/2021, 10:00 AM',
                                        },
                                        SystemModstamp: {
                                            value: '2021-06-11T17:00:12.000Z',
                                            displayValue: '6/11/2021, 10:00 AM',
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

    it('should be a CACHE HIT if query is executed twice', async () => {
        const ast = parseQuery(/* GraphQL */ `
            query serviceAppointmentsAssignedToMe {
                uiapi {
                    query {
                        ServiceAppointment(
                            orderBy: {
                                AppointmentNumber: { order: ASC, nulls: FIRST }
                                Id: { order: ASC, nulls: FIRST }
                            }
                            first: 1000
                            where: {
                                SchedStartTime: { gte: { range: { last_n_months: 4 } } }
                                and: { SchedEndTime: { lte: { range: { next_n_months: 4 } } } }
                            }
                        ) @connection {
                            edges {
                                node @resource(type: "Record") {
                                    Id
                                    ParentRecordId {
                                        value
                                        displayValue
                                    }
                                    ParentRecordStatusCategory {
                                        value
                                        displayValue
                                    }
                                    Street {
                                        value
                                        displayValue
                                    }
                                    City {
                                        value
                                        displayValue
                                    }
                                    State {
                                        value
                                        displayValue
                                    }
                                    Country {
                                        value
                                        displayValue
                                    }
                                    PostalCode {
                                        value
                                        displayValue
                                    }
                                    ParentRecordId {
                                        value
                                        displayValue
                                    }
                                    Latitude {
                                        value
                                        displayValue
                                    }
                                    Longitude {
                                        value
                                        displayValue
                                    }
                                    Contact @resource(type: "Record") {
                                        Id
                                        Name {
                                            value
                                            displayValue
                                        }
                                        Title {
                                            value
                                            displayValue
                                        }
                                        PhotoUrl {
                                            value
                                            displayValue
                                        }
                                        Title {
                                            value
                                            displayValue
                                        }
                                        Phone {
                                            value
                                            displayValue
                                        }
                                        Email {
                                            value
                                            displayValue
                                        }
                                        MobilePhone {
                                            value
                                            displayValue
                                        }
                                    }
                                    AppointmentNumber {
                                        value
                                        displayValue
                                    }
                                    Subject {
                                        value
                                        displayValue
                                    }
                                    Description {
                                        value
                                        displayValue
                                    }
                                    Status {
                                        value
                                        displayValue
                                    }
                                    SchedStartTime {
                                        value
                                        displayValue
                                    }
                                    SchedEndTime {
                                        value
                                        displayValue
                                    }
                                    CreatedDate {
                                        value
                                        displayValue
                                    }
                                    LastModifiedDate {
                                        value
                                        displayValue
                                    }
                                    SystemModstamp {
                                        value
                                        displayValue
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `);

        const expectedQuery = /* GraphQL */ `
            query serviceAppointmentsAssignedToMe {
                __typename
                uiapi {
                    __typename
                    query {
                        __typename
                        ServiceAppointment(
                            orderBy: {
                                AppointmentNumber: { order: ASC, nulls: FIRST }
                                Id: { order: ASC, nulls: FIRST }
                            }
                            first: 1000
                            where: {
                                SchedStartTime: { gte: { range: { last_n_months: 4 } } }
                                and: { SchedEndTime: { lte: { range: { next_n_months: 4 } } } }
                            }
                        ) {
                            __typename
                            edges {
                                __typename
                                node {
                                    Id
                                    ParentRecordId {
                                        __typename
                                        value
                                        displayValue
                                    }
                                    ParentRecordStatusCategory {
                                        __typename
                                        value
                                        displayValue
                                    }
                                    Street {
                                        __typename
                                        value
                                        displayValue
                                    }
                                    City {
                                        __typename
                                        value
                                        displayValue
                                    }
                                    State {
                                        __typename
                                        value
                                        displayValue
                                    }
                                    Country {
                                        __typename
                                        value
                                        displayValue
                                    }
                                    PostalCode {
                                        __typename
                                        value
                                        displayValue
                                    }
                                    ParentRecordId {
                                        __typename
                                        value
                                        displayValue
                                    }
                                    Latitude {
                                        __typename
                                        value
                                        displayValue
                                    }
                                    Longitude {
                                        __typename
                                        value
                                        displayValue
                                    }
                                    Contact {
                                        Id
                                        Name {
                                            __typename
                                            value
                                            displayValue
                                        }
                                        Title {
                                            __typename
                                            value
                                            displayValue
                                        }
                                        PhotoUrl {
                                            __typename
                                            value
                                            displayValue
                                        }
                                        Title {
                                            __typename
                                            value
                                            displayValue
                                        }
                                        Phone {
                                            __typename
                                            value
                                            displayValue
                                        }
                                        Email {
                                            __typename
                                            value
                                            displayValue
                                        }
                                        MobilePhone {
                                            __typename
                                            value
                                            displayValue
                                        }
                                        ...defaultRecordFields
                                    }
                                    AppointmentNumber {
                                        __typename
                                        value
                                        displayValue
                                    }
                                    Subject {
                                        __typename
                                        value
                                        displayValue
                                    }
                                    Description {
                                        __typename
                                        value
                                        displayValue
                                    }
                                    Status {
                                        __typename
                                        value
                                        displayValue
                                    }
                                    SchedStartTime {
                                        __typename
                                        value
                                        displayValue
                                    }
                                    SchedEndTime {
                                        __typename
                                        value
                                        displayValue
                                    }
                                    CreatedDate {
                                        __typename
                                        value
                                        displayValue
                                    }
                                    LastModifiedDate {
                                        __typename
                                        value
                                        displayValue
                                    }
                                    SystemModstamp {
                                        __typename
                                        value
                                        displayValue
                                    }
                                    ...defaultRecordFields
                                }
                            }
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

        const mock = getMock('RecordQuery-ServiceAppointment-generated');

        const expectedData = {
            data: {
                uiapi: {
                    query: {
                        ServiceAppointment: {
                            edges: [
                                {
                                    node: {
                                        Id: '08pRM0000004sJLYAY',
                                        ParentRecordId: {
                                            value: '001RM000004uuhnYAA',
                                            displayValue: null,
                                        },
                                        ParentRecordStatusCategory: {
                                            value: null,
                                            displayValue: null,
                                        },
                                        Street: {
                                            value: null,
                                            displayValue: null,
                                        },
                                        City: {
                                            value: null,
                                            displayValue: null,
                                        },
                                        State: {
                                            value: null,
                                            displayValue: null,
                                        },
                                        Country: {
                                            value: null,
                                            displayValue: null,
                                        },
                                        PostalCode: {
                                            value: null,
                                            displayValue: null,
                                        },
                                        Latitude: {
                                            value: null,
                                            displayValue: null,
                                        },
                                        Longitude: {
                                            value: null,
                                            displayValue: null,
                                        },
                                        Contact: null,
                                        AppointmentNumber: {
                                            value: 'SA-0002',
                                            displayValue: null,
                                        },
                                        Subject: {
                                            value: null,
                                            displayValue: null,
                                        },
                                        Description: {
                                            value: 'Test Service Appointment',
                                            displayValue: null,
                                        },
                                        Status: {
                                            value: 'Scheduled',
                                            displayValue: 'Scheduled',
                                        },
                                        SchedStartTime: {
                                            value: '2021-06-14T19:00:00.000Z',
                                            displayValue: '6/14/2021, 12:00 PM',
                                        },
                                        SchedEndTime: {
                                            value: '2021-06-16T19:00:00.000Z',
                                            displayValue: '6/16/2021, 12:00 PM',
                                        },
                                        CreatedDate: {
                                            value: '2021-06-11T17:00:12.000Z',
                                            displayValue: '6/11/2021, 10:00 AM',
                                        },
                                        LastModifiedDate: {
                                            value: '2021-06-11T17:00:12.000Z',
                                            displayValue: '6/11/2021, 10:00 AM',
                                        },
                                        SystemModstamp: {
                                            value: '2021-06-11T17:00:12.000Z',
                                            displayValue: '6/11/2021, 10:00 AM',
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

        const secondSnapshot = await graphQLImperative(graphqlConfig);
        expect(snapshot.data).toEqualSnapshotWithoutEtags(secondSnapshot.data);
    });

    describe('ResourceAbsence', () => {
        it('should resolve query correctly', async () => {
            const ast = parseQuery(/* GraphQL */ `
                {
                    uiapi {
                        query {
                            ResourceAbsence(
                                where: { ResourceId: { eq: "0HnRM0000000FaJ0AU" } }
                                orderBy: { Start: { order: DESC } }
                                first: 10
                            ) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        Start {
                                            value
                                        }
                                        End {
                                            value
                                        }
                                        ResourceId {
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
                query {
                    __typename
                    uiapi {
                        __typename
                        query {
                            __typename
                            ResourceAbsence(
                                where: { ResourceId: { eq: "0HnRM0000000FaJ0AU" } }
                                orderBy: { Start: { order: DESC } }
                                first: 10
                            ) {
                                __typename
                                edges {
                                    __typename
                                    node {
                                        Start {
                                            __typename
                                            value
                                            displayValue
                                        }
                                        End {
                                            __typename
                                            value
                                            displayValue
                                        }
                                        ResourceId {
                                            __typename
                                            value
                                            displayValue
                                        }
                                        ...defaultRecordFields
                                    }
                                }
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

            const mock = getMock('RecordQuery-ResourceAbsence');

            const expectedData = {
                data: {
                    uiapi: {
                        query: {
                            ResourceAbsence: {
                                edges: [
                                    {
                                        node: {
                                            Start: {
                                                value: '2021-06-15T19:00:00.000Z',
                                            },
                                            End: {
                                                value: '2021-06-22T19:00:00.000Z',
                                            },
                                            ResourceId: {
                                                value: '0HnRM0000000FaJ0AU',
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

        it('should be a CACHE HIT if query executed twice', async () => {
            const ast = parseQuery(/* GraphQL */ `
                {
                    uiapi {
                        query {
                            ResourceAbsence(
                                where: { ResourceId: { eq: "0HnRM0000000FaJ0AU" } }
                                orderBy: { Start: { order: DESC } }
                                first: 10
                            ) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        Start {
                                            value
                                        }
                                        End {
                                            value
                                        }
                                        ResourceId {
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
                query {
                    __typename
                    uiapi {
                        __typename
                        query {
                            __typename
                            ResourceAbsence(
                                where: { ResourceId: { eq: "0HnRM0000000FaJ0AU" } }
                                orderBy: { Start: { order: DESC } }
                                first: 10
                            ) {
                                __typename
                                edges {
                                    __typename
                                    node {
                                        Start {
                                            __typename
                                            value
                                            displayValue
                                        }
                                        End {
                                            __typename
                                            value
                                            displayValue
                                        }
                                        ResourceId {
                                            __typename
                                            value
                                            displayValue
                                        }
                                        ...defaultRecordFields
                                    }
                                }
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

            const mock = getMock('RecordQuery-ResourceAbsence');

            const expectedData = {
                data: {
                    uiapi: {
                        query: {
                            ResourceAbsence: {
                                edges: [
                                    {
                                        node: {
                                            Start: {
                                                value: '2021-06-15T19:00:00.000Z',
                                            },
                                            End: {
                                                value: '2021-06-22T19:00:00.000Z',
                                            },
                                            ResourceId: {
                                                value: '0HnRM0000000FaJ0AU',
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

            const secondSnapshot = graphQLImperative(graphqlConfig);
            expect(snapshot.data).toEqualSnapshotWithoutEtags(secondSnapshot.data);
        });

        it('shuld resolve data in cache correctly', async () => {
            const ast = parseQuery(/* GraphQL */ `
                query {
                    uiapi {
                        query {
                            ServiceTerritoryLocation(
                                orderBy: { LastModifiedDate: { order: DESC } }
                                first: 10
                                where: {
                                    Location: {
                                        IsMobile: { eq: false }
                                        IsInventoryLocation: { eq: false }
                                    }
                                    and: { ServiceTerritoryId: { in: ["0HhRM0000000GLM0A2"] } }
                                }
                            ) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        Id
                                    }
                                }
                            }
                        }
                    }
                }
            `);

            const expectedQuery = /* GraphQL */ `
                query {
                    __typename
                    uiapi {
                        __typename
                        query {
                            __typename
                            ServiceTerritoryLocation(
                                orderBy: { LastModifiedDate: { order: DESC } }
                                first: 10
                                where: {
                                    Location: {
                                        IsMobile: { eq: false }
                                        IsInventoryLocation: { eq: false }
                                    }
                                    and: { ServiceTerritoryId: { in: ["0HhRM0000000GLM0A2"] } }
                                }
                            ) {
                                __typename
                                edges {
                                    __typename
                                    node {
                                        Id
                                        ...defaultRecordFields
                                    }
                                }
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

            const mock = getMock('RecordQuery-ServiceTerritoryLocation');
            const expectedData = {
                data: {
                    uiapi: {
                        query: {
                            ServiceTerritoryLocation: {
                                edges: [
                                    {
                                        node: {
                                            Id: '1SlRM00000000YB0AY',
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

            const secondSnapshot = graphQLImperative(graphqlConfig);
            expect(secondSnapshot.data).toEqualSnapshotWithoutEtags(secondSnapshot.data);
        });

        it('shuld resolve data in cache correctly if arguments are in different order', async () => {
            const ast = parseQuery(/* GraphQL */ `
                query {
                    uiapi {
                        query {
                            ServiceTerritoryLocation(
                                orderBy: { LastModifiedDate: { order: DESC } }
                                first: 10
                                where: {
                                    Location: {
                                        IsMobile: { eq: false }
                                        IsInventoryLocation: { eq: false }
                                    }
                                    and: { ServiceTerritoryId: { in: ["0HhRM0000000GLM0A2"] } }
                                }
                            ) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        Id
                                    }
                                }
                            }
                        }
                    }
                }
            `);

            const modifiedAst = parseQuery(/* GraphQL */ `
                query {
                    uiapi {
                        query {
                            ServiceTerritoryLocation(
                                where: {
                                    Location: {
                                        IsInventoryLocation: { eq: false }
                                        IsMobile: { eq: false }
                                    }
                                    and: { ServiceTerritoryId: { in: ["0HhRM0000000GLM0A2"] } }
                                }
                                orderBy: { LastModifiedDate: { order: DESC } }
                                first: 10
                            ) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        Id
                                    }
                                }
                            }
                        }
                    }
                }
            `);

            const expectedQuery = /* GraphQL */ `
                query {
                    __typename
                    uiapi {
                        __typename
                        query {
                            __typename
                            ServiceTerritoryLocation(
                                orderBy: { LastModifiedDate: { order: DESC } }
                                first: 10
                                where: {
                                    Location: {
                                        IsMobile: { eq: false }
                                        IsInventoryLocation: { eq: false }
                                    }
                                    and: { ServiceTerritoryId: { in: ["0HhRM0000000GLM0A2"] } }
                                }
                            ) {
                                __typename
                                edges {
                                    __typename
                                    node {
                                        Id
                                        ...defaultRecordFields
                                    }
                                }
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

            const mock = getMock('RecordQuery-ServiceTerritoryLocation');
            const expectedData = {
                data: {
                    uiapi: {
                        query: {
                            ServiceTerritoryLocation: {
                                edges: [
                                    {
                                        node: {
                                            Id: '1SlRM00000000YB0AY',
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

            const secondSnapshot = graphQLImperative({
                query: modifiedAst,
                variables: {},
            });
            expect(secondSnapshot.data).toEqualSnapshotWithoutEtags(secondSnapshot.data);
        });
    });

    describe('query with IN statement', () => {
        it('shuld resolve data correctly', async () => {
            const ast = parseQuery(/* GraphQL */ `
                query {
                    uiapi {
                        query {
                            ServiceTerritoryLocation(
                                orderBy: { LastModifiedDate: { order: DESC } }
                                first: 10
                                where: {
                                    Location: {
                                        IsMobile: { eq: false }
                                        IsInventoryLocation: { eq: false }
                                    }
                                    and: { ServiceTerritoryId: { in: ["0HhRM0000000GLM0A2"] } }
                                }
                            ) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        Id
                                    }
                                }
                            }
                        }
                    }
                }
            `);

            const expectedQuery = /* GraphQL */ `
                query {
                    __typename
                    uiapi {
                        __typename
                        query {
                            __typename
                            ServiceTerritoryLocation(
                                orderBy: { LastModifiedDate: { order: DESC } }
                                first: 10
                                where: {
                                    Location: {
                                        IsMobile: { eq: false }
                                        IsInventoryLocation: { eq: false }
                                    }
                                    and: { ServiceTerritoryId: { in: ["0HhRM0000000GLM0A2"] } }
                                }
                            ) {
                                __typename
                                edges {
                                    __typename
                                    node {
                                        Id
                                        ...defaultRecordFields
                                    }
                                }
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

            const mock = getMock('RecordQuery-ServiceTerritoryLocation');
            const expectedData = {
                data: {
                    uiapi: {
                        query: {
                            ServiceTerritoryLocation: {
                                edges: [
                                    {
                                        node: {
                                            Id: '1SlRM00000000YB0AY',
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

        it('shuld resolve data in cache correctly', async () => {
            const ast = parseQuery(/* GraphQL */ `
                query {
                    uiapi {
                        query {
                            ServiceTerritoryLocation(
                                orderBy: { LastModifiedDate: { order: DESC } }
                                first: 10
                                where: {
                                    Location: {
                                        IsMobile: { eq: false }
                                        IsInventoryLocation: { eq: false }
                                    }
                                    and: { ServiceTerritoryId: { in: ["0HhRM0000000GLM0A2"] } }
                                }
                            ) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        Id
                                    }
                                }
                            }
                        }
                    }
                }
            `);

            const expectedQuery = /* GraphQL */ `
                query {
                    __typename
                    uiapi {
                        __typename
                        query {
                            __typename
                            ServiceTerritoryLocation(
                                orderBy: { LastModifiedDate: { order: DESC } }
                                first: 10
                                where: {
                                    Location: {
                                        IsMobile: { eq: false }
                                        IsInventoryLocation: { eq: false }
                                    }
                                    and: { ServiceTerritoryId: { in: ["0HhRM0000000GLM0A2"] } }
                                }
                            ) {
                                __typename
                                edges {
                                    __typename
                                    node {
                                        Id
                                        ...defaultRecordFields
                                    }
                                }
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

            const mock = getMock('RecordQuery-ServiceTerritoryLocation');
            const expectedData = {
                data: {
                    uiapi: {
                        query: {
                            ServiceTerritoryLocation: {
                                edges: [
                                    {
                                        node: {
                                            Id: '1SlRM00000000YB0AY',
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

            const secondSnapshot = graphQLImperative(graphqlConfig);
            expect(secondSnapshot.data).toEqualSnapshotWithoutEtags(secondSnapshot.data);
        });

        it('shuld resolve data in cache correctly if arguments are in different order', async () => {
            const ast = parseQuery(/* GraphQL */ `
                query {
                    uiapi {
                        query {
                            ServiceTerritoryLocation(
                                orderBy: { LastModifiedDate: { order: DESC } }
                                first: 10
                                where: {
                                    Location: {
                                        IsMobile: { eq: false }
                                        IsInventoryLocation: { eq: false }
                                    }
                                    and: { ServiceTerritoryId: { in: ["0HhRM0000000GLM0A2"] } }
                                }
                            ) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        Id
                                    }
                                }
                            }
                        }
                    }
                }
            `);

            const modifiedAst = parseQuery(/* GraphQL */ `
                query {
                    uiapi {
                        query {
                            ServiceTerritoryLocation(
                                where: {
                                    Location: {
                                        IsInventoryLocation: { eq: false }
                                        IsMobile: { eq: false }
                                    }
                                    and: { ServiceTerritoryId: { in: ["0HhRM0000000GLM0A2"] } }
                                }
                                orderBy: { LastModifiedDate: { order: DESC } }
                                first: 10
                            ) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        Id
                                    }
                                }
                            }
                        }
                    }
                }
            `);

            const expectedQuery = /* GraphQL */ `
                query {
                    __typename
                    uiapi {
                        __typename
                        query {
                            __typename
                            ServiceTerritoryLocation(
                                orderBy: { LastModifiedDate: { order: DESC } }
                                first: 10
                                where: {
                                    Location: {
                                        IsMobile: { eq: false }
                                        IsInventoryLocation: { eq: false }
                                    }
                                    and: { ServiceTerritoryId: { in: ["0HhRM0000000GLM0A2"] } }
                                }
                            ) {
                                __typename
                                edges {
                                    __typename
                                    node {
                                        Id
                                        ...defaultRecordFields
                                    }
                                }
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

            const mock = getMock('RecordQuery-ServiceTerritoryLocation');
            const expectedData = {
                data: {
                    uiapi: {
                        query: {
                            ServiceTerritoryLocation: {
                                edges: [
                                    {
                                        node: {
                                            Id: '1SlRM00000000YB0AY',
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

            const secondSnapshot = graphQLImperative({
                query: modifiedAst,
                variables: {},
            });
            expect(secondSnapshot.data).toEqualSnapshotWithoutEtags(secondSnapshot.data);
        });
    });

    describe('FieldServiceOrgSettings', () => {
        it('should resolve query with no arguments correctly', async () => {
            const ast = parseQuery(/* GraphQL */ `
                query {
                    uiapi {
                        query {
                            FieldServiceOrgSettings @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        Id
                                    }
                                }
                            }
                        }
                    }
                }
            `);

            const expectedQuery = /* GraphQL */ `
                query {
                    __typename
                    uiapi {
                        __typename
                        query {
                            __typename
                            FieldServiceOrgSettings {
                                __typename
                                edges {
                                    __typename
                                    node {
                                        Id
                                        ...defaultRecordFields
                                    }
                                }
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

            const mock = getMock('RecordQuery-FieldServiceOrgSettings-id');
            const expectedData = {
                data: {
                    uiapi: {
                        query: {
                            FieldServiceOrgSettings: {
                                edges: [
                                    {
                                        node: {
                                            Id: '0UJx00000000001GAA',
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

        it('should resolve query for first 2000 items', async () => {
            const ast = parseQuery(/* GraphQL */ `
                query {
                    uiapi {
                        query {
                            FieldServiceOrgSettings(first: 2000) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        Id
                                    }
                                }
                            }
                        }
                    }
                }
            `);

            const expectedQuery = /* GraphQL */ `
                query {
                    __typename
                    uiapi {
                        __typename
                        query {
                            __typename
                            FieldServiceOrgSettings(first: 2000) {
                                __typename
                                edges {
                                    __typename
                                    node {
                                        Id
                                        ...defaultRecordFields
                                    }
                                }
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

            const mock = getMock('RecordQuery-FieldServiceOrgSettings-first-2000-id');
            const expectedData = {
                data: {
                    uiapi: {
                        query: {
                            FieldServiceOrgSettings: {
                                edges: [
                                    {
                                        node: {
                                            Id: '0UJx00000000001GAA',
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
    });
});
