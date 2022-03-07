import type {
    CoercedAdapterRequestContext,
    DispatchResourceRequestContext,
    Snapshot,
} from '@luvio/engine';
import type { RecordAvatarBulkMapRepresentation } from '../../../generated/types/RecordAvatarBulkMapRepresentation';
import { buildNetworkSnapshot } from './buildNetworkSnapshot';
import type { BuildSnapshotContext } from './utils';

export function buildNetworkSnapshotCachePolicy(
    context: BuildSnapshotContext,
    coercedAdapterRequestContext: CoercedAdapterRequestContext
): Promise<Snapshot<RecordAvatarBulkMapRepresentation, any>> {
    const { luvio, config, uncachedRecordIds } = context;

    if (uncachedRecordIds !== undefined) {
        config.uncachedRecordIds = uncachedRecordIds;
    }

    const { networkPriority, requestCorrelator } = coercedAdapterRequestContext;

    const dispatchOptions: DispatchResourceRequestContext = {
        resourceRequestContext: {
            requestCorrelator,
        },
    };

    if (networkPriority !== 'normal') {
        dispatchOptions.overrides = {
            priority: networkPriority,
        };
    }

    return buildNetworkSnapshot(luvio, config, dispatchOptions);
}
