import { Luvio, Snapshot } from '@luvio/engine';
import { RecordAvatarBulkMapRepresentation } from '../../../generated/types/RecordAvatarBulkMapRepresentation';
import { snapshotRefreshOptions } from '../../../generated/adapters/adapter-utils';
import { buildNetworkSnapshot } from './buildNetworkSnapshot';
import { GetRecordAvatarsConfig, recordAvatarsSelector } from './utils';

export function buildInMemorySnapshot(
    luvio: Luvio,
    config: GetRecordAvatarsConfig
): Snapshot<RecordAvatarBulkMapRepresentation, any> {
    const { recordIds } = config;
    return luvio.storeLookup<RecordAvatarBulkMapRepresentation>(recordAvatarsSelector(recordIds), {
        config,
        resolve: () => buildNetworkSnapshot(luvio, config, snapshotRefreshOptions),
    });
}
