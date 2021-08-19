import { ResourceIngest } from '@luvio/engine';
import { LuvioSelectionCustomFieldNode } from '@salesforce/lds-graphql-parser';
import { createIngest as recordCreateIngest, CUSTOM_FIELD_NODE_TYPE } from '../custom/record';
import {
    keyBuilder as connectionKeyBuilder,
    createIngest as connectionCreateIngest,
    CUSTOM_FIELD_NODE_TYPE as CUSTOM_FIELD_NODE_TYPE_CONNECTION,
} from '../custom/connection';
import { GraphQLVariables } from './Variable';

export const createIngest: (
    ast: LuvioSelectionCustomFieldNode,
    variables: GraphQLVariables
) => ResourceIngest = (ast: LuvioSelectionCustomFieldNode, variables: GraphQLVariables) => {
    const { type } = ast;
    switch (type) {
        case CUSTOM_FIELD_NODE_TYPE:
            return recordCreateIngest(ast, variables);
        case CUSTOM_FIELD_NODE_TYPE_CONNECTION:
            return connectionCreateIngest(ast, connectionKeyBuilder(ast, variables), variables);
    }

    // eslint-disable-next-line @salesforce/lds/no-error-in-production
    throw new Error(`Unsupported type: "${type}"`);
};
