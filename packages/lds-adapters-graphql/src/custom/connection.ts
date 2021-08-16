import {
    IngestPath,
    Luvio,
    Reader,
    ReaderFragment,
    ResourceIngest,
    Store,
    StoreLink,
} from '@luvio/engine';
import {
    LuvioSelectionCustomFieldNode,
    LuvioSelectionObjectFieldNode,
} from '@salesforce/lds-graphql-parser';
import { getLuvioFieldNodeSelection, resolveLink, followLink } from '../type/Selection';
import { GqlRecord } from './record';
import { render as renderArguments } from '../type/Argument';
import { GraphQLVariables } from '../type/Variable';
import { render as renderField } from '../type/Field';
import { keyPrefix } from '../util/adapter';
import { LuvioFieldNode } from '@salesforce/lds-graphql-parser';
import { readScalarFieldSelection } from '../type/ScalarField';
import { createIngest as genericCreateIngest, publishIfChanged } from '../util/ingest';

interface GqlEdge {
    node: GqlRecord;
}

export type GqlConnection = {
    edges: GqlEdge[];
};

const PROPERTY_NAME_EDGES = 'edges';
export const CUSTOM_FIELD_NODE_TYPE = 'Connection';

export function keyBuilder(ast: LuvioSelectionCustomFieldNode, variables: GraphQLVariables) {
    const { arguments: args, name } = ast;
    if (args === undefined) {
        return `${keyPrefix}${CUSTOM_FIELD_NODE_TYPE}:${name}()`;
    }
    const serialized = renderArguments(args, variables);
    return `${keyPrefix}${CUSTOM_FIELD_NODE_TYPE}:${name}(${serialized})`;
}

function selectEdges(
    builder: Reader<any>,
    ast: LuvioFieldNode,
    links: StoreLink[],
    variables: GraphQLVariables
) {
    const sink: any[] = [];
    for (let i = 0, len = links.length; i < len; i += 1) {
        builder.enterPath(i);
        const link = links[i];
        const resolved = followLink(ast, builder, link, variables);
        builder.assignNonScalar(sink, i, resolved);
        builder.exitPath();
    }
    return sink;
}

export const createRead: (
    ast: LuvioSelectionCustomFieldNode,
    variables: GraphQLVariables
) => ReaderFragment['read'] = (ast: LuvioSelectionCustomFieldNode, variables: GraphQLVariables) => {
    const selections = ast.luvioSelections === undefined ? [] : ast.luvioSelections;
    return (source: any, builder: Reader<any>) => {
        const sink = {};
        for (let i = 0, len = selections.length; i < len; i += 1) {
            const sel = getLuvioFieldNodeSelection(selections[i]);
            const { name, kind } = sel;
            if (kind === 'ScalarFieldSelection') {
                readScalarFieldSelection(builder, source, name, sink);
                continue;
            }
            const readPropertyName = renderField(sel, variables);
            builder.enterPath(readPropertyName);
            const edges = resolveLink<StoreLink[]>(builder, source[readPropertyName]);
            if (edges === undefined) {
                builder.exitPath();
                break;
            }
            if (readPropertyName === PROPERTY_NAME_EDGES) {
                const data = selectEdges(builder, sel, edges.value, variables);
                builder.assignNonScalar(sink, readPropertyName, data);
            } else {
                throw new Error('Not supported');
            }

            builder.exitPath();
        }
        return sink;
    };
};

function ingestConnectionProperty(
    sel: LuvioFieldNode,
    data: GqlConnection['edges'],
    path: IngestPath,
    luvio: Luvio,
    store: Store,
    timestamp: number,
    variables: GraphQLVariables
) {
    const propertyName = sel.name as keyof GqlConnection;

    switch (propertyName) {
        case PROPERTY_NAME_EDGES:
            return ingestConnectionEdges(
                sel as LuvioSelectionObjectFieldNode,
                data,
                path,
                luvio,
                store,
                timestamp,
                variables
            );
    }
}

function ingestConnectionEdges(
    sel: LuvioSelectionObjectFieldNode,
    data: GqlConnection['edges'],
    path: IngestPath,
    luvio: Luvio,
    store: Store,
    timestamp: number,
    variables: GraphQLVariables
): StoreLink {
    const key = path.fullPath;
    const existing = store.records[key];

    let hasChanges = existing === undefined;
    for (let i = 0, len = data.length; i < len; i += 1) {
        const incomingItem = (data[i] = genericCreateIngest(sel, variables)(
            data[i],
            {
                parent: {
                    data,
                    existing: null,
                    key,
                },
                propertyName: i,
                fullPath: `${key}__${i}`,
                state: path.state,
            },
            luvio,
            store,
            timestamp
        ) as any);

        const existingItem = existing !== undefined ? existing[i] : undefined;
        if (existingItem === undefined || existingItem.__ref !== incomingItem.__ref) {
            hasChanges = true;
        }
    }

    if (hasChanges === true) {
        luvio.storePublish(key, data);
    }

    return {
        __ref: key,
    };
}

export const createIngest: (
    ast: LuvioSelectionCustomFieldNode,
    key: string,
    variables: GraphQLVariables
) => ResourceIngest = (
    ast: LuvioSelectionCustomFieldNode,
    key: string,
    variables: GraphQLVariables
) => {
    const { luvioSelections } = ast;
    const selections = luvioSelections === undefined ? [] : luvioSelections;

    return (
        data: GqlConnection,
        path: IngestPath,
        luvio: Luvio,
        store: Store,
        timestamp: number
    ) => {
        for (let i = 0, len = selections.length; i < len; i += 1) {
            const sel = getLuvioFieldNodeSelection(selections[i]);
            const { kind } = sel;
            const propertyName = sel.name as keyof GqlConnection;

            if (kind !== 'ObjectFieldSelection') {
                continue;
            }

            data[propertyName] = ingestConnectionProperty(
                sel,
                data[propertyName],
                {
                    parent: {
                        existing: null,
                        key,
                        data,
                    },
                    fullPath: `${key}__${propertyName}`,
                    propertyName,
                    state: path.state,
                },
                luvio,
                store,
                timestamp,
                variables
            ) as any;
        }

        publishIfChanged({
            key,
            luvio,
            store,
            incoming: data,
            variables: {},
            ast,
        });

        return {
            __ref: key,
        };
    };
};
