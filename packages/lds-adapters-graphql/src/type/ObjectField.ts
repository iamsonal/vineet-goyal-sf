import { IngestPath, Luvio, ResourceIngest, Store } from '@luvio/engine';
import { LuvioSelectionObjectFieldNode } from '@salesforce/lds-graphql-parser';

export const createIngest: (ast: LuvioSelectionObjectFieldNode) => ResourceIngest = (
    _ast: LuvioSelectionObjectFieldNode
) => {
    return (data: any, path: IngestPath, luvio: Luvio, _store: Store, _timestamp: number) => {
        const { fullPath } = path;

        luvio.storePublish(fullPath, data);

        return {
            __ref: fullPath,
        };
    };
};
