// so eslint doesn't complain about nimbus
/* global __nimbus */

import {
    DraftAction,
    DraftQueue,
    DraftActionMap,
    ProcessActionResult,
    DraftQueueState,
    DraftQueueChangeListener,
    Action,
    DraftActionMetadata,
    ActionHandler,
    CustomActionExecutor,
} from '@salesforce/lds-drafts';
import { JSONParse, JSONStringify, ObjectKeys } from './utils/language';

/**
 * An implementation of the DraftQueue interface which serializes
 * requests and sends them across the Nimbus bridge and deserializes the result.
 *
 * This instance is leveraged in the LMR webview which proxies DraftQueue requests
 * to a concrete implementation running in jscore.
 */
export class NimbusDraftQueue implements DraftQueue {
    enqueue<Response, Data>(action: Action<Data>): Promise<DraftAction<Response, Data>> {
        const { tag, targetId } = action;
        const serializedAction = JSONStringify(action);
        // TODO: W-9400488 - remove tag and targetId parameters when interface is updated
        return new Promise((resolve, reject) => {
            __nimbus.plugins.LdsDraftQueue.enqueue(
                serializedAction,
                tag,
                targetId,
                (serializedAction) => {
                    const response = JSONParse(serializedAction) as DraftAction<Response, Data>;
                    resolve(response);
                },
                (serializedError) => {
                    reject(JSONParse(serializedError));
                }
            );
        });
    }

    getActionsForTags(tags: { [tag: string]: true }): Promise<DraftActionMap> {
        const keys = ObjectKeys(tags);
        return new Promise((resolve, reject) => {
            __nimbus.plugins.LdsDraftQueue.getActionsForTags(
                keys,
                (serializedMap) => {
                    const map = JSONParse(serializedMap) as DraftActionMap;
                    resolve(map);
                },
                (serializedError) => {
                    reject(JSONParse(serializedError));
                }
            );
        });
    }

    registerOnChangedListener(_listener: DraftQueueChangeListener): () => Promise<void> {
        // no-op here because any changes to durable store as a result of an upload
        // will already get processed by the durable store notify change listener
        return Promise.resolve;
    }

    processNextAction(): Promise<ProcessActionResult> {
        return Promise.reject('Cannot call processNextAction from the NimbusDraftQueue');
    }

    getQueueActions(): Promise<DraftAction<unknown, unknown>[]> {
        return Promise.reject('Cannot call getQueueActions from the NimbusDraftQueue');
    }

    getQueueState(): DraftQueueState {
        throw new Error('Cannot call getQueueState from the NimbusDraftQueue');
    }

    removeDraftAction(_actionId: string): Promise<void> {
        return Promise.reject('Cannot call removeDraftAction from the NimbusDraftQueue');
    }

    startQueue(): Promise<void> {
        return Promise.reject('Cannot call startQueue from the NimbusDraftQueue');
    }

    stopQueue(): Promise<void> {
        return Promise.reject('Cannot call stopQueue from the NimbusDraftQueue');
    }

    replaceAction(
        _actionId: string,
        _withActionId: string
    ): Promise<DraftAction<unknown, unknown>> {
        return Promise.reject('Cannot call replaceAction from the NimbusDraftQueue');
    }

    setMetadata(
        _actionId: string,
        _metadata: DraftActionMetadata
    ): Promise<DraftAction<unknown, unknown>> {
        return Promise.reject('Cannot call setMetadata from the NimbusDraftQueue');
    }

    addHandler<Data>(_id: string, _handler: ActionHandler<Data>): Promise<void> {
        return Promise.reject('Cannot call setMetadata from the NimbusDraftQueue');
    }

    addCustomHandler(_id: string, _executor: CustomActionExecutor): Promise<void> {
        return Promise.reject('Cannot call setMetadata from the NimbusDraftQueue');
    }

    removeHandler(_id: string): Promise<void> {
        return Promise.reject('Cannot call setMetadata from the NimbusDraftQueue');
    }
}
