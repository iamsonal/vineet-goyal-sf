/**
 * Defines configuration for the module with a default value which can be overriden by the runtime environment.
 */

/**
 * Depth to which tracked fields will be added to a request that results from a cache miss.
 * A value of 0 inhibits the addition of tracked fields, 1 will add tracked fields that can
 * be reached by following 1 relationship from the root record, etc.
 * @defaultValue '5', replicates the current behavior
 */
let trackedFieldDepthOnCacheMiss = 5;
/**
 * Depth to which tracked fields will be added to a request that results from a merge conflict
 * A value of 0 inhibits the addition of tracked fields, 1 will add tracked fields that can
 * be reached by following 1 relationship from the root record, etc.
 * @defaultValue '5', replicates the current behavior
 */
let trackedFieldDepthOnCacheMergeConflict = 5;
/**
 * Depth to which tracked fields will be added to a request that results from a notify change invocation by the consumer
 * A value of 0 inhibits the addition of tracked fields, 1 will add tracked fields that can
 * be reached by following 1 relationship from the root record, etc.
 * @defaultValue '5', replicates the current behavior
 */
let trackedFieldDepthOnNotifyChange = 5;
/**
 * Determines if we will only fetch the 'Id' field for the leaf relationship record
 * @defaultValue 'false', replicates the current behavior and fetches all fields in the store for the leaf relationship record
 */
let trackedFieldLeafNodeIdOnly = false;

/**
 * Defines the configuration API and is exposed internally as well as externally.
 */
export const configuration = {
    setTrackedFieldDepthOnCacheMiss: function (_trackedFieldDepthOnCacheMiss: number): void {
        trackedFieldDepthOnCacheMiss = _trackedFieldDepthOnCacheMiss;
    },

    getTrackedFieldDepthOnCacheMiss: function (): number {
        return trackedFieldDepthOnCacheMiss;
    },

    setTrackedFieldDepthOnCacheMergeConflict: function (
        _trackedFieldDepthOnCacheMergeConflict: number
    ): void {
        trackedFieldDepthOnCacheMergeConflict = _trackedFieldDepthOnCacheMergeConflict;
    },

    getTrackedFieldDepthOnCacheMergeConflict: function (): number {
        return trackedFieldDepthOnCacheMergeConflict;
    },
    setTrackedFieldDepthOnNotifyChange: function (_trackedFieldDepthOnNotifyChange: number): void {
        trackedFieldDepthOnNotifyChange = _trackedFieldDepthOnNotifyChange;
    },

    getTrackedFieldDepthOnNotifyChange: function (): number {
        return trackedFieldDepthOnNotifyChange;
    },

    setTrackedFieldLeafNodeIdOnly: function (_trackedFieldLeafNodeIdOnly: boolean): void {
        trackedFieldLeafNodeIdOnly = _trackedFieldLeafNodeIdOnly;
    },

    getTrackedFieldLeafNodeIdOnly: function (): boolean {
        return trackedFieldLeafNodeIdOnly;
    },
};
