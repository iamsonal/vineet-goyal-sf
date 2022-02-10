import type { AdapterRequestContext, CachePolicy, FetchResponse } from '@luvio/engine';
import { parseAndVisit as gqlParse } from '@luvio/graphql-parser';
import * as gqlApi from 'force/ldsAdaptersGraphql';
import { getInstrumentation } from 'o11y/client';

import { JSONParse, ObjectKeys } from './language';
import type { AdapterCallback, AdapterCallbackValue } from './lightningAdapterApi';
import {
    imperativeAdapterMap,
    dmlAdapterMap,
    UNSTABLE_ADAPTER_PREFIX,
    IMPERATIVE_ADAPTER_SUFFIX,
} from './lightningAdapterApi';
import type { DraftQueueItemMetadata } from '@salesforce/lds-drafts';
import { draftManager } from './draftQueueImplementation';
import type { NativeFetchResponse } from './NativeFetchResponse';
import {
    createNativeErrorResponse,
    NON_MUTATING_ADAPTER_MESSAGE,
    NO_DRAFT_CREATED_MESSAGE,
    DRAFT_DOESNT_EXIST_MESSAGE,
} from './NativeFetchResponse';
import { debugLog } from 'native/ldsEngineMobile';

let adapterCounter = 0;

const instr = getInstrumentation('lds-worker-api');

// Native Type Definitions
type NativeCallbackValue = {
    data: any | undefined;
    error: NativeFetchResponse<unknown> | undefined;
};
type NativeOnSnapshot = (value: NativeCallbackValue) => void;
type NativeOnResponse = (value: NativeCallbackValue) => void;
type Unsubscribe = () => void;
type NativeCachePolicy = CachePolicy;
type NativeAdapterRequestPriority = 'high' | 'normal' | 'background';
interface NativeAdapterRequestContext {
    cachePolicy?: NativeCachePolicy;
    priority?: NativeAdapterRequestPriority;
}

/**
 * Coerces a cache policy passed in from native to a luvio cache policy
 * @param nativeCachePolicy The cache policy passed in from native
 * @returns A coerced luvio cache policy
 */
function buildCachePolicy(
    nativeCachePolicy: NativeCachePolicy | undefined
): CachePolicy | undefined {
    if (nativeCachePolicy === undefined) {
        return undefined;
    }

    // currently the types match exactly, if we ever decide to deviate then we should coerce here
    return nativeCachePolicy as CachePolicy;
}

/**
 * Coerces a request context passed in from native to a luvio request context
 * @param nativeRequestContext request context passed in from native
 * @returns Coerced luvio request context
 */
function buildAdapterRequestContext(
    nativeRequestContext: NativeAdapterRequestContext | undefined
): AdapterRequestContext | undefined {
    if (nativeRequestContext === undefined) {
        return undefined;
    }
    const { cachePolicy, priority } = nativeRequestContext;
    return {
        cachePolicy: buildCachePolicy(cachePolicy),
        priority,
    };
}

function buildInvalidConfigError(error: unknown): NativeCallbackValue {
    return {
        data: undefined,
        error: {
            ok: false,
            status: 400,
            statusText: 'INVALID_CONFIG',
            body: error,
            headers: {},
        },
    };
}

function buildNativeCallbackValue(adapterCallbackValue: AdapterCallbackValue): NativeCallbackValue {
    // currently no coercion required, just retype
    return adapterCallbackValue as NativeCallbackValue;
}

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

function generateAdapterUniqueId() {
    return (adapterCounter++).toString();
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
    onSnapshot: NativeOnSnapshot,
    nativeAdapterRequestContext?: NativeAdapterRequestContext
): Unsubscribe {
    const imperativeAdapterIdentifier = imperativeAdapterKeyBuilder(adapterId);
    const imperativeAdapter = imperativeAdapterMap[imperativeAdapterIdentifier];

    const adapterUuid = generateAdapterUniqueId();

    debugLog({
        type: 'adapter-start',
        timestamp: Date.now(),
        adapterId: adapterUuid,
        adapterName: adapterId,
        config,
    });

    const onResponseDelegate: AdapterCallback = (value) => {
        debugLog({
            type: 'adapter-callback',
            timestamp: Date.now(),
            adapterId: adapterUuid,
        });
        onSnapshot(buildNativeCallbackValue(value));
    };

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
            onResponseDelegate({
                data: undefined,
                error: parseError as NativeFetchResponse<unknown>,
            });
            return () => {};
        }
    }

    try {
        return imperativeAdapter.subscribe(
            configObject,
            buildAdapterRequestContext(nativeAdapterRequestContext),
            onResponseDelegate
        );
    } catch (err) {
        onResponseDelegate(buildInvalidConfigError(err));
        return () => {};
    }
}

/**
 *  Executes a DML adapter and calls the onResponse callback upon receiving a response.
 *
 * @param adapter : DML Adapter
 * @param configObject : parsed config
 * @param onResponse : OnResponse
 */
function invokeDmlAdapter(adapter: any, configObject: any, onResponse: NativeOnResponse) {
    try {
        adapter(configObject).then(
            (data: any) => {
                onResponse({ data, error: undefined });
            },
            (error: FetchResponse<unknown>) => {
                onResponse({ data: undefined, error });
            }
        );
    } catch (err) {
        onResponse(buildInvalidConfigError(err));
    }
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
    onResponse: NativeOnResponse
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

        if (adapterId === 'deleteRecord') {
            invokeAdapterWithDraftToReplaceDeleteRecord(
                adapter,
                config,
                draftIdToReplace,
                onResponse
            );
        } else {
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
                    let response: NativeCallbackValue = responseValue;
                    response.error = createNativeErrorResponse(NO_DRAFT_CREATED_MESSAGE);
                    onResponse(response);
                }
            });
        }
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
    onResponse: NativeOnResponse
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

    if (adapterId === 'deleteRecord') {
        invokeAdapterWithMetadataDeleteRecord(adapter, config, metadata, onResponse);
    } else {
        invokeDmlAdapter(adapter, JSONParse(config), (responseValue) => {
            const draftIds = draftIdsForResponseValue(responseValue);
            if (
                responseValue.error === undefined &&
                draftIds !== undefined &&
                draftIds.length > 0
            ) {
                const draftId = draftIds[draftIds.length - 1];
                draftManager.setMetadata(draftId, metadata).then(() => {
                    onResponse(responseValue);
                });
            } else {
                let response: NativeCallbackValue = responseValue;
                response.error = createNativeErrorResponse(NO_DRAFT_CREATED_MESSAGE);
                onResponse(response);
            }
        });
    }
}

/*
//TODO W-10284305: Remove this function in 238
This is a special case version of the invokeAdapterWithMetadata function
which should only be used for the deleteRecord wire adapter, since it does not
contain record data in the result and has to do special querying of the draft queue
*/
function invokeAdapterWithMetadataDeleteRecord(
    adapter: any,
    config: string,
    metadata: DraftQueueItemMetadata,
    onResponse: NativeOnResponse
) {
    const targetedRecordId = JSONParse(config);
    let priorDraftIds: string[] | undefined;
    draftManager.getQueue().then((draftState) => {
        priorDraftIds = draftState.items.map((item) => {
            return item.id;
        });
        invokeDmlAdapter(adapter, JSONParse(config), (responseValue) => {
            if (responseValue.error === undefined && responseValue.data === undefined) {
                draftManager.getQueue().then((newState) => {
                    const draftIdsToFilter = priorDraftIds ? priorDraftIds : [];
                    const newDrafts = newState.items;
                    const addedDrafts = newDrafts.filter((item) => {
                        const isNew = draftIdsToFilter.indexOf(item.id) < 0;
                        const targetIdMatches = item.targetId === targetedRecordId;
                        return isNew && targetIdMatches;
                    });
                    if (addedDrafts.length !== 1) {
                        let response: NativeCallbackValue = responseValue;
                        response.error = createNativeErrorResponse(NO_DRAFT_CREATED_MESSAGE);
                        onResponse(response);
                    } else {
                        draftManager.setMetadata(addedDrafts[0].id, metadata).then(() => {
                            onResponse(responseValue);
                        });
                    }
                });
            } else {
                let response: NativeCallbackValue = responseValue;
                response.error = createNativeErrorResponse(NO_DRAFT_CREATED_MESSAGE);
                onResponse(response);
            }
        });
    });
}

/*
//TODO W-10284305: Remove this function in 238
This is a special case version of the invokeAdapterWithDraftToReplace function
which should only be used for the deleteRecord wire adapter, since it does not
contain record data in the result and has to do special querying of the draft queue
*/
function invokeAdapterWithDraftToReplaceDeleteRecord(
    adapter: any,
    config: string,
    draftIdToReplace: string,
    onResponse: NativeOnResponse
) {
    const targetedRecordId = JSONParse(config);
    let priorDraftIds: string[] | undefined;
    draftManager.getQueue().then((draftState) => {
        priorDraftIds = draftState.items.map((item) => {
            return item.id;
        });
        invokeDmlAdapter(adapter, JSONParse(config), (responseValue) => {
            if (responseValue.error === undefined && responseValue.data === undefined) {
                draftManager.getQueue().then((newState) => {
                    const draftIdsToFilter = priorDraftIds ? priorDraftIds : [];
                    const newDrafts = newState.items;
                    const addedDrafts = newDrafts.filter((item) => {
                        const isNew = draftIdsToFilter.indexOf(item.id) < 0;
                        const targetIdMatches = item.targetId === targetedRecordId;
                        return isNew && targetIdMatches;
                    });
                    if (addedDrafts.length !== 1) {
                        let response: NativeCallbackValue = responseValue;
                        response.error = createNativeErrorResponse(NO_DRAFT_CREATED_MESSAGE);
                        onResponse(response);
                    } else {
                        draftManager.replaceAction(draftIdToReplace, addedDrafts[0].id).then(() => {
                            onResponse(responseValue);
                        });
                    }
                });
            } else {
                let response: NativeCallbackValue = responseValue;
                response.error = createNativeErrorResponse(NO_DRAFT_CREATED_MESSAGE);
                onResponse(response);
            }
        });
    });
}

function draftIdsForResponseValue(response: NativeCallbackValue): string[] | undefined {
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
    onResponse: NativeOnResponse,
    nativeAdapterRequestContext?: NativeAdapterRequestContext
) {
    const adapterUuid = generateAdapterUniqueId();

    debugLog({
        type: 'adapter-start',
        timestamp: Date.now(),
        adapterId: adapterUuid,
        adapterName: adapterId,
        config,
    });

    const onResponseDelegate: AdapterCallback = (value) => {
        debugLog({
            type: 'adapter-callback',
            timestamp: Date.now(),
            adapterId: adapterUuid,
        });
        onResponse(buildNativeCallbackValue(value));
    };

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
                onResponseDelegate({
                    data: undefined,
                    error: parseError,
                });
                return;
            }
        }
        try {
            imperativeAdapter.invoke(
                configObject,
                buildAdapterRequestContext(nativeAdapterRequestContext),
                onResponseDelegate
            );
        } catch (err) {
            onResponseDelegate(buildInvalidConfigError(err));
        }
        return;
    }

    const adapter = dmlAdapterMap[adapterId];

    if (adapter === undefined) {
        throw Error(`adapter ${adapterId} not recognized`);
    }

    invokeDmlAdapter(adapter, configObject, onResponseDelegate);
}

/**
 * @deprecated Use invokeAdapter or subscribeToAdapter instead
 *
 * W-9173084 Will remove this
 */
export function executeAdapter(
    adapterId: string,
    config: string,
    onSnapshot: NativeOnSnapshot
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
    onResult: NativeOnResponse
): void {
    invokeAdapter(adapterId, config, onResult);
}
