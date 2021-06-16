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
                        ) {
                            edges {
                                node {
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
                                    Contact {
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
                                        ...defaultRecordFields
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
                        ) {
                            edges {
                                node {
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
                                    Contact {
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
                                        ...defaultRecordFields
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
});
