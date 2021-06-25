import {
    AdapterFactory,
    FetchResponse,
    Luvio,
    Reader,
    ReaderFragment,
    ResourceRequest,
    Snapshot,
    SnapshotRefresh,
} from '@luvio/engine';
import { LuvioDocumentNode } from '@salesforce/lds-graphql-parser';
import { astToString } from './util/ast-to-string';
import { GraphQL, createIngest, createRead } from './type/Document';
import { GraphQLVariables } from './type/Variable';
import { ArrayIsArray, ObjectFreeze, ObjectKeys } from './util/language';
interface GraphQlConfig {
    query: LuvioDocumentNode;
    variables: GraphQLVariables;
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

function createFragment(query: LuvioDocumentNode, variables: GraphQLVariables): ReaderFragment {
    return {
        kind: 'Fragment',
        synthetic: false,
        reader: true,
        read: createRead(query, variables),
    };
}

function deepFreeze(value: unknown) {
    // No need to freeze primitives
    if (typeof value !== 'object' || value === null) {
        return;
    }
    if (ArrayIsArray(value)) {
        for (let i = 0, len = value.length; i < len; i += 1) {
            deepFreeze(value[i]);
        }
    } else {
        const keys = ObjectKeys(value) as Array<keyof typeof value>;

        for (let i = 0, len = keys.length; i < len; i += 1) {
            const v = value[keys[i]];
            deepFreeze(v);
        }
    }
    return ObjectFreeze(value);
}

function onResourceResponseSuccess(
    luvio: Luvio,
    config: GraphQlConfig,
    response: FetchResponse<GraphQL>,
    fragment: ReaderFragment
) {
    const { query, variables } = config;
    const { body } = response;
    if (body.errors.length > 0) {
        return luvio.storeLookup({
            recordId: 'graphql',
            node: {
                kind: 'Fragment',
                synthetic: true,
                reader: true,
                read: (reader: Reader<any>) => {
                    const sink = {};
                    reader.enterPath('data');
                    reader.assignNonScalar(sink, 'data', body.data);
                    reader.exitPath();
                    reader.enterPath('errors');
                    reader.assignNonScalar(sink, 'errors', deepFreeze(body.errors));
                    reader.exitPath();
                    return sink;
                },
            },
            variables: {},
        });
    }

    const ingest = createIngest(query, variables);
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

        const { query, variables } = validatedConfig;

        const fragment: ReaderFragment = createFragment(query, variables);

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
