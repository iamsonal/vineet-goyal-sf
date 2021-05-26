import {
    AdapterFactory,
    FetchResponse,
    Luvio,
    ReaderFragment,
    ResourceRequest,
    Snapshot,
    SnapshotRefresh,
} from '@luvio/engine';
import { LuvioDocumentNode } from '@salesforce/lds-graphql-parser';
import { astToString } from './util/ast-to-string';
import { createIngest, createRead } from './type/Document';
interface GraphQlConfig {
    query: LuvioDocumentNode;
    variables: Record<string, string | number | boolean>;
}

export const adapterName = 'graphQL';

function buildSnapshotRefresh(
    luvio: Luvio,
    config: GraphQlConfig,
    fragment: ReaderFragment
): SnapshotRefresh<unknown> {
    return {
        config,
        resolve: () => buildNetworkSnapshot(luvio, config, fragment),
    };
}

function onResourceResponseSuccess(
    luvio: Luvio,
    config: GraphQlConfig,
    response: FetchResponse<any>,
    fragment: ReaderFragment
) {
    const { query } = config;
    const ingest = createIngest(query);
    luvio.storeIngest('graphql', ingest, response.body.data);

    const snapshot = luvio.storeLookup(
        {
            recordId: 'graphql',
            node: fragment,
            variables: {},
        },
        buildSnapshotRefresh(luvio, config, fragment)
    );

    luvio.storeBroadcast();

    return snapshot;
}

function buildNetworkSnapshot(
    luvio: Luvio,
    config: GraphQlConfig,
    fragment: ReaderFragment
): Promise<Snapshot<unknown, any>> {
    const { variables: queryVariables, query } = config;

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

    // TODO - handle network error response
    return luvio.dispatchResourceRequest<any>(request).then((resp) => {
        return onResourceResponseSuccess(luvio, config, resp, fragment);
    });
}

export const graphQLAdapterFactory: AdapterFactory<GraphQlConfig, unknown> = (luvio: Luvio) =>
    function graphql(
        untrustedConfig: unknown
    ): Promise<Snapshot<unknown, any>> | Snapshot<unknown, any> | null {
        const validatedConfig = untrustedConfig as GraphQlConfig;

        const { query } = validatedConfig;

        const fragment: ReaderFragment = {
            kind: 'Fragment',
            synthetic: false,
            reader: true,
            read: createRead(query),
        };

        const snapshot = luvio.storeLookup(
            {
                recordId: 'graphql',
                node: fragment,
                variables: {},
            },
            buildSnapshotRefresh(luvio, validatedConfig, fragment)
        );

        if (luvio.snapshotAvailable(snapshot)) {
            return snapshot;
        }

        return luvio.resolveSnapshot(
            snapshot,
            buildSnapshotRefresh(luvio, validatedConfig, fragment)
        );
    };
