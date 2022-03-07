import type { RecordLayoutRepresentation } from '../../../generated/types/RecordLayoutRepresentation';
import {
    keyBuilder as recordLayoutRepresentationKeyBuilder,
    select,
} from '../../../generated/types/RecordLayoutRepresentation';
import { buildNetworkSnapshot } from '../../../generated/adapters/getLayout';
import { snapshotRefreshOptions } from '../../../generated/adapters/adapter-utils';
import type { BuildSnapshotContext } from './utils';
import type { Selector, StoreLookup, Snapshot } from '@luvio/engine';

export function buildCachedSnapshotCachePolicy(
    context: BuildSnapshotContext,
    storeLookup: StoreLookup<RecordLayoutRepresentation>
): Snapshot<RecordLayoutRepresentation, any> {
    const { luvio, config } = context;

    const selector: Selector = {
        recordId: recordLayoutRepresentationKeyBuilder(config),
        node: select(),
        variables: {},
    };
    return storeLookup(selector, {
        config,
        resolve: () => buildNetworkSnapshot(luvio, config, snapshotRefreshOptions),
    });
}
