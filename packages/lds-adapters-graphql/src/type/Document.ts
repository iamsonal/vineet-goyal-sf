import { IngestPath, Luvio, Reader, ReaderFragment, ResourceIngest, Store } from '@luvio/engine';
import { LuvioDocumentNode } from '@salesforce/lds-graphql-parser';
import {
    createIngest as operationCreateIngest,
    createRead as operationCreateRead,
} from './Operation';

export type GraphQL = {
    data: any;
    errors: unknown[];
};

export const createRead: (ast: LuvioDocumentNode) => ReaderFragment['read'] = (
    ast: LuvioDocumentNode
) => {
    const definitions = ast.definitions === undefined ? [] : ast.definitions;
    return (source: any, builder: Reader<any>) => {
        let sink = {};
        for (let i = 0, len = definitions.length; i < len; i += 1) {
            const def = definitions[i];
            if (def.kind !== 'OperationDefinition') {
                throw new Error(`Unsupported document definition "${def.kind}"`);
            }

            const data = operationCreateRead(def)(source, builder);
            sink = {
                ...sink,
                ...data,
            };
        }

        const gqlData = {};
        builder.assignNonScalar(gqlData, 'data', sink);
        builder.assignNonScalar(gqlData, 'errors', []);

        return gqlData;
    };
};
export function createIngest(ast: LuvioDocumentNode): ResourceIngest {
    const definitions = ast.definitions === undefined ? [] : ast.definitions;
    return (data: GraphQL, path: IngestPath, luvio: Luvio, store: Store, timestamp: number) => {
        const key = path.fullPath;
        for (let i = 0, len = definitions.length; i < len; i += 1) {
            const def = definitions[i];
            if (def.kind !== 'OperationDefinition') {
                throw new Error(`Unsupported document definition "${def.kind}"`);
            }

            operationCreateIngest(def)(
                data,
                {
                    parent: null,
                    fullPath: key,
                    propertyName: null,
                    state: path.state,
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
