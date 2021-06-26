/* istanbul ignore file */
// TODO W-9523236 - add test coverage for this file and remove above comment

import { DraftQueue as NimbusDraftQueue } from '@mobileplatform/nimbus-plugin-lds';

import { JSONParse, JSONStringify, ObjectCreate } from './language';
import { draftQueue } from './draftQueueImplementation';

/**
 * Implements the DraftQueue interface from nimbus-plugin-lds by passing requests
 * to the instance of the lds-drafts' DraftQueue implementation
 */
export const nimbusDraftQueue: NimbusDraftQueue = {
    enqueue(
        serializedRequest: string,
        _tag: string,
        _targetId: string,
        onActionEnqueued: (serializedAction: string) => void,
        onError: (serializedError: string) => void
    ): void {
        draftQueue
            .enqueue(JSONParse(serializedRequest))
            .then((result) => {
                onActionEnqueued(JSONStringify(result));
            })
            .catch((error) => {
                onError(JSONStringify(error));
            });
    },

    getActionsForTags(
        tags: string[],
        resultCallback: (serializedActions: string) => void,
        onError: (serializedError: string) => void
    ): void {
        const tagMap = ObjectCreate(null);
        for (let i = 0, len = tags.length; i < len; i++) {
            const tag = tags[i];
            tagMap[tag] = true;
        }
        draftQueue
            .getActionsForTags(tagMap)
            .then((result) => {
                resultCallback(JSONStringify(result));
            })
            .catch((error) => {
                onError(JSONStringify(error));
            });
    },
};
