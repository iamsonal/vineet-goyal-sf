import { VariableDefinitionNode } from 'graphql/language';
import { LuvioVariableDefinitionNode } from './ast';
import { TransformState } from './operation/query';
import { transform as transformTypeNode } from './type-node';
import { transform as transformValueNode } from './value-node';

export function transform(
    variableDefinitions: VariableDefinitionNode,
    transformState: TransformState
): LuvioVariableDefinitionNode {
    const {
        kind,
        variable: {
            kind: variableKind,
            name: { value: variableName },
        },
        type,
        defaultValue,
    } = variableDefinitions;
    const ret: LuvioVariableDefinitionNode = {
        kind,
        variable: {
            kind: variableKind,
            name: variableName,
        },
        type: transformTypeNode(type),
    };

    if (defaultValue !== undefined) {
        const value = transformValueNode(defaultValue, transformState);
        ret.defaultValue = value;
    }

    // eslint-disable-next-line @salesforce/lds/no-invalid-todo
    // TODO: transform directives

    return ret;
}
