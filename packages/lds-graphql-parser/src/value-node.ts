import { ValueNode } from 'graphql/language';
import { LuvioValueNode } from './ast';

export function transform(node: ValueNode): LuvioValueNode {
    switch (node.kind) {
        case 'Variable':
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
            const values = node.values.map((value) => {
                return transform(value);
            });

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
                result[name] = transform(field.value);
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
