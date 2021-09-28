/* istanbul ignore file */
// TODO [W-9523236]: add test coverage for this file and remove above comment

import { DraftQueue as NimbusDraftQueue } from '@mobileplatform/nimbus-plugin-lds';

import { IsArray, JSONParse, JSONStringify, ObjectCreate } from './language';
import { draftQueue } from './draftQueueImplementation';

// A allowlist of methods that we allow to be proxied from another LDS instance
const allowList: string[] = ['enqueue', 'getActionsForTags', 'getQueueActions'];

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

    callProxyMethod(
        methodName: string,
        serializedArgsArray: string,
        resultCallback: (serializedResult: string) => void,
        errorCallback: (serializedError: string) => void
    ): void {
        const method = (draftQueue as any)[methodName] as Function;

        if (method === undefined) {
            return errorCallback(
                JSONStringify({
                    message: 'Method does not exist on the draft queue',
                })
            );
        }

        if (allowList.includes(methodName) === false) {
            return errorCallback(
                JSONStringify({
                    message: `Method ${methodName} is not available for proxy invocation`,
                })
            );
        }

        const parsedArgs = JSONParse(serializedArgsArray);

        // TODO [W-9933226]: we should validate the argument list based on which method is being called
        if (IsArray(parsedArgs) === false) {
            return errorCallback(
                JSONStringify({
                    message: 'expected array argument list',
                })
            );
        }

        let methodResult = undefined;

        try {
            if (parsedArgs === undefined) {
                methodResult = method.call(draftQueue);
            } else {
                methodResult = method.call(draftQueue, ...parsedArgs);
            }
        } catch (err) {
            return errorCallback(JSONStringify(err));
        }

        if (methodResult.then === undefined) {
            return resultCallback(JSONStringify(methodResult));
        }

        methodResult
            .then((result: any) => {
                resultCallback(JSONStringify(result));
            })
            .catch((err: any) => {
                errorCallback(JSONStringify(err));
            });
    },
};
