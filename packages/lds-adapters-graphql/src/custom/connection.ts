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
import {
    createIngest as selectionCreateIngest,
    getLuvioFieldNodeSelection,
    resolveLink,
    followLink,
} from '../type/Selection';
import { GqlRecord } from './record';
import { serializeArguments } from '../type/Argument';
import { LuvioFieldNode } from '@salesforce/lds-graphql-parser/dist/ast';

interface GqlEdge {
    node: GqlRecord;
}

export type GqlConnection = {
    edges: GqlEdge[];
};

const PROPERTY_NAME_EDGES = 'edges';
export const CUSTOM_FIELD_NODE_TYPE = 'Connection';

function keyBuilder(ast: LuvioSelectionCustomFieldNode) {
    const { arguments: args, name } = ast;
    if (args === undefined) {
        return `gql::${CUSTOM_FIELD_NODE_TYPE}::${name}()`;
    }
    const serialized = serializeArguments(args);
    return `gql::${CUSTOM_FIELD_NODE_TYPE}::${name}(${serialized})`;
}

function selectEdges(builder: Reader<any>, ast: LuvioFieldNode, links: StoreLink[]) {
    const sink: any[] = [];
    for (let i = 0, len = links.length; i < len; i += 1) {
        const link = links[i];
        const resolved = followLink(ast, builder, link);
        builder.assignNonScalar(sink, i, resolved);
    }
    return sink;
}

export const createRead: (ast: LuvioSelectionCustomFieldNode) => ReaderFragment['read'] = (
    ast: LuvioSelectionCustomFieldNode
) => {
    const selections = ast.luvioSelections === undefined ? [] : ast.luvioSelections;
    return (source: any, builder: Reader<any>) => {
        const sink = {};
        for (let i = 0, len = selections.length; i < len; i += 1) {
            const sel = getLuvioFieldNodeSelection(selections[i]);
            const { name } = sel;
            const edges = resolveLink(builder, source[name]) as StoreLink[];
            builder.enterPath(name);
            if (name === PROPERTY_NAME_EDGES) {
                const data = selectEdges(builder, sel, edges);
                builder.assignNonScalar(sink, name, data);
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
    timestamp: number
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
                timestamp
            );
    }
}

function ingestEdgeItem(
    data: GqlEdge,
    sel: LuvioSelectionObjectFieldNode,
    path: IngestPath,
    luvio: Luvio,
    store: Store,
    timestamp: number
): StoreLink {
    const { luvioSelections } = sel;
    const selections = luvioSelections === undefined ? [] : luvioSelections;
    const { fullPath } = path;

    for (let i = 0, len = selections.length; i < len; i += 1) {
        const sel = getLuvioFieldNodeSelection(selections[i]);
        const key = `${fullPath}__${i}`;
        const propertyName = sel.name as keyof GqlEdge;
        const item = data[propertyName];
        data[propertyName] = selectionCreateIngest(sel)(
            item,
            {
                parent: {
                    data,
                    existing: null,
                    key,
                },
                propertyName: i,
                fullPath: key,
            },
            luvio,
            store,
            timestamp
        ) as any;
    }

    luvio.storePublish(fullPath, data);

    return {
        __ref: fullPath,
    };
}

function ingestConnectionEdges(
    sel: LuvioSelectionObjectFieldNode,
    data: GqlConnection['edges'],
    path: IngestPath,
    luvio: Luvio,
    store: Store,
    timestamp: number
): StoreLink {
    const key = path.fullPath;

    for (let i = 0, len = data.length; i < len; i += 1) {
        data[i] = ingestEdgeItem(
            data[i],
            sel,
            {
                parent: {
                    data,
                    existing: null,
                    key,
                },
                propertyName: i,
                fullPath: `${key}__${i}`,
            },
            luvio,
            store,
            timestamp
        ) as any;
    }

    luvio.storePublish(key, data);

    return {
        __ref: key,
    };
}

export const createIngest: (ast: LuvioSelectionCustomFieldNode) => ResourceIngest = (
    ast: LuvioSelectionCustomFieldNode
) => {
    const key = keyBuilder(ast);
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
            const propertyName = sel.name as keyof GqlConnection;
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
                },
                luvio,
                store,
                timestamp
            ) as any;
        }

        luvio.storePublish(key, data);

        return {
            __ref: key,
        };
    };
};
