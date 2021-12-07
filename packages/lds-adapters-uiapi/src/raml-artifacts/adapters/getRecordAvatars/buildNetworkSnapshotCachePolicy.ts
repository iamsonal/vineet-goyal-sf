import { Snapshot } from '@luvio/engine';
import { RecordAvatarBulkMapRepresentation } from '../../../generated/types/RecordAvatarBulkMapRepresentation';
import { buildNetworkSnapshot } from './buildNetworkSnapshot';
import { BuildSnapshotContext } from './utils';

export function buildNetworkSnapshotCachePolicy(
    context: BuildSnapshotContext
): Promise<Snapshot<RecordAvatarBulkMapRepresentation, any>> {
    const { luvio, config, uncachedRecordIds } = context;

    if (uncachedRecordIds !== undefined) {
        config.uncachedRecordIds = uncachedRecordIds;
    }

    return buildNetworkSnapshot(luvio, config);
}
