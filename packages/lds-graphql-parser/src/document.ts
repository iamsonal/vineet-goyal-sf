import { DocumentNode } from 'graphql/language';
import {
    LuvioDocumentNode,
    LuvioDefinitionNode,
    isOperationDefinitionNode,
    isFragmentDefinitionNode,
} from './ast';
import { transform as operationDefinitionTransform } from './operation';
import { transform as fragmentDefinitionTransform } from './fragment';

export function transform(root: DocumentNode): LuvioDocumentNode {
    const { kind, definitions } = root;
    const luvioDefinitions: LuvioDefinitionNode[] = [];
    for (let i = 0; i < definitions.length; i++) {
        const definition = definitions[i];
        if (isOperationDefinitionNode(definition)) {
            luvioDefinitions.push(operationDefinitionTransform(definition));
        } else if (isFragmentDefinitionNode(definition)) {
            luvioDefinitions.push(fragmentDefinitionTransform(definition));
        } else {
            if (process.env.NODE_ENV !== 'production') {
                throw new Error(
                    `Unsupported ${definition.kind} definition. Only OperationDefinition and FragmentDefinition are supported in a GraphQL Document`
                );
            }
        }
    }

    return {
        kind,
        definitions: luvioDefinitions,
    };
}
