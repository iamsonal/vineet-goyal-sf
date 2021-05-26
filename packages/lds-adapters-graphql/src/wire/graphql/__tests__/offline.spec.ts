import { buildSuccessMockPayload, MockPayload } from '@luvio/adapter-test-library';
import { testDurableHitDoesNotHitNetwork } from '@salesforce/lds-jest';
import parseAndVisit from '@salesforce/lds-graphql-parser';

import { graphQLAdapterFactory } from '../../../main';

import mockData_Account_fields_Name from './data/RecordQuery-Account-fields-Name.json';

const requestArgs: MockPayload['networkArgs'] = {
    method: 'post',
    basePath: `/graphql`,
};
const payload: MockPayload = buildSuccessMockPayload(requestArgs, mockData_Account_fields_Name);

describe('graphQL adapter offline', () => {
    // TODO - re-enable this once GQL adapter implements missingLink logic
    xit('does not hit the network when durable store is populated', async () => {
        const ast = parseAndVisit(`
                query {
                    uiapi {
                        query {
                            Account(
                                where: { Name: { like: "Account1" } }
                            ) @connection {
                                edges {
                                    node @resource(type: "Record") {
                                        Name { value, displayValue }
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

        await testDurableHitDoesNotHitNetwork(graphQLAdapterFactory, config, payload);
    });
});
