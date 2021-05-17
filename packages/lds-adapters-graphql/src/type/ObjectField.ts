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
            const { name } = sel;
            builder.enterPath(name);
            switch (sel.kind) {
                case 'ScalarFieldSelection':
                    builder.readScalar(name, source, sink);
                    break;
                default: {
                    const data = followLink(sel, builder, source[name]);
                    builder.assignNonScalar(sink, name, data);
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
                data[propertyName] = customFieldCreateIngest(sel)(
                    data[propertyName],
                    childPath,
                    luvio,
                    store,
                    timestamp
                );
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
