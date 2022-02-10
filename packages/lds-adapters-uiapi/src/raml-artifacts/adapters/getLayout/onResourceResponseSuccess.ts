import { ingest as recordLayoutRepresentationIngest } from '../../../generated/types/RecordLayoutRepresentation';
import type { RecordLayoutRepresentation } from '../../../generated/types/RecordLayoutRepresentation';
import {
    keyBuilder as recordLayoutRepresentationKeyBuilder,
    select,
} from '../../../generated/types/RecordLayoutRepresentation';
import type { GetLayoutConfigWithDefaults } from './utils';
import type { ResourceRequestConfig } from '../../../generated/resources/getUiApiLayoutByObjectApiName';
import { buildNetworkSnapshot } from '../../../generated/adapters/getLayout';
import { snapshotRefreshOptions } from '../../../generated/adapters/adapter-utils';

import type { Luvio, ResourceResponse } from '@luvio/engine';

export function onResourceResponseSuccess(
    luvio: Luvio,
    config: GetLayoutConfigWithDefaults,
    resourceParams: ResourceRequestConfig,
    response: ResourceResponse<RecordLayoutRepresentation>
) {
    const { body } = response;

    const key = recordLayoutRepresentationKeyBuilder(config);

    luvio.storeIngest<RecordLayoutRepresentation>(key, recordLayoutRepresentationIngest, body);
    const snapshot = luvio.storeLookup<RecordLayoutRepresentation>(
        {
            recordId: key,
            node: select(),
            variables: {},
        },
        {
            config,
            resolve: () => buildNetworkSnapshot(luvio, config, snapshotRefreshOptions),
        }
    );
    luvio.storeBroadcast();
    return snapshot;
}
