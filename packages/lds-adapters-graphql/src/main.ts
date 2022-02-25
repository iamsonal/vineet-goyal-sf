import type {
    AdapterFactory,
    AdapterRequestContext,
    CacheKeySet,
    CoercedAdapterRequestContext,
    DispatchResourceRequestContext,
    FetchResponse,
    Luvio,
    Reader,
    ReaderFragment,
    ResourceRequest,
    Selector,
    Snapshot,
    SnapshotRefresh,
    StoreLookup,
    TTLStrategy,
} from '@luvio/engine';
import type { LuvioDocumentNode } from '@luvio/graphql-parser';
import { astToString } from './util/ast-to-string';
import { deepFreeze, namespace, representationName, untrustedIsObject } from './util/adapter';
import { ObjectKeys, ObjectCreate } from './util/language';
import type { GraphQL } from './type/Document';
import {
    createIngest,
    createRead,
    validate as documentValidate,
    isLuvioDocumentNode,
} from './type/Document';
import type { GraphQLVariables } from './type/Variable';
import { isGraphQLVariables } from './type/Variable';
import { storeEval } from './configuration';

export { namespace, representationName } from './util/adapter';

export const adapterName = 'graphQL';

const GRAPHQL_ROOT_KEY = `${namespace}::${representationName}`;

interface GraphQLConfig {
    query: LuvioDocumentNode;
    variables: GraphQLVariables;
}

function buildSnapshotRefresh(
    luvio: Luvio,
    config: GraphQLConfig,
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

function onResourceResponseSuccess(
    luvio: Luvio,
    config: GraphQLConfig,
    response: FetchResponse<GraphQL>,
    fragment: ReaderFragment
) {
    const { query, variables } = config;
    const { body } = response;
    if (body.errors.length > 0) {
        return luvio.storeLookup({
            recordId: representationName,
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
    luvio.storeIngest(GRAPHQL_ROOT_KEY, ingest, body.data);

    const snapshot = luvio.storeLookup(
        {
            recordId: GRAPHQL_ROOT_KEY,
            node: fragment,
            variables: {},
        },
        buildSnapshotRefresh(luvio, config, fragment)
    );

    luvio.storeBroadcast();

    return snapshot;
}

function getResponseCacheKeys(
    luvio: Luvio,
    config: GraphQLConfig,
    response: FetchResponse<GraphQL>,
    fragment: ReaderFragment
): CacheKeySet {
    // TODO [W-10147827]: make this more efficient

    // for now we will get the cache keys by actually ingesting then looking at
    // the seenRecords + recordId
    const { query, variables } = config;
    const { body } = response;
    if (body.errors.length > 0) {
        return {};
    }

    const ingest = createIngest(query, variables);

    // ingest mutates the response so we have to make a copy
    const dataCopy = JSON.parse(JSON.stringify(body.data));
    luvio.storeIngest(GRAPHQL_ROOT_KEY, ingest, dataCopy);
    const snapshot = luvio.storeLookup(
        {
            recordId: GRAPHQL_ROOT_KEY,
            node: fragment,
            variables: {},
        },
        buildSnapshotRefresh(luvio, config, fragment)
    );

    if (snapshot.state === 'Error') {
        return {};
    }

    const keys = [...ObjectKeys(snapshot.seenRecords), snapshot.recordId];
    const keySet: CacheKeySet = ObjectCreate(null);
    for (let i = 0, len = keys.length; i < len; i++) {
        const key = keys[i];
        const namespace = key.split('::')[0];
        const representationName = key.split('::')[1].split(':')[0];
        keySet[key] = {
            namespace,
            representationName,
        };
    }
    return keySet;
}

function onResourceResponseError(
    luvio: Luvio,
    config: GraphQLConfig,
    response: FetchResponse<GraphQL>
) {
    const errorSnapshot = luvio.errorSnapshot(response);
    luvio.storeIngestError(GRAPHQL_ROOT_KEY, errorSnapshot);
    luvio.storeBroadcast();
    return errorSnapshot;
}

function buildNetworkSnapshot(
    luvio: Luvio,
    config: GraphQLConfig,
    fragment: ReaderFragment,
    options?: DispatchResourceRequestContext
): Promise<Snapshot<unknown, any>> {
    const { variables: queryVariables, query } = config;

    const request: ResourceRequest = {
        baseUri: '/services/data/v55.0',
        basePath: '/graphql',
        method: 'post',
        priority: 'normal',
        body: {
            query: astToString(query),
            variables: queryVariables,
        },
        queryParams: {},
        urlParams: {},
        headers: {},
    };

    return luvio.dispatchResourceRequest<any>(request, options).then(
        (resp) => {
            return luvio.handleSuccessResponse(
                () => onResourceResponseSuccess(luvio, config, resp, fragment),
                () => getResponseCacheKeys(luvio, config, resp, fragment)
            );
        },
        (errorResponse) => {
            return luvio.handleErrorResponse(() =>
                onResourceResponseError(luvio, config, errorResponse)
            );
        }
    );
}

function validateGraphQlConfig(untrustedConfig: unknown): {
    validatedConfig: GraphQLConfig | null;
    errors: string[];
} {
    if (!untrustedIsObject(untrustedConfig)) {
        return {
            validatedConfig: null,
            errors: ["Invalid Config provided isn't an object"],
        };
    }

    if (!('variables' in untrustedConfig && 'query' in untrustedConfig)) {
        return {
            validatedConfig: null,
            errors: [
                'Missing one or both of the required config parameters "query" and "variables"',
            ],
        };
    }

    const { variables, query } = untrustedConfig;
    const validationErrors: string[] = [];

    if (isLuvioDocumentNode(query) === false) {
        validationErrors.push('The config parameter "query" isn\'t a valid LuvioDocumentNode');
    }
    const ast = query as LuvioDocumentNode;

    if (isGraphQLVariables(variables) === false) {
        validationErrors.push('The config parameter "variables" isn\'t an object');
    }

    if (validationErrors.length > 0) {
        return {
            validatedConfig: null,
            errors: validationErrors,
        };
    }

    validationErrors.push(...documentValidate(ast, variables));

    if (validationErrors.length > 0) {
        return {
            validatedConfig: null,
            errors: validationErrors,
        };
    }

    return {
        validatedConfig: {
            variables,
            query,
        },
        errors: [],
    };
}

type BuildSnapshotContext = {
    config: GraphQLConfig;
    fragment: ReaderFragment;
    luvio: Luvio;
};

type hasTTLStrategy = {
    ttlStrategy: TTLStrategy | undefined;
};

export function buildCachedSnapshot(
    context: BuildSnapshotContext,
    storeLookup: StoreLookup<unknown>
): Promise<Snapshot<unknown, unknown>> | Snapshot<unknown, any> {
    if (storeEval !== undefined) {
        const { ttlStrategy } = storeLookup as unknown as hasTTLStrategy;

        if (ttlStrategy !== undefined) {
            return storeEval(context.config.query, ttlStrategy).catch(() => {
                return buildInMemorySnapshot(context, storeLookup);
            });
        }
    }

    return buildInMemorySnapshot(context, storeLookup);
}

function buildInMemorySnapshot(
    context: BuildSnapshotContext,
    storeLookup: StoreLookup<unknown>
): Snapshot<unknown, any> {
    const { config, fragment, luvio } = context;

    const selector: Selector = {
        recordId: GRAPHQL_ROOT_KEY,
        node: fragment,
        variables: {},
    };

    return storeLookup(selector, buildSnapshotRefresh(luvio, config, fragment));
}

function buildNetworkSnapshotCachePolicy(
    context: BuildSnapshotContext,
    coercedAdapterRequestContext: CoercedAdapterRequestContext
): Promise<Snapshot<unknown, any>> {
    const { config, fragment, luvio } = context;
    const { networkPriority, requestCorrelator } = coercedAdapterRequestContext;

    const dispatchOptions: DispatchResourceRequestContext = {
        resourceRequestContext: {
            requestCorrelator,
        },
    };

    if (networkPriority !== 'normal') {
        dispatchOptions.overrides = {
            priority: networkPriority,
        };
    }
    return buildNetworkSnapshot(luvio, config, fragment, dispatchOptions);
}

export const graphQLAdapterFactory: AdapterFactory<GraphQLConfig, unknown> = (luvio: Luvio) =>
    function graphql(
        untrustedConfig: unknown,
        requestContext?: AdapterRequestContext
    ): Promise<Snapshot<unknown, any>> | Snapshot<unknown, any> | null {
        const { validatedConfig, errors } = validateGraphQlConfig(untrustedConfig);

        if (errors.length > 0 || validatedConfig === null) {
            if (process.env.NODE_ENV !== 'production') {
                throw new Error(errors.join(', '));
            }
            return null;
        }

        const { query, variables } = validatedConfig;

        const fragment: ReaderFragment = createFragment(query, variables);
        const context = { config: validatedConfig, fragment, luvio };

        return luvio.applyCachePolicy(
            requestContext || {},
            context,
            buildCachedSnapshot,
            buildNetworkSnapshotCachePolicy
        );
    };

export { configuration } from './configuration';
export { keyBuilder as connectionKeyBuilder } from './custom/connection';
