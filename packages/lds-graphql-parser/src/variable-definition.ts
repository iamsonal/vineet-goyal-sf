import { VariableDefinitionNode } from 'graphql/language';
import { LuvioVariableDefinitionNode } from './ast';
import { transform as transformTypeNode } from './type-node';
import { transform as transformValueNode } from './value-node';

export function transform(
    variableDefinitions: VariableDefinitionNode
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
        ret.defaultValue = transformValueNode(defaultValue);
    }

    // TODO: transform directives

    return ret;
}
