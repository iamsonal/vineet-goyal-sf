import { ValueNode } from 'graphql/language';
import { LuvioValueNode } from './ast';
import { TransformState } from './operation/query';

export function transform(node: ValueNode, transformState: TransformState): LuvioValueNode {
    switch (node.kind) {
        case 'Variable':
            transformState.variablesUsed[node.name.value] = true;
            return {
                kind: 'Variable',
                name: node.name.value,
            };
        case 'IntValue':
            return {
                kind: 'IntValue',
                value: node.value,
            };
        case 'FloatValue':
            return {
                kind: 'FloatValue',
                value: node.value,
            };
        case 'StringValue':
            return {
                kind: 'StringValue',
                value: node.value,
            };
        case 'BooleanValue':
            return {
                kind: 'BooleanValue',
                value: node.value,
            };
        case 'EnumValue':
            return {
                kind: 'EnumValue',
                value: node.value,
            };
        case 'NullValue':
            return {
                kind: 'NullValue',
            };
        case 'ListValue': {
            const values = [];
            for (var index = 0; index < node.values.length; index++) {
                const value = transform(node.values[index], transformState);
                values.push(value);
            }

            return {
                kind: 'ListValue',
                values: values,
            };
        }
        case 'ObjectValue': {
            const { fields } = node;
            const result: { [name: string]: LuvioValueNode } = {};
            fields.forEach((field) => {
                const name = field.name.value;
                const value = transform(field.value, transformState);
                result[name] = value;
            });

            return {
                kind: 'ObjectValue',
                fields: result,
            };
        }
        default:
            // eslint-disable-next-line @salesforce/lds/no-error-in-production
            throw new Error('Unsupported ValueNode kind');
    }
}
