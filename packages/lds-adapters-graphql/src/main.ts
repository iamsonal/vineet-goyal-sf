import { AdapterFactory, FulfilledSnapshot, Luvio, ResourceRequest, Snapshot } from '@luvio/engine';
import { LuvioDocumentNode } from '@salesforce/lds-graphql-parser';
import { astToString } from './util/ast-to-string';
interface GraphQlConfig {
    query: LuvioDocumentNode;
    variables: Record<string, string | number | boolean>;
}

export const graphQLAdapterFactory: AdapterFactory<GraphQlConfig, unknown> = (luvio: Luvio) =>
    function graphql(
        untrustedConfig: unknown
    ): Promise<Snapshot<unknown, any>> | Snapshot<unknown, any> | null {
        const validatedConfig = untrustedConfig as GraphQlConfig;

        const { variables: queryVariables, query } = validatedConfig;
        const request: ResourceRequest = {
            baseUri: '/services/data/v52.0',
            basePath: '/graphql',
            method: 'post',
            body: {
                query: astToString(query),
                variables: queryVariables,
            },
            queryParams: {},
            urlParams: {},
            headers: {},
        };

        return luvio.dispatchResourceRequest(request).then(resp => {
            const snap: FulfilledSnapshot<unknown, GraphQlConfig['variables']> = {
                recordId: '',
                data: resp.body,
                state: 'Fulfilled' as FulfilledSnapshot<any, any>['state'],
                variables: queryVariables,
                seenRecords: {},
                select: {
                    recordId: '',
                    node: {
                        kind: 'Fragment',
                        private: [],
                    },
                    variables: queryVariables,
                },
            };

            return snap;
        });
    };
