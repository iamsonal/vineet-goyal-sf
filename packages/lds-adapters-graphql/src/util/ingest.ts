import { IngestPath, Luvio, Store } from '@luvio/engine';
import {
    LuvioOperationDefinitionNode,
    LuvioSelectionCustomFieldNode,
    LuvioSelectionObjectFieldNode,
} from '@salesforce/lds-graphql-parser';
import { render as renderField } from '../type/Field';
import { getLuvioFieldNodeSelection } from '../type/Selection';
import { createIngest as customFieldCreateIngest } from '../type/CustomField';
import merge from './merge';
import { GraphQLVariables } from '../type/Variable';

export function createIngest(
    ast:
        | LuvioOperationDefinitionNode
        | LuvioSelectionObjectFieldNode
        | LuvioSelectionCustomFieldNode,
    variables: GraphQLVariables
) {
    if (ast.kind === 'CustomFieldSelection') {
        return customFieldCreateIngest(ast as LuvioSelectionCustomFieldNode, variables);
    }

    return genericCreateIngest(ast, variables);
}

function genericCreateIngest(
    ast: LuvioOperationDefinitionNode | LuvioSelectionObjectFieldNode,
    variables: GraphQLVariables
) {
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

        const existing = store.records[fullPath];
        const newData = merge(existing, data);

        luvio.storePublish(fullPath, newData);

        return {
            __ref: fullPath,
        };
    };
}
