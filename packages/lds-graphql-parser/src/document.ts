import { DocumentNode } from 'graphql/language';
import { LuvioDocumentNode, LuvioDefinitionNode, isOperationDefinitionNode } from './ast';
import { transform as OperationDefinitionTransform } from './operation';

export function transform(root: DocumentNode): LuvioDocumentNode {
    const { kind, definitions } = root;
    const luvioDefinitions: LuvioDefinitionNode[] = [];
    for (let i = 0; i < definitions.length; i++) {
        const definition = definitions[i];
        if (isOperationDefinitionNode(definition)) {
            luvioDefinitions.push(OperationDefinitionTransform(definition));
        }
    }

    return {
        kind,
        definitions: luvioDefinitions,
    };
}
