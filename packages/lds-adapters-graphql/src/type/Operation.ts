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
            const { name: fieldName, alias } = sel;
            const propertyName = alias === undefined ? fieldName : alias;
            reader.enterPath(fieldName);
            const childValue = source[fieldName];
            const data = followLink(sel, reader, childValue);
            reader.assignNonScalar(sink, propertyName, data);
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
            const { name: fieldName, alias } = sel;
            const propertyName = alias === undefined ? fieldName : alias;
            data[fieldName] = selectionCreateIngest(sel)(
                data[propertyName],
                {
                    parent: {
                        existing: null,
                        key,
                        data,
                    },
                    fullPath: `${key}__${fieldName}`,
                    propertyName,
                    state: path.state,
                },
                luvio,
                store,
                timestamp
            );
            if (fieldName !== propertyName && data[propertyName] !== undefined) {
                delete data[propertyName];
            }
        }

        const existing = store.records[key];
        const newData = merge(existing, data);

        luvio.storePublish(key, newData);

        return {
            __ref: key,
        };
    };
}
