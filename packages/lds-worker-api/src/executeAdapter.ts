import { FetchResponse } from '@luvio/engine';
import gqlParse from '@salesforce/lds-graphql-parser';
import * as gqlApi from 'force/ldsAdaptersGraphql';
import { getInstrumentation } from 'o11y/client';

import { JSONParse } from './language';
import { isNotAFunctionError } from './error';
import { adapterMap } from './lightningAdapterApi';

const instr = getInstrumentation('lds-worker-api');

type CallbackValue = {
    data: any | undefined;
    error: FetchResponse<unknown> | undefined;
};

export type OnSnapshot = (value: CallbackValue) => void;
export type OnResponse = (value: CallbackValue) => void;

export type Unsubscribe = () => void;

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
    onSnapshot: OnSnapshot
): Unsubscribe {
    const wireConstructor = (adapterMap as any)[adapterId];

    if (wireConstructor === undefined) {
        throw Error(`adapter ${adapterId} not recognized`);
    }

    let wire: any;

    try {
        wire = new wireConstructor((value: CallbackValue) => {
            // lwc-luvio wire adapters always emit an initial payload with
            // data and error as undefined.  This is a quirk of LWC and native
            // UI does not need to know about this, so we only emit payloads
            // that actually have defined data or error
            const { data, error } = value;
            if (data !== undefined || error !== undefined) {
                onSnapshot({ data, error });
            }
        });
    } catch (constructorError) {
        if (isNotAFunctionError(constructorError)) {
            throw Error(`${adapterId} is not a GET wire adapter.`);
        }

        throw constructorError;
    }

    wire.connect();

    const configObject = JSONParse(config);
    // iterate the things exported by GQL and parse the query if the adapter name matches
    const gqlKeys = Object.keys(gqlApi);
    for (let i = 0, len = gqlKeys.length; i < len; i++) {
        const key = gqlKeys[i];
        if (key === adapterId) {
            try {
                // gql config needs gql query string turned into AST object
                configObject.query = gqlParse(configObject.query);
            } catch (parseError) {
                // call the callback with error
                instr.error(parseError, 'gql-parse-error');
                onSnapshot({ data: undefined, error: parseError });
                return () => {
                    if (wire !== undefined) {
                        wire.disconnect();
                    }
                };
            }
            break;
        }
    }

    wire.update(configObject);

    return () => {
        if (wire !== undefined) {
            wire.disconnect();
        }
    };
}

/**
 * Executes the specified adapter with the given adapterId and config.  Will call
 * onResult callback once with data or error.
 *
 * This function throws an error if the given adapterId cannot be found or if it
 * fails to parse the given config string.
 */
export function invokeAdapter(adapterId: string, config: string, onResponse: OnResponse) {
    const adapter = (adapterMap as any)[adapterId];

    if (adapter === undefined) {
        throw Error(`adapter ${adapterId} not recognized`);
    }

    const configObject = JSONParse(config);
    // iterate the things exported by GQL and parse the query if the adapter name matches
    const gqlKeys = Object.keys(gqlApi);
    for (let i = 0, len = gqlKeys.length; i < len; i++) {
        const key = gqlKeys[i];
        if (key === adapterId) {
            try {
                // gql config needs gql query string turned into AST object
                configObject.query = gqlParse(configObject.query);
            } catch (parseError) {
                // call the callback with error
                instr.error(parseError, 'gql-parse-error');
                onResponse({ data: undefined, error: parseError });
                return;
            }
            break;
        }
    }

    let wire: any;
    try {
        wire = new adapter((value: CallbackValue) => {
            // lwc-luvio wire adapters always emit an initial payload with
            // data and error as undefined.  This is a quirk of LWC and native
            // UI does not need to know about this, so we only emit payloads
            // that actually have defined data or error
            const { data, error } = value;
            if (data !== undefined || error !== undefined) {
                onResponse({ data, error });
                wire.disconnect();
            }
        });
        wire.connect();
        wire.update(configObject);
    } catch (constructorError) {
        if (isNotAFunctionError(constructorError)) {
            // if we get this error, this is a DML adapter
            adapter(configObject).then(
                (data: any) => {
                    onResponse({ data, error: undefined });
                },
                (error: FetchResponse<unknown>) => {
                    onResponse({ data: undefined, error });
                }
            );
        } else {
            throw constructorError;
        }
    }
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
