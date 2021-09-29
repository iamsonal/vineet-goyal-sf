import {
    buildMockNetworkAdapter,
    buildSuccessMockPayload,
    MockPayload,
} from '@luvio/adapter-test-library';
import { Environment, Luvio, Store } from '@luvio/engine';
import parseAndVisit from '@salesforce/lds-graphql-parser';
import { graphQLAdapterFactory } from '../../../main';
import { apiFamilyName, representationName } from '../../../util/adapter';

import mockData_Account_fields_Name from './data/RecordQuery-Account-fields-Name.json';

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
            expect(cacheKeys).toContain(`${apiFamilyName}::${representationName}`);
        });
    });
});
