import {
    DocumentNode,
    OperationDefinitionNode,
    FieldNode,
    ArgumentNode,
    IntValueNode,
    ListValueNode,
    ObjectValueNode,
    FloatValueNode,
    StringValueNode,
    BooleanValueNode,
    NullValueNode,
    EnumValueNode,
    VariableNode,
    DirectiveNode,
} from 'graphql/language';

/**
 * Luvio specific custom GraphQL AST
 *
 * - Omit Location
 * - flatten NameNode for easier value access
 * - Add luvioSelections for custom selections
 * - LuvioSelectionCustomFieldNode for fields with custom client side directives
 */

/* Document */
export interface LuvioDocumentNode extends Omit<DocumentNode, 'loc' | 'definitions'> {
    definitions: Array<LuvioDefinitionNode>;
}

// TODO: add LuvioFragmentDefinitionNode
type LuvioDefinitionNode = LuvioOperationDefinitionNode;

export interface LuvioOperationDefinitionNode
    extends Omit<OperationDefinitionNode, 'loc' | 'name' | 'selectionSet'> {
    name?: string;
    luvioSelections: LuvioSelectionNode[];
}

export interface LuvioVariableNode extends Omit<VariableNode, 'loc' | 'name'> {
    name: string;
}

// TODO: add LuvioFragmentSpreadNode and LuvioInlineFragmentNode
export type LuvioSelectionNode = LuvioFieldNode;

export type LuvioFieldNode =
    | LuvioSelectionScalarFieldNode
    | LuvioSelectionObjectFieldNode
    | LuvioSelectionCustomFieldNode;

export interface LuvioArgumentNode extends Omit<ArgumentNode, 'loc' | 'name' | 'value'> {
    name: string;
    value: LuvioValueNode;
}

/* Values */
export type LuvioValueNode =
    | LuvioVariableNode
    | IntValueNode
    | FloatValueNode
    | StringValueNode
    | BooleanValueNode
    | NullValueNode
    | EnumValueNode
    | LuvioListValueNode
    | LuvioObjectValueNode;

export interface LuvioListValueNode extends Omit<ListValueNode, 'loc' | 'values'> {
    values: LuvioValueNode[];
}

export interface LuvioObjectValueNode extends Omit<ObjectValueNode, 'loc' | 'fields'> {
    fields: {
        [name: string]: LuvioValueNode;
    };
}

/* Directives */
export interface LuvioDirectiveNode extends Omit<DirectiveNode, 'loc' | 'name' | 'arguments'> {
    name: string;
    arguments?: LuvioArgumentNode[];
}

/* Custom Selection Fields */
export interface LuvioSelectionScalarFieldNode
    extends Omit<
        FieldNode,
        'kind' | 'loc' | 'alias' | 'name' | 'arguments' | 'directives' | 'selectionSet'
    > {
    kind: 'ScalarFieldSelection';
    name: string;
}

export interface LuvioSelectionObjectFieldNode
    extends Omit<
        FieldNode,
        'kind' | 'loc' | 'alias' | 'name' | 'arguments' | 'directives' | 'selectionSet'
    > {
    kind: 'ObjectFieldSelection';
    alias?: string;
    name: string;
    arguments?: LuvioArgumentNode[];
    directives?: LuvioDirectiveNode[];
    luvioSelections?: LuvioSelectionNode[];
}

export interface LuvioSelectionCustomFieldNode extends Omit<LuvioSelectionObjectFieldNode, 'kind'> {
    kind: 'CustomFieldSelection';
    type: string;
}
