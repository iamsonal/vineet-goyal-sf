import { ResourceIngest } from '@luvio/engine';
import { LuvioSelectionCustomFieldNode } from '@salesforce/lds-graphql-parser';
import { createIngest as recordCreateIngest, CUSTOM_FIELD_NODE_TYPE } from '../custom/record';
import {
    createIngest as connectionCreateIngest,
    CUSTOM_FIELD_NODE_TYPE as CUSTOM_FIELD_NODE_TYPE_CONNECTION,
} from '../custom/connection';

export const createIngest: (ast: LuvioSelectionCustomFieldNode) => ResourceIngest = (
    ast: LuvioSelectionCustomFieldNode
) => {
    const { type } = ast;
    switch (type) {
        case CUSTOM_FIELD_NODE_TYPE:
            return recordCreateIngest(ast);
        case CUSTOM_FIELD_NODE_TYPE_CONNECTION:
            return connectionCreateIngest(ast);
    }

    throw new Error(`Unsupported type: "${type}"`);
};
