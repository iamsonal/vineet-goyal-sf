import { AdapterRequestContext, FetchResponse } from '@luvio/engine';
import gqlParse from '@salesforce/lds-graphql-parser';
import * as gqlApi from 'force/ldsAdaptersGraphql';
import { getInstrumentation } from 'o11y/client';

import { JSONParse, ObjectKeys } from './language';
import {
    imperativeAdapterMap,
    dmlAdapterMap,
    UNSTABLE_ADAPTER_PREFIX,
    IMPERATIVE_ADAPTER_SUFFIX,
} from './lightningAdapterApi';
import { DraftQueueItemMetadata } from '@salesforce/lds-drafts';
import { draftManager } from './draftQueueImplementation';
import {
    createNativeErrorResponse,
    NON_MUTATING_ADAPTER_MESSAGE,
    NO_DRAFT_CREATED_MESSAGE,
    DRAFT_DOESNT_EXIST_MESSAGE,
    NativeFetchResponse,
} from './NativeFetchResponse';

const instr = getInstrumentation('lds-worker-api');

type CallbackValue = {
    data: any | undefined;
    error: NativeFetchResponse<unknown> | undefined;
};

export type OnSnapshot = (value: CallbackValue) => void;
export type OnResponse = (value: CallbackValue) => void;

export type Unsubscribe = () => void;

/**
 *
 * @param adapterId
 * @returns imperative adapter key
 */
function imperativeAdapterKeyBuilder(adapterId: string): string {
    if (adapterId.startsWith(UNSTABLE_ADAPTER_PREFIX)) {
        return `${adapterId}${IMPERATIVE_ADAPTER_SUFFIX}`;
    }

    return `${UNSTABLE_ADAPTER_PREFIX}${adapterId}${IMPERATIVE_ADAPTER_SUFFIX}`;
}
/**
 * Executes the adapter with the given adapterId and config.  Will call onSnapshot
 * callback with data or error.  Returns an unsubscribe function that should
 * be called to stop receiving updated snapshots.
 *
 * This function throws an error if the given adapterId cannot be found or is not
 * a GET wire adapter.  It will also throw if it fails to parse the config string.
 */
export function subscribeToAdapter(
    adapterId: string,
    config: string,
    onSnapshot: OnSnapshot,
    requestContext?: AdapterRequestContext
): Unsubscribe {
    const imperativeAdapterIdentifier = imperativeAdapterKeyBuilder(adapterId);
    const imperativeAdapter = imperativeAdapterMap[imperativeAdapterIdentifier];

    if (imperativeAdapter === undefined) {
        // This check is here for legacy purpose
        // So the consumers still get the same errors
        if (dmlAdapterMap[adapterId] === undefined) {
            throw Error(`adapter ${adapterId} not recognized`);
        }
        throw Error(`${adapterId} is not a GET wire adapter.`);
    }

    const configObject = JSONParse(config);

    // Check if it's graphQl adapter
    // Parse the query in that case
    const gqlKeys = ObjectKeys(gqlApi);
    if (gqlKeys.indexOf(imperativeAdapterIdentifier) > -1) {
        try {
            // gql config needs gql query string turned into AST object
            configObject.query = gqlParse(configObject.query);
        } catch (parseError) {
            // call the callback with error
            instr.error(parseError as Error, 'gql-parse-error');
            onSnapshot({ data: undefined, error: parseError as NativeFetchResponse<unknown> });
            return () => {};
        }
    }

    return imperativeAdapter.subscribe(configObject, requestContext, onSnapshot);
}

/**
 *  Executes a DML adapter and calls the onResponse callback upon receiving a response.
 *
 * @param adapter : DML Adapter
 * @param configObject : parsed config
 * @param onResponse : OnResponse
 */
function invokeDmlAdapter(adapter: any, configObject: any, onResponse: OnResponse) {
    adapter(configObject).then(
        (data: any) => {
            onResponse({ data, error: undefined });
        },
        (error: FetchResponse<unknown>) => {
            onResponse({ data: undefined, error });
        }
    );
}

/**
 * Executes the specified adapter with the given adapterId and config. Then
 * it replaces the draft with the given id with the draft generated
 * by the mutating adapter.  Will call onResult callback once with data or error.
 *
 * This function throws an error if the given adapterId cannot be found, or if the
 * adapterId is not a mutating adapter, or if a draft isn't created, or if it
 * fails to parse the given config string.
 */
export function invokeAdapterWithDraftToReplace(
    adapterId: string,
    config: string,
    draftIdToReplace: string,
    onResponse: OnResponse
) {
    draftManager.getQueue().then((draftInfo) => {
        const draftIds = draftInfo.items.map((draft) => draft.id);
        if (draftIds.includes(draftIdToReplace) === false) {
            onResponse({
                data: undefined,
                error: createNativeErrorResponse(DRAFT_DOESNT_EXIST_MESSAGE),
            });
            return;
        }

        const adapter = dmlAdapterMap[adapterId];
        if (adapter === undefined) {
            // This check is here for legacy purpose
            // So the consumers still get the same errors
            if (imperativeAdapterMap[imperativeAdapterKeyBuilder(adapterId)] !== undefined) {
                onResponse({
                    data: undefined,
                    error: createNativeErrorResponse(NON_MUTATING_ADAPTER_MESSAGE),
                });
                return;
            }
            throw Error(`adapter ${adapterId} not recognized`);
        }

        invokeDmlAdapter(adapter, JSONParse(config), (responseValue) => {
            const draftIds = draftIdsForResponseValue(responseValue);
            if (
                responseValue.error === undefined &&
                draftIds !== undefined &&
                draftIds.length > 0
            ) {
                const draftId = draftIds[draftIds.length - 1];
                draftManager.replaceAction(draftIdToReplace, draftId).then(() => {
                    onResponse(responseValue);
                });
            } else {
                let response: CallbackValue = responseValue;
                response.error = createNativeErrorResponse(NO_DRAFT_CREATED_MESSAGE);
                onResponse(response);
            }
        });
    });
}

/**
 * Executes the specified adapter with the given adapterId and config. Then
 * it sets the given metadata on the draft created by the mutating adapter.  Will call
 * onResult callback once with data or error.
 *
 * This function throws an error if the given adapterId cannot be found, or if the
 * adapterId is not a mutating adapter, or if a draft isn't created, or if it
 * fails to parse the given config string.
 */
export function invokeAdapterWithMetadata(
    adapterId: string,
    config: string,
    metadata: DraftQueueItemMetadata,
    onResponse: OnResponse
) {
    const adapter = dmlAdapterMap[adapterId];
    if (adapter === undefined) {
        // This check is here for legacy purpose
        // So the consumers still get the same errors
        if (imperativeAdapterMap[imperativeAdapterKeyBuilder(adapterId)] !== undefined) {
            onResponse({
                data: undefined,
                error: createNativeErrorResponse(NON_MUTATING_ADAPTER_MESSAGE),
            });
            return;
        }
        throw Error(`adapter ${adapterId} not recognized`);
    }

    invokeDmlAdapter(adapter, JSONParse(config), (responseValue) => {
        const draftIds = draftIdsForResponseValue(responseValue);
        if (responseValue.error === undefined && draftIds !== undefined && draftIds.length > 0) {
            const draftId = draftIds[draftIds.length - 1];
            draftManager.setMetadata(draftId, metadata).then(() => {
                onResponse(responseValue);
            });
        } else {
            let response: CallbackValue = responseValue;
            response.error = createNativeErrorResponse(NO_DRAFT_CREATED_MESSAGE);
            onResponse(response);
        }
    });
}

function draftIdsForResponseValue(response: CallbackValue): string[] | undefined {
    if (
        response.data !== undefined &&
        response.data.drafts !== undefined &&
        response.data.drafts.draftActionIds !== undefined
    ) {
        return response.data.drafts.draftActionIds;
    }
    return undefined;
}

/**
 * Executes the specified adapter with the given adapterId and config.  Will call
 * onResponse callback once with data or error.
 *
 * This function throws an error if the given adapterId cannot be found or if it
 * fails to parse the given config string.
 */
export function invokeAdapter(
    adapterId: string,
    config: string,
    onResponse: OnResponse,
    requestContext?: AdapterRequestContext
) {
    const imperativeAdapterIdentifier = imperativeAdapterKeyBuilder(adapterId);
    const imperativeAdapter = imperativeAdapterMap[imperativeAdapterIdentifier];
    const configObject = JSONParse(config);

    // currently all uiapi GET adapters have a corresponding imperative adapter
    if (imperativeAdapter !== undefined) {
        // Check if it's graphQl adapter
        // Parse the query in that case
        const gqlKeys = ObjectKeys(gqlApi);
        if (gqlKeys.indexOf(imperativeAdapterIdentifier) > -1) {
            try {
                // gql config needs gql query string turned into AST object
                configObject.query = gqlParse(configObject.query);
            } catch (parseError) {
                // call the callback with error
                instr.error(parseError as Error, 'gql-parse-error');
                onResponse({ data: undefined, error: parseError as NativeFetchResponse<unknown> });
                return;
            }
        }
        imperativeAdapter.invoke(configObject, requestContext, onResponse);
        return;
    }

    const adapter = dmlAdapterMap[adapterId];

    if (adapter === undefined) {
        throw Error(`adapter ${adapterId} not recognized`);
    }

    invokeDmlAdapter(adapter, configObject, onResponse);
}

/**
 * @deprecated Use invokeAdapter or subscribeToAdapter instead
 *
 * W-9173084 Will remove this
 */
export function executeAdapter(
    adapterId: string,
    config: string,
    onSnapshot: OnSnapshot
): Unsubscribe {
    return subscribeToAdapter(adapterId, config, onSnapshot);
}

/**
 * @deprecated Use invokeAdapter instead
 *
 * W-9173084 Will remove this
 */
export function executeMutatingAdapter(
    adapterId: string,
    config: string,
    onResult: OnResponse
): void {
    invokeAdapter(adapterId, config, onResult);
}
