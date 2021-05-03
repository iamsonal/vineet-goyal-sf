import { IngestPath, Luvio, ResourceIngest, Store } from '@luvio/engine';
import { LuvioDocumentNode } from '@salesforce/lds-graphql-parser';
import { createIngest as createOperationIngest } from './Operation';

type GqlDocument = any;

export function createIngest(ast: LuvioDocumentNode): ResourceIngest {
    const definitions = ast.definitions === undefined ? [] : ast.definitions;
    return (data: GqlDocument, path: IngestPath, luvio: Luvio, store: Store, timestamp: number) => {
        const key = path.fullPath;
        for (let i = 0, len = definitions.length; i < len; i += 1) {
            const def = definitions[i];
            if (def.kind !== 'OperationDefinition') {
                throw new Error(`Unsupported document definition "${def.kind}"`);
            }

            createOperationIngest(def)(
                data,
                {
                    parent: null,
                    fullPath: key,
                    propertyName: null,
                },
                luvio,
                store,
                timestamp
            );
        }

        return {
            __ref: key,
        };
    };
}
