import { ResourceIngest } from '@luvio/engine';
import { LuvioSelectionCustomFieldNode } from '@salesforce/lds-graphql-parser';
import { createIngest as createRecordIngest, CUSTOM_FIELD_NODE_TYPE } from '../custom/record';

export const createIngest: (ast: LuvioSelectionCustomFieldNode) => ResourceIngest = (
    ast: LuvioSelectionCustomFieldNode
) => {
    const { type } = ast;
    switch (type) {
        case CUSTOM_FIELD_NODE_TYPE:
            return createRecordIngest(ast);
    }

    throw new Error(`Unsupported type: "${type}"`);
};
