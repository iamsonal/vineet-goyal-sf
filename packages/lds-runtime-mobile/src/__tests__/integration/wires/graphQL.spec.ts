import parseAndVisit from '@salesforce/lds-graphql-parser';

import { MockNimbusNetworkAdapter } from '../../MockNimbusNetworkAdapter';
import { JSONStringify } from '../../../utils/language';
import { setup } from './integrationTestSetup';

import mockData_Account_fields_Name from './data/gql/RecordQuery-Account-fields-Name.json';
import mockData_Account_fields_Name_Phone from './data/gql/RecordQuery-Account-fields-Name-Phone.json';
import mockData_Opportunity_fields_Name from './data/gql/RecordQuery-Opportunity-fields-Name.json';
import { flushPromises } from '../../testUtils';

describe('mobile runtime integration tests', () => {
    let networkAdapter: MockNimbusNetworkAdapter;
    let graphQL;

    beforeEach(async () => {
        ({ networkAdapter, graphQL } = await setup());
    });

    describe('graphql', () => {
        describe('L2 cache miss', () => {
            it('should go to network', async () => {
                const ast = parseAndVisit(/* GraphQL */ `
                    query {
                        uiapi {
                            query {
                                Account(where: { Name: { like: "Account1" } }) @connection {
                                    edges {
                                        node @resource(type: "Record") {
                                            Name {
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

                const config = {
                    query: ast,
                    variables: {},
                };

                // Set the mock response
                networkAdapter.setMockResponse({
                    status: 200,
                    headers: {},
                    body: JSONStringify(mockData_Account_fields_Name),
                });

                const snapshot = await graphQL(config);

                const callCount = networkAdapter.sentRequests.length;
                expect(callCount).toBe(1);

                expect(snapshot.data).toEqual({
                    data: {
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
                    },
                    errors: [],
                });
            });

            it('should go to the network once per request for concurrent calls', async () => {
                const ast1 = parseAndVisit(/* GraphQL */ `
                    query {
                        uiapi {
                            query {
                                Account(where: { Name: { like: "Account1" } }) @connection {
                                    edges {
                                        node @resource(type: "Record") {
                                            Name {
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
                const ast2 = parseAndVisit(/* GraphQL */ `
                    query {
                        uiapi {
                            query {
                                Opportunity(where: { Name: { eq: "Opp1" } }) @connection {
                                    edges {
                                        node @resource(type: "Record") {
                                            Name {
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

                const config1 = {
                    query: ast1,
                    variables: {},
                };
                const config2 = {
                    query: ast2,
                    variables: {},
                };

                // Set the mock response
                networkAdapter.setMockResponses([
                    {
                        status: 200,
                        headers: {},
                        body: JSONStringify(mockData_Account_fields_Name),
                    },
                    {
                        status: 200,
                        headers: {},
                        body: JSONStringify(mockData_Opportunity_fields_Name),
                    },
                ]);

                const promise1 = graphQL(config1);
                const promise2 = graphQL(config2);

                const snapshot1 = await promise1;
                const snapshot2 = await promise2;

                const callCount = networkAdapter.sentRequests.length;
                expect(callCount).toBe(2);

                expect(snapshot1.data).toEqual({
                    data: {
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
                    },
                    errors: [],
                });
                expect(snapshot2.data).toEqual({
                    data: {
                        uiapi: {
                            query: {
                                Opportunity: {
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
                                },
                            },
                        },
                    },
                    errors: [],
                });
            });
        });
    });

    describe('L2 cache hit', () => {
        // this test populates the cache with Name field in first request, Phone field
        // from second request, and then the third request for both should be cache
        // hit since each field was individually already put in the cache
        it('when adapter called with a composite of already cached fields', async () => {
            const ast1 = parseAndVisit(/* GraphQL */ `
                query {
                    uiapi {
                        query {
                            Account(where: { Name: { like: "Account1" } }) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        Name {
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

            const config1 = {
                query: ast1,
                variables: {},
            };

            // Set the mock response
            networkAdapter.setMockResponse({
                status: 200,
                headers: {},
                body: JSONStringify(mockData_Account_fields_Name),
            });

            // populate DS by making adapter call
            await graphQL(config1);

            const ast2 = parseAndVisit(/* GraphQL */ `
                query {
                    uiapi {
                        query {
                            Account(where: { Name: { like: "Account1" } }) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        Phone {
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

            const config2 = {
                query: ast2,
                variables: {},
            };

            // Set the mock response
            networkAdapter.setMockResponse({
                status: 200,
                headers: {},
                body: JSONStringify(mockData_Account_fields_Name_Phone),
            });

            await graphQL(config2);

            // now use similar query, but request subset of field properties (just "value")
            const ast3 = parseAndVisit(/* GraphQL */ `
                query {
                    uiapi {
                        query {
                            Account(where: { Name: { like: "Account1" } }) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        Name {
                                            value
                                            displayValue
                                        }
                                        Phone {
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

            const config3 = {
                query: ast3,
                variables: {},
            };

            const result = await graphQL(config3);
            expect(result.state).toBe('Fulfilled');
            expect(result.data).toEqual({
                data: {
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
                                            Phone: {
                                                value: '1234567890',
                                                displayValue: null,
                                            },
                                        },
                                    },
                                ],
                            },
                        },
                    },
                },
                errors: [],
            });

            // 3rd request should have been from DS so only 2 total network requests
            expect(networkAdapter.sentRequests.length).toBe(2);

            // ensure no outstanding promises throw errors
            await flushPromises();
        });
    });
});
