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
    VariableDefinitionNode,
    NonNullTypeNode,
    ListTypeNode,
    NamedTypeNode,
    FragmentSpreadNode,
    InlineFragmentNode,
    FragmentDefinitionNode,
    DefinitionNode,
    TypeNode,
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
    definitions: LuvioDefinitionNode[];
}

export type LuvioDefinitionNode = LuvioOperationDefinitionNode | LuvioFragmentDefinitionNode;

export interface LuvioOperationDefinitionNode
    extends Omit<
        OperationDefinitionNode,
        'loc' | 'name' | 'variableDefinitions' | 'directives' | 'selectionSet'
    > {
    name?: string;
    variableDefinitions?: LuvioVariableDefinitionNode[];
    directives?: LuvioDirectiveNode[];
    luvioSelections: LuvioSelectionNode[];
}

export interface LuvioVariableDefinitionNode
    extends Omit<
        VariableDefinitionNode,
        'loc' | 'variable' | 'type' | 'defaultValue' | 'directives'
    > {
    variable: LuvioVariableNode;
    type: LuvioTypeNode;
    defaultValue?: LuvioValueNode;
    directives?: LuvioDirectiveNode[];
}

export interface LuvioVariableNode extends Omit<VariableNode, 'loc' | 'name'> {
    name: string;
}

export type LuvioSelectionNode = LuvioFieldNode | LuvioFragmentSpreadNode | LuvioInlineFragmentNode;

export type LuvioFieldNode =
    | LuvioSelectionScalarFieldNode
    | LuvioSelectionObjectFieldNode
    | LuvioSelectionCustomFieldNode;

export interface LuvioArgumentNode extends Omit<ArgumentNode, 'loc' | 'name' | 'value'> {
    name: string;
    value: LuvioValueNode;
}

/* Fragments */
export interface LuvioFragmentSpreadNode
    extends Omit<FragmentSpreadNode, 'loc' | 'name' | 'directives'> {
    name: string;
    directives?: LuvioDirectiveNode[];
}

export interface LuvioInlineFragmentNode
    extends Omit<InlineFragmentNode, 'loc' | 'typeCondition' | 'directives' | 'selectionSet'> {
    typeCondition?: LuvioNamedTypeNode;
    directives?: LuvioDirectiveNode[];
    luvioSelections: LuvioSelectionNode[];
}

export interface LuvioFragmentDefinitionNode
    extends Omit<
        FragmentDefinitionNode,
        'loc' | 'name' | 'variableDefinitions' | 'typeCondition' | 'directives' | 'selectionSet'
    > {
    name: string;
    // Note: fragment variable definitions are experimental and may be changed
    // or removed in the future.
    variableDefinitions?: LuvioVariableDefinitionNode[];
    typeCondition: LuvioNamedTypeNode;
    directives?: LuvioDirectiveNode[];
    luvioSelections: LuvioSelectionNode[];
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

/* Type Reference */
export type LuvioTypeNode = LuvioNamedTypeNode | LuvioListTypeNode | LuvioNonNullTypeNode;

export interface LuvioNamedTypeNode extends Omit<NamedTypeNode, 'loc' | 'name'> {
    name: string;
}

export interface LuvioListTypeNode extends Omit<ListTypeNode, 'loc' | 'type'> {
    type: LuvioTypeNode;
}

export interface LuvioNonNullTypeNode extends Omit<NonNullTypeNode, 'loc' | 'type'> {
    type: LuvioNamedTypeNode | LuvioListTypeNode;
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

/* Util Functions */
export function isOperationDefinitionNode(input: DefinitionNode): input is OperationDefinitionNode {
    return input.kind === 'OperationDefinition';
}

export function isFragmentDefinitionNode(input: DefinitionNode): input is FragmentDefinitionNode {
    return input.kind === 'FragmentDefinition';
}

export function isNamedTypeNode(input: TypeNode): input is NamedTypeNode {
    return input.kind === 'NamedType';
}

export function isListTypeNode(input: TypeNode): input is ListTypeNode {
    return input.kind === 'ListType';
}

export function isNonNullTypeNode(input: TypeNode): input is NonNullTypeNode {
    return input.kind === 'NonNullType';
}
