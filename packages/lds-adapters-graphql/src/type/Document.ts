import { IngestPath, Luvio, Reader, ReaderFragment, ResourceIngest, Store } from '@luvio/engine';
import { LuvioDocumentNode } from '@salesforce/lds-graphql-parser';
import { validate as operationValidate } from './Operation';
import { GraphQLVariables } from './Variable';
import { createIngest as genericCreateIngest } from '../util/ingest';
import { createRead as genericCreateRead } from '../util/read';
import { untrustedIsObject } from '../util/adapter';
import { ArrayIsArray, ObjectPrototypeHasOwnProperty } from '../util/language';

export type GraphQL = {
    data: any;
    errors: unknown[];
};

export function isLuvioDocumentNode(unknown: unknown): unknown is LuvioDocumentNode {
    if (
        untrustedIsObject(unknown) === true &&
        ObjectPrototypeHasOwnProperty.call(unknown, 'kind') === true &&
        ObjectPrototypeHasOwnProperty.call(unknown, 'definitions') === true
    ) {
        return (
            typeof (unknown as LuvioDocumentNode).kind === 'string' &&
            ArrayIsArray((unknown as LuvioDocumentNode).definitions)
        );
    }

    return false;
}

export const createRead: (
    ast: LuvioDocumentNode,
    variables: GraphQLVariables
) => ReaderFragment['read'] = (ast: LuvioDocumentNode, variables: GraphQLVariables) => {
    const definitions = ast.definitions === undefined ? [] : ast.definitions;
    return (source: any, builder: Reader<any>) => {
        builder.enterPath('data');
        let sink = {};
        for (let i = 0, len = definitions.length; i < len; i += 1) {
            const def = definitions[i];
            if (def.kind !== 'OperationDefinition') {
                // eslint-disable-next-line @salesforce/lds/no-error-in-production
                throw new Error(`Unsupported document definition "${def.kind}"`);
            }

            const data = genericCreateRead(def, variables)(source, builder);
            sink = {
                ...sink,
                ...data,
            };
        }

        const gqlData = {};
        builder.assignNonScalar(gqlData, 'data', sink);
        builder.exitPath();
        builder.enterPath('errors');
        builder.assignNonScalar(gqlData, 'errors', []);
        builder.exitPath();

        return gqlData;
    };
};
export function createIngest(ast: LuvioDocumentNode, variables: GraphQLVariables): ResourceIngest {
    const definitions = ast.definitions === undefined ? [] : ast.definitions;
    return (data: GraphQL, path: IngestPath, luvio: Luvio, store: Store, timestamp: number) => {
        const key = path.fullPath;
        for (let i = 0, len = definitions.length; i < len; i += 1) {
            const def = definitions[i];
            if (def.kind !== 'OperationDefinition') {
                // eslint-disable-next-line @salesforce/lds/no-error-in-production
                throw new Error(`Unsupported document definition "${def.kind}"`);
            }

            genericCreateIngest(def, variables)(
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

export function validate(ast: LuvioDocumentNode, variables: GraphQLVariables): string[] {
    const errors: string[] = [];
    const { definitions } = ast;
    for (let i = 0, len = definitions.length; i < len; i += 1) {
        const def = definitions[i];
        if (def.kind !== 'OperationDefinition') {
            errors.push(`Unsupported document definition "${def.kind}"`);
        } else {
            errors.push(...operationValidate(def, variables));
        }
    }
    return errors;
}
