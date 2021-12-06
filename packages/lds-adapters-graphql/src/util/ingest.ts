import { IngestPath, Luvio, Store } from '@luvio/engine';
import {
    LuvioOperationDefinitionNode,
    LuvioSelectionCustomFieldNode,
    LuvioSelectionObjectFieldNode,
} from '@luvio/graphql-parser';
import { render as renderField } from '../type/Field';
import { getLuvioFieldNodeSelection } from '../type/Selection';
import { createIngest as customFieldCreateIngest } from '../type/CustomField';
import merge from './merge';
import { GraphQLVariables } from '../type/Variable';
import { equals } from './equal';
import { namespace } from './adapter';

export const DEFAULT_GRAPHQL_TTL = 30000;

type LuvioIngestableNode =
    | LuvioOperationDefinitionNode
    | LuvioSelectionObjectFieldNode
    | LuvioSelectionCustomFieldNode;

export function createIngest(ast: LuvioIngestableNode, variables: GraphQLVariables) {
    if (ast.kind === 'CustomFieldSelection') {
        return customFieldCreateIngest(ast as LuvioSelectionCustomFieldNode, variables);
    }

    return genericCreateIngest(ast, variables);
}

export function publishIfChanged(params: {
    ast: LuvioIngestableNode;
    key: string;
    incoming: any;
    luvio: Luvio;
    store: Store;
    variables: GraphQLVariables;
}) {
    const { store, key, ast, incoming, luvio, variables } = params;
    const existing = store.records[key];
    if (existing === undefined || equals(ast, variables, existing, incoming) === false) {
        const newData = merge(existing, incoming);
        luvio.storePublish(key, newData);

        if (newData && newData.__typename !== undefined) {
            luvio.publishStoreMetadata(key, {
                representationName: newData.__typename,
                namespace: namespace,
                ttl: DEFAULT_GRAPHQL_TTL,
            });
        }
    }
}

function genericCreateIngest(ast: LuvioIngestableNode, variables: GraphQLVariables) {
    let selections = ast.luvioSelections === undefined ? [] : ast.luvioSelections;

    return (data: any, path: IngestPath, luvio: Luvio, store: Store, timestamp: number) => {
        const { fullPath } = path;

        for (let i = 0, len = selections.length; i < len; i += 1) {
            const sel = getLuvioFieldNodeSelection(selections[i]);
            if (sel.kind === 'ScalarFieldSelection') {
                continue;
            }

            const { name: fieldName, alias } = sel;
            const readPropertyName = alias === undefined ? fieldName : alias;
            const propertyFullPath = `${fullPath}__${fieldName}`;
            const writePropertyName = renderField(sel, variables);
            const childPath: IngestPath = {
                parent: {
                    existing: null,
                    key: fullPath,
                    data,
                },
                propertyName: readPropertyName,
                fullPath: propertyFullPath,
                state: path.state,
            };
            data[writePropertyName] = createIngest(sel, variables)(
                data[readPropertyName],
                childPath,
                luvio,
                store,
                timestamp
            );

            if (writePropertyName !== readPropertyName && data[readPropertyName] !== undefined) {
                delete data[readPropertyName];
            }
        }

        publishIfChanged({
            ast,
            luvio,
            store,
            key: fullPath,
            variables: {},
            incoming: data,
        });

        return {
            __ref: fullPath,
        };
    };
}
