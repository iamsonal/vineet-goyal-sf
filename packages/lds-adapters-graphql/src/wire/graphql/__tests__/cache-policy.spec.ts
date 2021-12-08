import { Environment, Luvio, Store, CachePolicyNoCache } from '@luvio/engine';

import { graphQLAdapterFactory } from '../../../main';
import { parseAndVisit } from '@luvio/graphql-parser';
import {
    buildMockNetworkAdapter,
    buildSuccessMockPayload,
    MockPayload,
} from '@luvio/adapter-test-library';
import mockData_Account_fields_Name from './data/RecordQuery-Account-fields-Name.json';

describe('graphql adapter calls luvio.applyCachePolicy', () => {
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
        const environment = new Environment(store, network);
        const luvio = new Luvio(environment);

        const adapter = graphQLAdapterFactory(luvio);

        return {
            adapter,
            luvio,
            config,
            environment,
        };
    };

    describe('calls luvio.applyCachePolicy', () => {
        it('when caller supplies requestContext', async () => {
            const { adapter, luvio, config } = setup();

            const applyCachePolicySpy = jest.spyOn(luvio, 'applyCachePolicy');

            const cachePolicy: CachePolicyNoCache = { type: 'no-cache' };
            const adapterRequestContext = { cachePolicy };
            await adapter(config, adapterRequestContext);

            expect(applyCachePolicySpy).toHaveBeenCalledTimes(1);
            // ensure the first parameter was the cache policy
            expect(applyCachePolicySpy.mock.calls[0][0]).toEqual(adapterRequestContext);
        });

        it('when caller DOES NOT supply requestContext', async () => {
            const { adapter, luvio, config } = setup();

            const applyCachePolicySpy = jest.spyOn(luvio, 'applyCachePolicy');

            await adapter(config);

            expect(applyCachePolicySpy).toHaveBeenCalledTimes(1);
        });
    });
});
