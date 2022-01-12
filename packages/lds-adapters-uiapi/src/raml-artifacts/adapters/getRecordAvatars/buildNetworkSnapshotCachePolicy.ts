import { CoercedAdapterRequestContext, Snapshot } from '@luvio/engine';
import { RecordAvatarBulkMapRepresentation } from '../../../generated/types/RecordAvatarBulkMapRepresentation';
import { buildNetworkSnapshot } from './buildNetworkSnapshot';
import { BuildSnapshotContext } from './utils';

export function buildNetworkSnapshotCachePolicy(
    context: BuildSnapshotContext,
    requestContext: CoercedAdapterRequestContext
): Promise<Snapshot<RecordAvatarBulkMapRepresentation, any>> {
    const { luvio, config, uncachedRecordIds } = context;

    if (uncachedRecordIds !== undefined) {
        config.uncachedRecordIds = uncachedRecordIds;
    }

    let override = undefined;
    const { networkPriority } = requestContext;
    if (networkPriority !== 'normal') {
        override = {
            priority: networkPriority,
        };
    }

    return buildNetworkSnapshot(luvio, config, override);
}
