import {
    Reader,
    ReaderFragment,
    ResourceIngest,
    StoreLink,
    StoreResolveResultFound,
} from '@luvio/engine';
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
import { StoreResolveResult } from '@luvio/engine/dist/es/es2018/reader/resolve';

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

function markStoreResolveResultSeen(builder: Reader<any>, state: StoreResolveResult<unknown>) {
    const { redirects, resolvedKey } = state;
    builder.markSeenId(resolvedKey);

    const { length: len } = redirects;
    if (len === 0) {
        return;
    }

    for (let i = 0; i < len; i += 1) {
        builder.markSeenId(redirects[i]);
    }
}

export function resolveLink<D>(
    builder: Reader<any>,
    storeLink: StoreLink
): StoreResolveResultFound<D> | undefined {
    const { StoreLinkStateValues, StoreResolveResultState } = builder;
    const linkState = builder.getLinkState(storeLink);

    switch (linkState.state) {
        case StoreLinkStateValues.RefNotPresent:
        case StoreLinkStateValues.NotPresent:
        case StoreLinkStateValues.Missing:
            builder.markMissing();
            return;
        case StoreLinkStateValues.Pending:
            builder.markPending();
            return;
        case StoreLinkStateValues.Null:
            throw new Error(`TODO: Invalid Link State. Link on "${builder.currentPath.fullPath}"}`);
    }

    const { key: __ref } = linkState;
    const lookup = builder.storeLookup<D>(__ref);
    markStoreResolveResultSeen(builder, lookup);

    switch (lookup.state) {
        case StoreResolveResultState.NotPresent:
            builder.markMissingLink(__ref);
            return;
        case StoreResolveResultState.Stale:
            builder.markStale();
            return;
        case StoreResolveResultState.Locked:
            builder.markLocked();
            return;
        case StoreResolveResultState.Error:
            throw new Error('TODO: Implement error links');
    }

    return lookup;
}

export function followLink(
    sel: LuvioSelectionNode | LuvioOperationDefinitionNode,
    builder: Reader<any>,
    storeLink: StoreLink
) {
    const linkState = resolveLink(builder, storeLink);
    if (linkState === undefined) {
        return;
    }

    const { value } = linkState;
    switch (sel.kind) {
        case 'ObjectFieldSelection':
            return objectFieldCreateRead(sel)(value, builder);
        case 'OperationDefinition':
            return operationCreateRead(sel)(value, builder);
        case 'CustomFieldSelection':
            return createCustomFieldRead(sel)(value, builder);
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
