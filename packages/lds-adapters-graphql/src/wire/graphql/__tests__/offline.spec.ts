import { DefaultDurableSegment } from '@luvio/environments';
import {
    buildMockNetworkAdapter,
    buildSuccessMockPayload,
    getMockNetworkAdapterCallCount,
    MockDurableStore,
    MockPayload,
} from '@luvio/adapter-test-library';
import {
    buildOfflineLuvio,
    populateDurableStore,
    testDurableHitDoesNotHitNetwork,
} from '@salesforce/lds-jest';
import { keyBuilderRecord } from '@salesforce/lds-adapters-uiapi';
import { parseAndVisit } from '@luvio/graphql-parser';

import { graphQLAdapterFactory } from '../../../main';
import { flushPromises } from './test-utils';

import mockData_Account_fields_Name from './data/RecordQuery-Account-fields-Name.json';
import mockData_Account_fields_Name_no_displayValue from './data/RecordQuery-Account-fields-Name-no-displayValue.json';
import mockData_FieldServiceOrgSettings_Id from './data/RecordQuery-FieldServiceOrgSettings-id.json';

import timekeeper from 'timekeeper';

const requestArgs: MockPayload['networkArgs'] = {
    method: 'post',
    basePath: `/graphql`,
};

describe('graphQL adapter offline', () => {
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

            const { luvio, network } = buildOfflineLuvio(
                new MockDurableStore(),
                buildMockNetworkAdapter([
                    buildSuccessMockPayload(requestArgs, mockData_Account_fields_Name),
                ])
            );

            const adapter = graphQLAdapterFactory(luvio);

            const snapshot = await adapter(config);

            const callCount = getMockNetworkAdapterCallCount(network);
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
    });

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

        it('should resolve stale data correctly', async () => {
            const ast = parseAndVisit(/* GraphQL */ `
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

            const config = {
                query: ast,
                variables: {},
            };

            const durableStore = new MockDurableStore();
            const { luvio } = buildOfflineLuvio(
                durableStore,
                buildMockNetworkAdapter([
                    buildSuccessMockPayload(requestArgs, mockData_FieldServiceOrgSettings_Id),
                ])
            );
            const recordId =
                mockData_FieldServiceOrgSettings_Id.data.uiapi.query.FieldServiceOrgSettings
                    .edges[0].node.Id;
            const recordKey = keyBuilderRecord({
                recordId,
            });

            const adapter = graphQLAdapterFactory(luvio);

            // populate it
            await adapter(config);

            const expirationTimestamp = (await durableStore.persistence.get(DefaultDurableSegment))[
                recordKey
            ].metadata.expirationTimestamp;
            timekeeper.travel(expirationTimestamp + 10);
            const result = await adapter(config);

            expect(result.state).toBe('Stale');
            expect(result.data).toEqual({
                data: {
                    uiapi: {
                        query: {
                            FieldServiceOrgSettings: {
                                edges: [
                                    {
                                        node: {
                                            Id: recordId,
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
