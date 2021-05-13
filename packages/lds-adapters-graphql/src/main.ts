import { AdapterFactory, Luvio, ReaderFragment, ResourceRequest, Snapshot } from '@luvio/engine';
import { LuvioDocumentNode } from '@salesforce/lds-graphql-parser';
import { astToString } from './util/ast-to-string';
import { createIngest, createRead } from './type/Document';
interface GraphQlConfig {
    query: LuvioDocumentNode;
    variables: Record<string, string | number | boolean>;
}

export const adapterName = 'graphQL';

export const graphQLAdapterFactory: AdapterFactory<GraphQlConfig, unknown> = (luvio: Luvio) =>
    function graphql(
        untrustedConfig: unknown
    ): Promise<Snapshot<unknown, any>> | Snapshot<unknown, any> | null {
        const validatedConfig = untrustedConfig as GraphQlConfig;

        const { variables: queryVariables, query } = validatedConfig;

        const fragment: ReaderFragment = {
            kind: 'Fragment',
            synthetic: false,
            reader: true,
            read: createRead(query),
        };

        const snapshot = luvio.storeLookup({
            recordId: 'graphql',
            node: fragment,
            variables: {},
        });

        if (luvio.snapshotAvailable(snapshot)) {
            return snapshot;
        }

        const request: ResourceRequest = {
            baseUri: '/services/data/v53.0',
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

        return luvio.dispatchResourceRequest<any>(request).then(resp => {
            const ingest = createIngest(query);
            luvio.storeIngest('graphql', ingest, resp.body.data);

            return luvio.storeLookup({
                recordId: 'graphql',
                node: fragment,
                variables: {},
            });
        });
    };
