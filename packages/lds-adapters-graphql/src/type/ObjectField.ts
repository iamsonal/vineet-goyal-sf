import { IngestPath, Luvio, ResourceIngest, Store } from '@luvio/engine';
import { LuvioSelectionObjectFieldNode } from '@salesforce/lds-graphql-parser';
import { getLuvioFieldNodeSelection } from './Selection';
import { createIngest as createCustomFieldIngest } from './CustomField';

export const createIngest: (ast: LuvioSelectionObjectFieldNode) => ResourceIngest = (
    ast: LuvioSelectionObjectFieldNode
) => {
    let selections = ast.luvioSelections === undefined ? [] : ast.luvioSelections;

    return (data: any, path: IngestPath, luvio: Luvio, store: Store, timestamp: number) => {
        const { fullPath } = path;

        for (let i = 0, len = selections.length; i < len; i += 1) {
            const sel = getLuvioFieldNodeSelection(selections[i]);
            if (sel.kind === 'ScalarFieldSelection') {
                continue;
            }

            const propertyName = sel.name;
            const propertyFullPath = `${fullPath}__${propertyName}`;
            const childPath: IngestPath = {
                parent: {
                    existing: null,
                    key: fullPath,
                    data,
                },
                propertyName,
                fullPath: propertyFullPath,
            };
            if (sel.kind === 'ObjectFieldSelection') {
                data[propertyName] = createIngest(sel)(
                    data[propertyName],
                    childPath,
                    luvio,
                    store,
                    timestamp
                );
            } else if (sel.kind === 'CustomFieldSelection') {
                data[propertyName] = createCustomFieldIngest(sel)(
                    data[propertyName],
                    childPath,
                    luvio,
                    store,
                    timestamp
                );
            }
        }

        luvio.storePublish(fullPath, data);

        return {
            __ref: fullPath,
        };
    };
};
