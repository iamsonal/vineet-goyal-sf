import { LuvioOperationDefinitionNode } from '@salesforce/lds-graphql-parser';
import { GraphQLVariables, validateVariableDefinitions } from './Variable';

export { createRead } from '../util/read';
export { createIngest } from '../util/ingest';

export function validate(ast: LuvioOperationDefinitionNode, variables: GraphQLVariables): string[] {
    const { variableDefinitions } = ast;
    const errors: string[] = [];
    if (variableDefinitions !== undefined) {
        errors.push(...validateVariableDefinitions(variableDefinitions, variables));
    }
    return errors;
}
