import { Reader, StoreLink, StoreResolveResultFound } from '@luvio/engine';
import { LuvioSelectionNode } from '@salesforce/lds-graphql-parser';
import { LuvioFieldNode } from '@salesforce/lds-graphql-parser';
import { createRead } from '../util/read';
import { StoreResolveResult } from '@luvio/engine/dist/es/es2018/reader/resolve';

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

export function resolveKey<D>(builder: Reader<any>, key: string) {
    const { StoreResolveResultState } = builder;
    const lookup = builder.storeLookup<D>(key);
    markStoreResolveResultSeen(builder, lookup);

    switch (lookup.state) {
        case StoreResolveResultState.NotPresent:
            builder.markMissingLink(key);
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

export function resolveLink<D>(
    builder: Reader<any>,
    storeLink: StoreLink
): StoreResolveResultFound<D> | undefined {
    const { StoreLinkStateValues } = builder;
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
            throw new Error(`TODO: Invalid Link State. Link on "${builder.currentPath.fullPath}"`);
    }

    const { key: __ref } = linkState;
    return resolveKey(builder, __ref);
}

export function followLink(sel: LuvioSelectionNode, builder: Reader<any>, storeLink: StoreLink) {
    const linkState = resolveLink(builder, storeLink);
    if (linkState === undefined) {
        return;
    }

    const { value } = linkState;
    return createRead(sel)(value, builder);
}

export function getLuvioFieldNodeSelection(ast: LuvioSelectionNode): LuvioFieldNode {
    const { kind } = ast;
    if (kind === 'FragmentSpread' || kind === 'InlineFragment') {
        throw new Error('"FragmentSpread" and "InlineFragment" currently not supported');
    }

    return ast as LuvioFieldNode;
}
