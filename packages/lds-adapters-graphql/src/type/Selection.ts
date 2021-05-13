import { Reader, ReaderFragment, ResourceIngest, StoreLink } from '@luvio/engine';
import {
    LuvioSelectionNode,
    LuvioSelectionCustomFieldNode,
    LuvioSelectionObjectFieldNode,
} from '@salesforce/lds-graphql-parser';
import {
    LuvioFieldNode,
    LuvioOperationDefinitionNode,
} from '@salesforce/lds-graphql-parser/dist/ast';
import { createIngest as createCustomFieldIngest } from './CustomField';
import {
    createIngest as createObjectFieldIngest,
    createRead as createObjectFieldRead,
} from './ObjectField';
import { createRead as createOperationRead } from './Operation';
import { createRead as createConnectionRead } from '../custom/connection';

function createCustomFieldRead(sel: LuvioSelectionCustomFieldNode): ReaderFragment['read'] {
    if (sel.type === 'Connection') {
        return createConnectionRead(sel);
    }

    return createObjectFieldRead({
        name: sel.name,
        kind: 'ObjectFieldSelection',
        luvioSelections: sel.luvioSelections,
    });
}

export function resolveLink(builder: Reader<any>, storeLink: StoreLink) {
    const { __ref } = storeLink;
    const lookup = builder.storeLookup(__ref as string);
    if (lookup === undefined) {
        throw new Error('TODO: implement missing link logic');
    }
    return lookup;
}

export function followLink(
    sel: LuvioSelectionNode | LuvioOperationDefinitionNode,
    builder: Reader<any>,
    storeLink: StoreLink
) {
    const lookup = resolveLink(builder, storeLink);

    switch (sel.kind) {
        case 'ObjectFieldSelection':
            return createObjectFieldRead(sel)(lookup, builder);
        case 'OperationDefinition':
            return createOperationRead(sel)(lookup, builder);
        case 'CustomFieldSelection':
            return createCustomFieldRead(sel)(lookup, builder);
        default:
            throw new Error(`Type not implemented: "${sel.kind}"`);
    }
}

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
