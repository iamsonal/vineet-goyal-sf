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
import { GraphQL, createIngest, createRead, validate as documentValidate } from './type/Document';
import { GraphQLVariables } from './type/Variable';
import { ArrayIsArray, ObjectFreeze, ObjectKeys, untrustedIsObject } from './util/language';

interface GraphQLConfig {
    query: LuvioDocumentNode;
    variables: GraphQLVariables;
}
export const adapterName = 'graphQL';

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
    config: GraphQLConfig,
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
    config: GraphQLConfig,
    fragment: ReaderFragment
): Promise<Snapshot<unknown, any>> {
    const { variables: queryVariables, query } = config;

    const request: ResourceRequest = {
        baseUri: '/services/data/v54.0',
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

    if (untrustedIsObject(variables) === false) {
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

function isLuvioDocumentNode(ast: unknown): ast is LuvioDocumentNode {
    return (
        untrustedIsObject(ast) &&
        'kind' in ast &&
        typeof ast['kind'] === 'string' &&
        ast['kind'] === 'Document' &&
        'definitions' in ast &&
        ArrayIsArray(ast['definitions'])
    );
}

export const graphQLAdapterFactory: AdapterFactory<GraphQLConfig, unknown> = (luvio: Luvio) =>
    function graphql(
        untrustedConfig: unknown
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
