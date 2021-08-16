import { LuvioVariableDefinitionNode, LuvioValueNode } from '@salesforce/lds-graphql-parser';
import { untrustedIsObject } from '../util/adapter';

export type GraphQLVariables = Record<string, unknown>;

export function isGraphQLVariables(unknown: unknown): unknown is GraphQLVariables {
    return untrustedIsObject(unknown);
}

export function validateVariableDefinitions(
    definitons: LuvioVariableDefinitionNode[],
    variables: GraphQLVariables
): string[] {
    const errors: string[] = [];
    for (let i = 0, len = definitons.length; i < len; i += 1) {
        const { variable, type, defaultValue } = definitons[i];

        const value = getVariableValue(variable.name, variables, defaultValue);

        if (value === undefined) {
            errors.push(`Variable $${variable.name} has an undefined value provided for it.`);
        }

        if (type.kind === 'NonNullType' && value === null) {
            errors.push(`Expected a non-null value to be provided as value for $${variable.name}`);
        }

        if (type.kind === 'ListType' && value !== null && !Array.isArray(value)) {
            errors.push(`Expected a list to be provided as value for $${variable.name}`);
        }
    }
    return errors;
}

function getVariableValue(
    name: string,
    variables: GraphQLVariables,
    defaultValue: LuvioValueNode | undefined
) {
    if (name in variables) {
        return variables[name];
    }
    if (defaultValue === undefined) {
        return null;
    }
    return defaultValue;
}
