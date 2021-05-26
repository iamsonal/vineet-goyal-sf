import { IngestPath, Luvio, Reader, ReaderFragment, ResourceIngest, Store } from '@luvio/engine';
import { LuvioSelectionObjectFieldNode } from '@salesforce/lds-graphql-parser';
import { getLuvioFieldNodeSelection, followLink } from './Selection';
import { createIngest as customFieldCreateIngest } from './CustomField';
import merge from '../util/merge';

export const createRead: (ast: LuvioSelectionObjectFieldNode) => ReaderFragment['read'] = (
    ast: LuvioSelectionObjectFieldNode
) => {
    const selections = ast.luvioSelections === undefined ? [] : ast.luvioSelections;
    return (source: any, builder: Reader<any>) => {
        const sink = {};
        for (let i = 0, len = selections.length; i < len; i += 1) {
            const sel = getLuvioFieldNodeSelection(selections[i]);
            const { name: fieldName, alias } = sel;
            const propertyName = alias === undefined ? fieldName : alias;
            builder.enterPath(fieldName);
            switch (sel.kind) {
                case 'ScalarFieldSelection':
                    builder.readScalar(fieldName, source, sink);
                    break;
                default: {
                    const data = followLink(sel, builder, source[fieldName]);
                    builder.assignNonScalar(sink, propertyName, data);
                }
            }
            builder.exitPath();
        }
        return sink;
    };
};

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

            const { name: fieldName, alias } = sel;
            const propertyName = alias === undefined ? fieldName : alias;
            const propertyFullPath = `${fullPath}__${fieldName}`;

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
                data[fieldName] = createIngest(sel)(
                    data[propertyName],
                    childPath,
                    luvio,
                    store,
                    timestamp
                );
                if (fieldName !== propertyName && data[propertyName] !== undefined) {
                    delete data[propertyName];
                }
            } else if (sel.kind === 'CustomFieldSelection') {
                data[fieldName] = customFieldCreateIngest(sel)(
                    data[propertyName],
                    childPath,
                    luvio,
                    store,
                    timestamp
                );
                if (fieldName !== propertyName && data[propertyName] !== undefined) {
                    delete data[propertyName];
                }
            }
        }

        const existing = store.records[fullPath];
        const newData = merge(existing, data);

        luvio.storePublish(fullPath, newData);

        return {
            __ref: fullPath,
        };
    };
};
