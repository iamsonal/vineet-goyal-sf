import {
    buildMockNetworkAdapter,
    buildSuccessMockPayload,
    getMockNetworkAdapterCallCount,
    MockPayload,
} from '@luvio/adapter-test-library';
import {
    buildOfflineLuvio,
    populateDurableStore,
    testDurableHitDoesNotHitNetwork,
} from '@salesforce/lds-jest';
import parseAndVisit from '@salesforce/lds-graphql-parser';

import { graphQLAdapterFactory } from '../../../main';
import { flushPromises } from './test-utils';

import mockData_Account_fields_Name from './data/RecordQuery-Account-fields-Name.json';
import mockData_Account_fields_Name_no_displayValue from './data/RecordQuery-Account-fields-Name-no-displayValue.json';
import mockData_Account_fields_Phone from './data/RecordQuery-Account-fields-Phone.json';
import mockData_Account_fields_Name_Phone from './data/RecordQuery-Account-fields-Name-Phone.json';

const requestArgs: MockPayload['networkArgs'] = {
    method: 'post',
    basePath: `/graphql`,
};

describe('graphQL adapter offline', () => {
    describe('L2 cache hit', () => {
        it('when adapter called with same query', async () => {
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

            const snapshot = await testDurableHitDoesNotHitNetwork(
                graphQLAdapterFactory,
                config,
                buildSuccessMockPayload(requestArgs, mockData_Account_fields_Name)
            );

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

        it('when adapter called with subset of field properties', async () => {
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

            const durableStore = await populateDurableStore(
                graphQLAdapterFactory,
                config1,
                buildSuccessMockPayload(requestArgs, mockData_Account_fields_Name)
            );
            const { luvio, network } = buildOfflineLuvio(
                durableStore,
                buildMockNetworkAdapter([
                    buildSuccessMockPayload(
                        requestArgs,
                        mockData_Account_fields_Name_no_displayValue
                    ),
                ])
            );
            const adapter = graphQLAdapterFactory(luvio);

            // now use similar query, but request subset of field properties (just "value")
            const ast2 = parseAndVisit(/* GraphQL */ `
                query {
                    uiapi {
                        query {
                            Account(where: { Name: { like: "Account1" } }) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        Name {
                                            value
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

            const result = await adapter(config2);

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

            const callCount = getMockNetworkAdapterCallCount(network);
            expect(callCount).toBe(0);

            // ensure no outstanding promises throw errors
            await flushPromises();
        });

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

            const durableStore = await populateDurableStore(
                graphQLAdapterFactory,
                config1,
                buildSuccessMockPayload(requestArgs, mockData_Account_fields_Name)
            );

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

            await populateDurableStore(
                graphQLAdapterFactory,
                config2,
                buildSuccessMockPayload(requestArgs, mockData_Account_fields_Phone),
                {
                    existingDurableStore: durableStore,
                }
            );

            const { luvio, network } = buildOfflineLuvio(
                durableStore,
                buildMockNetworkAdapter([
                    buildSuccessMockPayload(requestArgs, mockData_Account_fields_Name_Phone),
                ])
            );
            const adapter = graphQLAdapterFactory(luvio);

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

            const result = await adapter(config3);
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

            const callCount = getMockNetworkAdapterCallCount(network);
            expect(callCount).toBe(0);

            // ensure no outstanding promises throw errors
            await flushPromises();
        });
    });
});
