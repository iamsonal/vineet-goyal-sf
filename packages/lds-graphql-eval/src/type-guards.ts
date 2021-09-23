import {
    LuvioDefinitionNode,
    LuvioListValueNode,
    LuvioObjectValueNode,
    LuvioOperationDefinitionNode,
    LuvioSelectionCustomFieldNode,
    LuvioSelectionNode,
    LuvioSelectionObjectFieldNode,
    LuvioSelectionScalarFieldNode,
    LuvioValueNode,
} from '@salesforce/lds-graphql-parser/dist/ast';
import { ComparisonOperator, CompoundOperator } from './Predicate';

export function isListValueNode(node: LuvioValueNode): node is LuvioListValueNode {
    return node.kind === 'ListValue';
}

export function isObjectFieldSelection(
    node: LuvioSelectionNode | undefined
): node is LuvioSelectionObjectFieldNode {
    return node !== undefined && node.kind === 'ObjectFieldSelection';
}

export function isCustomFieldNode(
    node: LuvioSelectionNode | undefined
): node is LuvioSelectionCustomFieldNode {
    return node !== undefined && node.kind === 'CustomFieldSelection';
}

export function isScalarFieldNode(
    node: LuvioSelectionNode | undefined
): node is LuvioSelectionScalarFieldNode {
    return node !== undefined && node.kind === 'ScalarFieldSelection';
}

export function isOperationDefinition(
    node: LuvioDefinitionNode
): node is LuvioOperationDefinitionNode {
    return node.kind === 'OperationDefinition';
}

export function isObjectValueNode(node: LuvioValueNode): node is LuvioObjectValueNode {
    return node.kind === 'ObjectValue';
}

export type ExtractKind<A> = A extends { kind: infer T } ? T : never;

export function is<T extends { kind: ExtractKind<T> }>(
    node: { kind: ExtractKind<LuvioValueNode> },
    kind: ExtractKind<T>
): node is T {
    return node.kind === kind;
}

export function isComparisonOperator(value: string): value is ComparisonOperator {
    let values: ComparisonOperator[] = ['eq', 'like'];
    return values.includes(value as ComparisonOperator);
}

export function isDefined<T>(item: T | undefined): item is T {
    return item !== undefined;
}

export function isCompoundOperator(value: string): value is CompoundOperator {
    let values: CompoundOperator[] = ['and', 'or'];
    return values.includes(value as CompoundOperator);
}
