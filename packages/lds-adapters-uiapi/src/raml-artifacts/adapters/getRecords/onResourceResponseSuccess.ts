import { CompositeFulfilledSnapshot, Luvio, ResourceResponse } from '@luvio/engine';
import { buildNetworkSnapshot } from '../../../generated/adapters/getRecords';
import { snapshotRefreshOptions } from '../../../generated/adapters/adapter-utils';
import {
    ResourceRequestConfig,
    keyBuilder,
} from '../../../generated/resources/getUiApiRecordsBatchByRecordIds';
import { BatchRepresentation } from '../../../generated/types/BatchRepresentation';
import { ingestSuccessChildResourceParams } from '../../resources/getUiApiRecordsBatchByRecordIds/ingestSuccessChildResourceParams';
import { GetRecordsConfig } from './GetRecordsConfig';
import { adapterFragment } from './adapterFragment';
import { createChildResourceParams } from './createChildResourceParams';

export function onResourceResponseSuccess(
    luvio: Luvio,
    config: GetRecordsConfig,
    resourceParams: ResourceRequestConfig,
    response: ResourceResponse<BatchRepresentation>
) {
    const childEnvelopes = response.body.results;
    const childResourceParamsArray = createChildResourceParams(config);
    if (process.env.NODE_ENV !== 'production') {
        if (childResourceParamsArray.length !== childEnvelopes.length) {
            throw new Error(
                'Invalid composite resource response. Expected ' +
                    childResourceParamsArray.length +
                    ' items, received ' +
                    childEnvelopes.length
            );
        }
    }
    const snapshotStateFulfilled = 'Fulfilled';
    const key = keyBuilder(resourceParams);
    const { childSnapshotData, seenRecords, hasOnlyNonCachedErrors } =
        ingestSuccessChildResourceParams(luvio, childResourceParamsArray, childEnvelopes);
    const snapshot = {
        recordId: key,
        data: childSnapshotData,
        state: snapshotStateFulfilled,
        seenRecords: seenRecords,
        select: {
            recordId: key,
            node: adapterFragment(luvio, config),
            variables: {},
        },
        refresh: {
            config,
            resolve: () => buildNetworkSnapshot(luvio, config, snapshotRefreshOptions),
        },
        variables: {},
        hasOnlyNonCachedErrors,
    } as CompositeFulfilledSnapshot<BatchRepresentation, any>;

    luvio.storeBroadcast();
    return snapshot;
}
