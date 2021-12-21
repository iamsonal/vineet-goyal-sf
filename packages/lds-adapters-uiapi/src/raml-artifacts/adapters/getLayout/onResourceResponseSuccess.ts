import { ingest as recordLayoutRepresentationIngest } from '../../../generated/types/RecordLayoutRepresentation';
import {
    keyBuilder as recordLayoutRepresentationKeyBuilder,
    RecordLayoutRepresentation,
    select,
} from '../../../generated/types/RecordLayoutRepresentation';
import { GetLayoutConfigWithDefaults } from './utils';
import { ResourceRequestConfig } from '../../../generated/resources/getUiApiLayoutByObjectApiName';
import { buildNetworkSnapshot } from '../../../generated/adapters/getLayout';
import { snapshotRefreshOptions } from '../../../generated/adapters/adapter-utils';

import { Luvio, ResourceResponse } from '@luvio/engine';

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
