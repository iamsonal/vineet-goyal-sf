import { NetworkAdapter } from '@luvio/engine';
import { makeNetworkBatchGetRecordFields } from './makeNetworkBatchGetRecordFields';
import { makeNetworkBatchGetRelatedListRecordsFields } from './makeNetworkBatchGetRelatedListRecordsFields';

/**
 * Higher order function that accepts a network adapter and returns a new network adapter
 * that is capable of performing field batching to ensure that URL length limits are respected
 * when hitting record endpoints that accept a field list
 *
 * @param networkAdapter the network adapter to do the call.
 */
export function makeNetworkAdapterBatchRecordFields(
    networkAdapter: NetworkAdapter
): NetworkAdapter {
    // endpoint handlers that support aggregate-ui field batching
    const batchHandlers = [
        makeNetworkBatchGetRecordFields,
        makeNetworkBatchGetRelatedListRecordsFields,
    ];

    return batchHandlers.reduce((network, handler) => {
        return handler(network);
    }, networkAdapter);
}
