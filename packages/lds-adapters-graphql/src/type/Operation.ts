import { IngestPath, Luvio, ResourceIngest, Store } from '@luvio/engine';
import { LuvioOperationDefinitionNode } from '@salesforce/lds-graphql-parser';
import { getLuvioFieldNodeSelection, createIngest as createSelectionIngest } from './Selection';

type GqlOperation = any;

export function createIngest(ast: LuvioOperationDefinitionNode): ResourceIngest {
    const selections = ast.luvioSelections === undefined ? [] : ast.luvioSelections;
    return (
        data: GqlOperation,
        path: IngestPath,
        luvio: Luvio,
        store: Store,
        timestamp: number
    ) => {
        const key = path.fullPath;
        for (let i = 0, len = selections.length; i < len; i += 1) {
            const sel = getLuvioFieldNodeSelection(selections[i]);
            const propertyName = sel.name;
            data[propertyName] = createSelectionIngest(sel)(
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
            );
        }

        luvio.storePublish(key, data);

        return {
            __ref: key,
        };
    };
}
