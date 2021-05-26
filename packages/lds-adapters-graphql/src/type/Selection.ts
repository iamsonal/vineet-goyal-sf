import { Reader, ReaderFragment, ResourceIngest, StoreLink } from '@luvio/engine';
import {
    LuvioSelectionNode,
    LuvioSelectionCustomFieldNode,
    LuvioSelectionObjectFieldNode,
} from '@salesforce/lds-graphql-parser';
import { LuvioFieldNode, LuvioOperationDefinitionNode } from '@salesforce/lds-graphql-parser';
import { createIngest as createCustomFieldIngest } from './CustomField';
import {
    createIngest as objectFieldCreateIngest,
    createRead as objectFieldCreateRead,
} from './ObjectField';
import { createRead as operationCreateRead } from './Operation';
import { createRead as connectionCreateRead } from '../custom/connection';
import { createRead as recordCreateRead } from '../custom/record';

function createCustomFieldRead(sel: LuvioSelectionCustomFieldNode): ReaderFragment['read'] {
    if (sel.type === 'Connection') {
        return connectionCreateRead(sel);
    }

    return recordCreateRead(sel);
}

export enum PropertyLookupResultState {
    Missing,
    Present,
}
interface PropertyLookupResultMissing {
    state: PropertyLookupResultState.Missing;
}

interface PropertyLookupResultPresent {
    state: PropertyLookupResultState.Present;
    value: any;
}

type PropertyLookupResult = PropertyLookupResultMissing | PropertyLookupResultPresent;

const objectPrototypeHasOwnProperty = Object.prototype.hasOwnProperty;

export function propertyLookup(
    builder: Reader<any>,
    key: string,
    source: any
): PropertyLookupResult {
    if (objectPrototypeHasOwnProperty.call(source, key) === false) {
        builder.markMissing();
        return {
            state: PropertyLookupResultState.Missing,
        };
    }

    return {
        state: PropertyLookupResultState.Present,
        value: source[key],
    } as PropertyLookupResultPresent;
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
            return objectFieldCreateRead(sel)(lookup, builder);
        case 'OperationDefinition':
            return operationCreateRead(sel)(lookup, builder);
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
            return objectFieldCreateIngest(ast as LuvioSelectionObjectFieldNode);
    }

    throw new Error(`Unsupported "${kind}"`);
};
