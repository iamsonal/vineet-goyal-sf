import type { Luvio, Snapshot, StoreLookup, Selector } from '@luvio/engine';

import type { RecordLayoutUserStateRepresentation } from '../../../generated/types/RecordLayoutUserStateRepresentation';
import { keyBuilder, select } from '../../../generated/types/RecordLayoutUserStateRepresentation';

import type { GetLayoutUserStateConfig } from './getLayoutUserStateConfig';
import { buildNetworkSnapshot } from './buildNetworkSnapshot';

type BuildSnapshotContext = {
    config: GetLayoutUserStateConfig;
    luvio: Luvio;
};

export function buildCachedSnapshotCachePolicy(
    context: BuildSnapshotContext,
    storeLookup: StoreLookup<RecordLayoutUserStateRepresentation>
): Snapshot<RecordLayoutUserStateRepresentation, any> {
    const { config, luvio } = context;
    const { objectApiName, recordTypeId, layoutType, mode } = config;

    const selector: Selector = {
        recordId: keyBuilder({
            apiName: objectApiName,
            recordTypeId,
            layoutType,
            mode,
        }),
        node: select(),
        variables: {},
    };

    return storeLookup(selector, {
        config,
        resolve: () => buildNetworkSnapshot(luvio, config),
    });
}
