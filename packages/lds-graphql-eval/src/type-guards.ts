import type {
    LuvioDefinitionNode,
    LuvioListValueNode,
    LuvioObjectValueNode,
    LuvioOperationDefinitionNode,
    LuvioSelectionCustomFieldNode,
    LuvioSelectionNode,
    LuvioSelectionObjectFieldNode,
    LuvioSelectionScalarFieldNode,
    LuvioValueNode,
} from '@luvio/graphql-parser';
import type { DataType, FieldInfo } from './info-types';
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
    let values: ComparisonOperator[] = [ComparisonOperator.eq, ComparisonOperator.like];
    return values.includes(value as ComparisonOperator);
}

export function isDefined<T>(item: T | undefined): item is T {
    return item !== undefined;
}

export function isCompoundOperator(value: string): value is CompoundOperator {
    let values: CompoundOperator[] = [CompoundOperator.and, CompoundOperator.or];
    return values.includes(value as CompoundOperator);
}

export function isIdField(fieldInfo: FieldInfo): boolean {
    return fieldInfo.apiName === 'Id' && fieldInfo.dataType === 'String';
}

export function isScalarDataType(type: DataType): boolean {
    return [
        'Boolean',
        'String',
        'Double',
        'DateTime',
        'Int',
        'WeakEtag',
        'Picklist',
        'Currency',
        'MultiPicklist',
        'Time',
        'Phone',
        'Url',
        'Email',
        'TextArea',
        'Percent',
    ].includes(type);
}
