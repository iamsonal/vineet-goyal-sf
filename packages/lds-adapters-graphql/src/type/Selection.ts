import { ResourceIngest } from '@luvio/engine';
import {
    LuvioSelectionNode,
    LuvioSelectionCustomFieldNode,
    LuvioSelectionObjectFieldNode,
} from '@salesforce/lds-graphql-parser';
import { LuvioFieldNode } from '@salesforce/lds-graphql-parser/dist/ast';
import { createIngest as createCustomFieldIngest } from './CustomField';
import { createIngest as createObjectFieldIngest } from './ObjectField';

export function getLuvioFieldNodeSelection(ast: LuvioSelectionNode): LuvioFieldNode {
    const { kind } = ast;
    if (kind === 'FragmentSpread' || kind === 'InlineFragment') {
        throw new Error('"FragmentSpread" and "InlineFragment" currently not supported');
    }

    return ast as LuvioFieldNode;
}

export const createIngest: (ast: LuvioSelectionNode) => ResourceIngest = (
    ast: LuvioSelectionNode
) => {
    const { kind } = ast;
    switch (kind) {
        case 'CustomFieldSelection':
            return createCustomFieldIngest(ast as LuvioSelectionCustomFieldNode);
        case 'ObjectFieldSelection':
            return createObjectFieldIngest(ast as LuvioSelectionObjectFieldNode);
    }

    throw new Error(`Unsupported "${kind}"`);
};
