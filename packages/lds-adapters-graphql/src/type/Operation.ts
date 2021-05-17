import { IngestPath, Luvio, Reader, ReaderFragment, ResourceIngest, Store } from '@luvio/engine';
import { LuvioOperationDefinitionNode } from '@salesforce/lds-graphql-parser';
import {
    getLuvioFieldNodeSelection,
    createIngest as selectionCreateIngest,
    followLink,
} from './Selection';
import merge from '../util/merge';

type GqlOperation = any;

export const createRead: (ast: LuvioOperationDefinitionNode) => ReaderFragment['read'] = (
    ast: LuvioOperationDefinitionNode
) => {
    const selections = ast.luvioSelections === undefined ? [] : ast.luvioSelections;
    return (source: any, reader: Reader<any>) => {
        const sink = {};
        for (let i = 0, len = selections.length; i < len; i += 1) {
            const sel = getLuvioFieldNodeSelection(selections[i]);
            const { name } = sel;
            reader.enterPath(name);
            const childValue = source[name];
            const data = followLink(sel, reader, childValue);
            reader.assignNonScalar(sink, name, data);
            reader.exitPath();
        }
        return sink;
    };
};

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
            data[propertyName] = selectionCreateIngest(sel)(
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

        const existing = store.records[key];
        const newData = merge(existing, data);

        luvio.storePublish(key, newData);

        return {
            __ref: key,
        };
    };
}
