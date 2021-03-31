import { DocumentNode, OperationDefinitionNode } from 'graphql/language';

type slimOperationDefinitionNode = Omit<OperationDefinitionNode, 'selectionSet' | 'loc'>;
export interface LuvioOperationDefinitionNode extends slimOperationDefinitionNode {
    selections: any[];
}

// TODO: add LuvioFragmentDefinitionNode
type LuvioDefinitionNode = LuvioOperationDefinitionNode;

type slimDocumentNode = Omit<DocumentNode, 'definitions' | 'loc'>;
export interface LuvioDocumentNode extends slimDocumentNode {
    definitions: Array<LuvioDefinitionNode>;
}
