// so eslint doesn't complain about nimbus
/* global __nimbus */

import { ResourceRequest } from '@ldsjs/engine';
import {
    DraftAction,
    DraftQueue,
    DraftActionMap,
    DraftQueueCompletedListener,
    ProcessActionResult,
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
    enqueue<T>(request: ResourceRequest, tag: string): Promise<DraftAction<T>> {
        const serializedRequest = JSONStringify(request);
        return new Promise((resolve, reject) => {
            __nimbus.plugins.LdsDraftQueue.enqueue(
                serializedRequest,
                tag,
                serializedAction => {
                    const response = JSONParse(serializedAction) as DraftAction<T>;
                    resolve(response);
                },
                serializedError => {
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
                serializedMap => {
                    const map = JSONParse(serializedMap) as DraftActionMap;
                    resolve(map);
                },
                serializedError => {
                    reject(JSONParse(serializedError));
                }
            );
        });
    }
    registerDraftQueueCompletedListener(_listener: DraftQueueCompletedListener): void {
        if (process.env.NODE_ENV !== 'production') {
            throw new Error('Cannot register draft queue listeners through the NimbusDraftQueue');
        }
    }
    processNextAction(): Promise<ProcessActionResult> {
        return Promise.reject('Cannot call processNextAction from the NimbusDraftQueue');
    }
}
