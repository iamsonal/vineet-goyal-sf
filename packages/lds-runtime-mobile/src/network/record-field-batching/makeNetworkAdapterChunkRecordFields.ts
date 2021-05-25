import { NetworkAdapter } from '@luvio/engine';
import { makeNetworkChunkFieldsGetRecord } from './makeNetworkChunkFieldsGetRecord';
import { makeNetworkChunkFieldsGetRecordsBatch } from './makeNetworkChunkFieldsGetRecordsBatch';
import { makeNetworkChunkFieldsGetRelatedListRecords } from './makeNetworkChunkFieldsGetRelatedListRecords';
import { makeNetworkChunkFieldsGetRelatedListRecordsBatch } from './makeNetworkChunkFieldsGetRelatedListRecordsBatch';

/**
 * Higher order function that accepts a network adapter and returns a new network adapter
 * that is capable of performing field batching to ensure that URL length limits are respected
 * when hitting record endpoints that accept a field list
 *
 * @param networkAdapter the network adapter to do the call.
 */
export function makeNetworkAdapterChunkRecordFields(
    networkAdapter: NetworkAdapter
): NetworkAdapter {
    // endpoint handlers that support aggregate-ui field batching
    const batchHandlers = [
        makeNetworkChunkFieldsGetRecord,
        makeNetworkChunkFieldsGetRecordsBatch,
        makeNetworkChunkFieldsGetRelatedListRecords,
        makeNetworkChunkFieldsGetRelatedListRecordsBatch,
    ];

    return batchHandlers.reduce((network, handler) => {
        return handler(network);
    }, networkAdapter);
}
