import {
    buildMockNetworkAdapter,
    buildSuccessMockPayload,
    MockPayload,
} from '@luvio/adapter-test-library';
import { Environment, Luvio, Store } from '@luvio/engine';
import { parseAndVisit } from '@luvio/graphql-parser';
import { graphQLAdapterFactory, configuration, buildCachedSnapshot } from '../../../main';
import { namespace, representationName } from '../../../util/adapter';
import timekeeper from 'timekeeper';

import mockData_Account_fields_Name from './data/RecordQuery-Account-fields-Name.json';

beforeEach(() => {
    timekeeper.reset();
});

describe('graphQL adapter', () => {
    const setup = () => {
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

        const expectedSnapshotData = {
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
        };

        const config = {
            query: ast,
            variables: {},
        };

        const requestArgs: MockPayload['networkArgs'] = {
            method: 'post',
            basePath: `/graphql`,
        };

        const store = new Store();
        const network = buildMockNetworkAdapter([
            buildSuccessMockPayload(requestArgs, mockData_Account_fields_Name),
        ]);
        const luvio = new Luvio(new Environment(store, network));

        const adapter = graphQLAdapterFactory(luvio);

        return {
            adapter,
            luvio,
            store,
            network,
            config,
            expectedSnapshotData,
        };
    };

    describe('cache keys', () => {
        it('start with apiFamilyName plus representationName', async () => {
            const { adapter, store, config } = setup();

            await adapter(config);

            const cacheKeys = Object.keys(store.records);

            // verify the root key is there and is composed properly
            expect(cacheKeys).toContain(`${namespace}::${representationName}`);
        });
    });

    describe('metadata', () => {
        it('should publish metadata for all pieces of the query', async () => {
            timekeeper.freeze(100);
            const { adapter, store, config } = setup();
            await adapter(config);

            expect(store.metadata).toMatchInlineSnapshot(`
                Object {
                  "GraphQL::Connection:Account(where:{Name:{like:\\"Account1\\"}})": Object {
                    "expirationTimestamp": 30100,
                    "ingestionTimestamp": 100,
                    "namespace": "GraphQL",
                    "representationName": "AccountConnection",
                  },
                  "GraphQL::Connection:Account(where:{Name:{like:\\"Account1\\"}})__edges__0": Object {
                    "expirationTimestamp": 30100,
                    "ingestionTimestamp": 100,
                    "namespace": "GraphQL",
                    "representationName": "AccountEdge",
                  },
                  "GraphQL::graphql": Object {
                    "expirationTimestamp": 30100,
                    "ingestionTimestamp": 100,
                    "namespace": "GraphQL",
                    "representationName": "Query",
                  },
                  "GraphQL::graphql__uiapi": Object {
                    "expirationTimestamp": 30100,
                    "ingestionTimestamp": 100,
                    "namespace": "GraphQL",
                    "representationName": "UIAPI",
                  },
                  "GraphQL::graphql__uiapi__query": Object {
                    "expirationTimestamp": 30100,
                    "ingestionTimestamp": 100,
                    "namespace": "GraphQL",
                    "representationName": "RecordQuery",
                  },
                  "UiApi::RecordRepresentation:001RM000004uuhnYAA": Object {
                    "expirationTimestamp": 30100,
                    "ingestionTimestamp": 100,
                    "namespace": "UiApi",
                    "representationName": "RecordRepresentation",
                  },
                }
            `);
        });
    });

    describe('buildCachedSnapshot', () => {
        const context: any = { config: { query: {} } };
        it('calls buildInMemorySnapshot when storeEval is undefined', async () => {
            const lookupSpy = jest.fn();
            (lookupSpy as any).ttlStrategy = () => undefined;

            await buildCachedSnapshot(context, lookupSpy);

            expect(lookupSpy).toHaveBeenCalledTimes(1);
        });

        it('does not call buildInMemorySnapshot when storeEval is defined', async () => {
            const storeEval = jest.fn(() => Promise.resolve({ state: 'Fulfilled' } as any));
            const lookupSpy = jest.fn();
            (lookupSpy as any).ttlStrategy = () => undefined;

            configuration.setStoreEval(storeEval);
            await buildCachedSnapshot(context, lookupSpy);

            expect(lookupSpy).toHaveBeenCalledTimes(0);
            expect(storeEval).toHaveBeenCalledTimes(1);
        });

        it('calls buildInMemorySnapshot when storeEval rejects', async () => {
            const storeEval = jest.fn(() => Promise.reject('something bad'));
            const lookupSpy = jest.fn();
            (lookupSpy as any).ttlStrategy = () => undefined;

            configuration.setStoreEval(storeEval);
            await buildCachedSnapshot(context, lookupSpy);

            expect(lookupSpy).toHaveBeenCalledTimes(1);
            expect(storeEval).toHaveBeenCalledTimes(1);
        });
    });
});
