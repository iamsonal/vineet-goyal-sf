import { Snapshot, StoreLookup } from '@luvio/engine';
import { RecordAvatarBulkMapRepresentation } from '../../../generated/types/RecordAvatarBulkMapRepresentation';
import { snapshotRefreshOptions } from '../../../generated/adapters/adapter-utils';
import { buildNetworkSnapshot } from './buildNetworkSnapshot';
import { recordAvatarsSelector, BuildSnapshotContext } from './utils';
import { isUnfulfilledSnapshot } from '../../../util/snapshot';
import { ObjectKeys } from '../../../util/language';

export function buildInMemorySnapshotCachePolicy(
    context: BuildSnapshotContext,
    storeLookup: StoreLookup<RecordAvatarBulkMapRepresentation>
): Snapshot<RecordAvatarBulkMapRepresentation, any> {
    const { luvio, config } = context;
    const { recordIds } = config;

    const cachedSnapshot = storeLookup(recordAvatarsSelector(recordIds), {
        config,
        resolve: () => buildNetworkSnapshot(luvio, config, snapshotRefreshOptions),
    });

    // if the L1 lookup had some data but not all, then put the cache keys that were
    // missing onto the context, so buildNetworkSnapshotCachePolicy only requests
    // the missing records
    if (cachedSnapshot.data !== undefined && isUnfulfilledSnapshot(cachedSnapshot)) {
        context.uncachedRecordIds = ObjectKeys(cachedSnapshot.missingPaths).sort();
    }
    return cachedSnapshot;
}
