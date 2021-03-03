// NOTE: do not remove this import, even though it looks unused it is necessary
// for TS module merging to work properly
import { NimbusPlugins } from 'nimbus-types';
declare module 'nimbus-types' {
    export interface NimbusPlugins {
        LdsDraftQueue: DraftQueue;
    }
}

/**
 * Defines the DraftQueue that allows LDS running in the webview to interact with the
 * DraftQueue instance running in JSCore. Since the method parameters are opaque
 * to the native container everything passed into the nimbus plugin is serialized
 * and the jscore-side of the plugin implementation will perform the
 * serialization/deserialization of the parameters
 */
export interface DraftQueue {
    /**
     * Enqueues a DraftAction in the DraftQueue
     * @param serializedRequest Serialized draft resource request
     * @param tag Tag to associate the draft action with
     * @param onActionEnqueued Callback containing a serialized DraftAction after result is enqueued
     * @param onError Error callback containing serialized error
     */
    enqueue(
        serializedRequest: string,
        tag: string,
        targetId: string,
        onActionEnqueued: (serializedAction: string) => void,
        onError: (serializedError: string) => void
    ): void;

    /**
     * Retrieves ordered actions for all requested tags
     * @param tags tags to return actions for
     * @param resultCallback Callback containing a serialized map of draft actions
     * @param onError Callback containing a serialized error
     */
    getActionsForTags(
        tags: string[],
        resultCallback: (serializedActions: string) => void,
        onError: (serializedError: string) => void
    ): void;
}
